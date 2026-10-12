package com.devs.nisha.service.activity

import com.devs.nisha.security.AdminAccess
import com.devs.nisha.security.AdminPrincipal
import com.devs.nisha.support.JdbcCrud
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.web.servlet.HandlerInterceptor

/** Writes the admin activity log (activity_logs). Logging never breaks the request that triggered it. */
@Service
class ActivityLogService(private val crud: JdbcCrud) {

    private val log = LoggerFactory.getLogger(javaClass)

    /** Persian titles of the permission codes, i.e. of the admin screens. */
    private val sectionTitles: Map<String, String> by lazy {
        crud.list("SELECT code, title_fa FROM permissions").associate { it["code"] as String to it["title_fa"] as String }
    }

    fun record(
        admin: AdminPrincipal?,
        action: String,
        section: String?,
        description: String,
        request: HttpServletRequest? = null,
        statusCode: Int? = null,
        mobile: String? = admin?.mobile,
    ) {
        try {
            crud.insert(
                "activity_logs",
                linkedMapOf(
                    "user_id" to admin?.id, "actor_mobile" to mobile, "actor_name" to admin?.fullName, "action" to action,
                    "section" to section, "description" to description.take(500), "method" to request?.method,
                    "path" to request?.requestURI?.take(300), "status_code" to statusCode,
                    "ip_address" to request?.let(::clientIp)?.take(64), "user_agent" to request?.getHeader("User-Agent")?.take(300),
                ),
            )
        } catch (ex: Exception) {
            log.warn("Could not write activity log [{} {}]: {}", action, description, ex.message)
        }
    }

    fun sectionTitle(code: String?): String? = code?.let { sectionTitles[it] ?: it }

    private fun clientIp(request: HttpServletRequest): String =
        request.getHeader("X-Forwarded-For")?.split(",")?.first()?.trim()?.takeIf { it.isNotEmpty() } ?: request.remoteAddr

    companion object {
        /** Request attribute a controller may set to describe what it did, e.g. "استرداد سفارش JT-100231". */
        const val DESCRIPTION = "ACTIVITY_DESCRIPTION"
    }
}

/** Logs every successful change (POST / PUT / PATCH / DELETE) made through the admin API. */
@Component
class ActivityLogInterceptor(private val access: AdminAccess, private val activity: ActivityLogService) : HandlerInterceptor {

    override fun afterCompletion(request: HttpServletRequest, response: HttpServletResponse, handler: Any, ex: Exception?) {
        val method = request.method
        if (method !in setOf("POST", "PUT", "PATCH", "DELETE") || response.status >= 400 || ex != null) return
        val path = request.requestURI.removePrefix(AdminAccess.ADMIN_PREFIX)
        // Uploads are followed by the save that uses them; gate scans have their own log (gate_scans).
        if (path.startsWith("/uploads") || path.startsWith("/gate/scan")) return

        val admin = runCatching { access.current(request) }.getOrNull()
        val code = access.requiredPermissions("POST", request.requestURI)?.permissions?.first()
        val section = activity.sectionTitle(code)
        val action = when (method) {
            "DELETE" -> "DELETE"
            "PUT", "PATCH" -> "UPDATE"
            else -> if (Regex("/\\d+/[a-z-]+$").containsMatchIn(path)) "ACTION" else "CREATE"
        }
        val description = request.getAttribute(ActivityLogService.DESCRIPTION) as String?
            ?: defaultDescription(action, section, path)
        activity.record(admin, action, code, description, request, response.status)
    }

    private fun defaultDescription(action: String, section: String?, path: String): String {
        val id = Regex("/(\\d+)").find(path)?.groupValues?.get(1)
        val where = section ?: "پنل مدیریت"
        val target = id?.let { " (شناسه $it)" }.orEmpty()
        return when (action) {
            "CREATE" -> "ثبت مورد جدید در بخش $where"
            "UPDATE" -> "ویرایش در بخش $where$target"
            "DELETE" -> "حذف از بخش $where$target"
            else -> "انجام عملیات «${path.substringAfterLast('/')}» در بخش $where$target"
        }
    }
}
