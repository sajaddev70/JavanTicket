package com.devs.nisha.security

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.support.JdbcCrud
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

/** The signed-in admin with the permission codes of all their roles. SUPER_ADMIN may do everything. */
data class AdminPrincipal(
    val id: Long,
    val mobile: String,
    val fullName: String?,
    val superAdmin: Boolean,
    val permissions: Set<String>,
) {
    fun can(code: String) = superAdmin || code in permissions
}

/**
 * Loads the current admin (once per request) and knows which permission each admin API section needs.
 * Permission codes are the admin menu item keys (admin_menu_items.permission_code).
 */
@Component
class AdminAccess(private val crud: JdbcCrud) {

    fun load(mobile: String): AdminPrincipal? {
        val user = crud.one("SELECT id, mobile, full_name FROM users WHERE mobile = :m AND user_type = 'ADMIN'", mapOf("m" to mobile)) ?: return null
        val roles = crud.list(
            "SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :id",
            mapOf("id" to user["id"]),
        ).map { it["name"] as String }
        val permissions = crud.list(
            "SELECT DISTINCT p.code FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id " +
                "JOIN permissions p ON p.id = rp.permission_id WHERE ur.user_id = :id",
            mapOf("id" to user["id"]),
        ).map { it["code"] as String }.toSet()
        return AdminPrincipal((user["id"] as Number).toLong(), mobile, user["full_name"] as String?, SUPER_ADMIN in roles, permissions)
    }

    /** The admin of the current request (cached on the request by [AdminPermissionInterceptor]). */
    fun current(request: HttpServletRequest): AdminPrincipal =
        request.getAttribute(ATTRIBUTE) as AdminPrincipal?
            ?: SecurityContextHolder.getContext().authentication?.name?.let(::load)?.also { request.setAttribute(ATTRIBUTE, it) }
            ?: throw BusinessException("نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.", HttpStatus.UNAUTHORIZED)

    /** Permission codes that allow a request, or null when any admin may make it. */
    fun requiredPermissions(method: String, path: String): Section? {
        val segments = path.removePrefix(ADMIN_PREFIX).trim('/').split('/')
        val first = segments.firstOrNull().orEmpty()
        val section = when {
            first == "sessions" && segments.size > 2 && segments[2] in setOf("seat-map", "seats") -> Section(listOf("sessions", "seatMaps"), write = listOf("sessions", "seatMaps"))
            first == "halls" && segments.size > 2 -> Section(listOf("halls", "seatMaps"), write = listOf("halls", "seatMaps"))
            else -> SECTIONS[first]
        } ?: return null
        // Lists used as lookups by other screens (e.g. cities in the halls form) are readable by every admin.
        return if (method == "GET" && !section.privateRead) null else section
    }

    /** [permissions] may read (when [privateRead]); [write] may change data. */
    data class Section(val permissions: List<String>, val privateRead: Boolean = false, val write: List<String> = permissions.take(1))

    companion object {
        const val ATTRIBUTE = "ADMIN_PRINCIPAL"
        const val SUPER_ADMIN = "SUPER_ADMIN"
        const val ADMIN_PREFIX = "/api/v1/admin"

        private fun open(vararg codes: String) = Section(codes.toList())
        private fun private(vararg codes: String) = Section(codes.toList(), privateRead = true)

        /** First path segment under /api/v1/admin -> section. Segments not listed (me, menu, uploads, dashboard) are open. */
        val SECTIONS: Map<String, Section> = mapOf(
            "events" to open("events"),
            "sessions" to open("sessions"),
            "categories" to open("categories"),
            "cities" to open("cities"),
            "halls" to open("halls"),
            "sections" to open("seatMaps"),
            "seats" to open("seatMaps"),
            "seat-tiers" to open("seatMaps"),
            "site-settings" to open("settings"),
            "banners" to open("banners"),
            "features" to open("features"),
            "home-sections" to open("homeSections"),
            "navigation" to open("navigation"),
            "link-groups" to open("navigation"),
            "links" to open("navigation"),
            "pages" to open("pages"),
            "newsletter" to private("newsletter"),
            "discounts" to open("discounts"),
            "page-blocks" to open("pageBlocks"),
            "alerts" to open("notifications"),
            "organizations" to open("organizations", "groupReservations", "invoices", "crm"),
            "orders" to private("orders", "crm", "finance"),
            "group-reservations" to private("groupReservations", "invoices"),
            "invoices" to private("invoices"),
            "gate" to private("gateControl"),
            "finance" to private("finance"),
            "settlements" to private("settlements"),
            "crm" to private("crm"),
            "reports" to private("reports"),
            "users" to private("users"),
            "roles" to private("roles", "users"),
            "permissions" to private("roles"),
            "activity-logs" to private("activityLogs"),
        )
    }
}

/** Rejects admin API calls the signed-in admin's roles do not allow. */
@Component
class AdminPermissionInterceptor(private val access: AdminAccess) : HandlerInterceptor {

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        if (request.method == "OPTIONS") return true
        val section = access.requiredPermissions(request.method, request.requestURI) ?: return true
        val admin = access.current(request)
        val allowed = (if (request.method == "GET") section.permissions else section.write).any(admin::can)
        if (!allowed) throw BusinessException("شما دسترسی لازم برای این بخش را ندارید.", HttpStatus.FORBIDDEN)
        return true
    }
}
