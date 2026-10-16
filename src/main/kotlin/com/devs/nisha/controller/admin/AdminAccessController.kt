package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.security.AdminAccess
import com.devs.nisha.security.AdminPrincipal
import com.devs.nisha.service.activity.ActivityLogService
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.SqlFilters
import com.devs.nisha.support.likePattern
import com.devs.nisha.support.metric
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming
import java.time.LocalDate

/**
 * Users & admins, roles with their permissions and the admin activity log.
 * Admins can never give anyone (themselves included) more access than they have; only super admins edit roles.
 */
@RestController
@RequestMapping("/api/v1/admin")
class AdminAccessController(private val crud: JdbcCrud, private val access: AdminAccess) {

    // ---------- Users & admins ----------

    @GetMapping("/users")
    fun users(
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) roleId: Long?,
        @RequestParam(required = false) q: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
    ): ApiResponse<Map<String, Any?>> {
        val f = SqlFilters()
            .whenPresent(type, "u.user_type = :type", "type")
            .whenPresent(status, "u.status = :status", "status")
            .whenPresent(roleId, "EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = :roleId)", "roleId")
            .whenPresent(q, "(u.full_name ILIKE :q OR u.mobile ILIKE :q OR u.email ILIKE :q)", "q") { likePattern(it as String) }
        val result = crud.page(USER_SELECT, "FROM users u", f, "(u.user_type = 'ADMIN') DESC, u.created_at DESC, u.id DESC", page, size)
        @Suppress("UNCHECKED_CAST")
        return ApiResponse.ok(result + ("items" to (result["items"] as List<Map<String, Any?>>).map(::withRoleIds)))
    }

    @GetMapping("/users/summary")
    fun usersSummary(): ApiResponse<Map<String, Any?>> {
        val monthStart = "DATE_TRUNC('month', CURRENT_DATE)"
        return ApiResponse.ok(
            linkedMapOf(
                "users" to metric(
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER'"),
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER' AND created_at < $monthStart"),
                ),
                "admins" to metric(
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'ADMIN'"),
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'ADMIN' AND created_at < $monthStart"),
                ),
                "newUsers" to metric(
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER' AND created_at >= $monthStart"),
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER' AND created_at >= $monthStart - INTERVAL '1 month' AND created_at < LOCALTIMESTAMP - INTERVAL '1 month'"),
                ),
                "disabled" to crud.number("SELECT COUNT(*) FROM users WHERE status = 'DISABLED'"),
                "adminsOnlineToday" to crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'ADMIN' AND last_login_at >= CURRENT_DATE"),
            ),
        )
    }

    @PostMapping("/users")
    @Transactional
    fun createUser(@Valid @RequestBody req: UserRequest, request: HttpServletRequest): ApiResponse<Long> {
        val me = access.current(request)
        val roleIds = checkAssignableRoles(me, req)
        val id = crud.insert("users", req.columns())
        setRoles(id, roleIds)
        request.setAttribute(ActivityLogService.DESCRIPTION, "ایجاد ${if (req.userType == "ADMIN") "مدیر" else "کاربر"} ${req.mobile}")
        return ApiResponse.ok("حساب کاربری ایجاد شد.", id)
    }

    @PutMapping("/users/{id}")
    @Transactional
    fun updateUser(@PathVariable id: Long, @Valid @RequestBody req: UserRequest, request: HttpServletRequest): ApiResponse<Unit> {
        val me = access.current(request)
        val user = crud.one("SELECT mobile, user_type FROM users WHERE id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        if (user["mobile"] == MAIN_ADMIN && (req.mobile != MAIN_ADMIN || req.userType != "ADMIN" || req.status != "ACTIVE")) {
            throw BusinessException("شماره، نوع حساب و وضعیت مدیر اصلی سامانه قابل تغییر نیست.", HttpStatus.CONFLICT)
        }
        if (id == me.id && req.status == "DISABLED") throw BusinessException("نمی‌توانید حساب خودتان را غیرفعال کنید.")
        val currentRoles = roleIdsOf(id)
        if (!me.superAdmin && currentRoles.any { !canGrant(me, it) }) {
            throw BusinessException("این حساب دسترسی‌هایی بیش از شما دارد و فقط مدیر ارشد می‌تواند آن را ویرایش کند.", HttpStatus.FORBIDDEN)
        }
        val roleIds = checkAssignableRoles(me, req)
        if (id == me.id && !me.superAdmin && roleIds != currentRoles) throw BusinessException("نقش‌های حساب خودتان را نمی‌توانید تغییر دهید.", HttpStatus.FORBIDDEN)
        if (user["mobile"] == MAIN_ADMIN && superAdminRoleId() !in roleIds) throw BusinessException("نقش مدیر ارشد از مدیر اصلی سامانه قابل حذف نیست.", HttpStatus.CONFLICT)
        crud.update("users", id, req.columns() + ("updated_at" to java.sql.Timestamp(System.currentTimeMillis())))
        setRoles(id, roleIds)
        return ApiResponse.ok("حساب کاربری ویرایش شد.", null)
    }

    @PostMapping("/users/{id}/status")
    fun changeUserStatus(@PathVariable id: Long, @Valid @RequestBody req: StatusRequest, request: HttpServletRequest): ApiResponse<Unit> {
        if (req.status !in setOf("ACTIVE", "DISABLED")) throw BusinessException("وضعیت معتبر نیست.")
        val me = access.current(request)
        val user = crud.one("SELECT mobile, full_name, user_type FROM users WHERE id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        if (req.status == "DISABLED") {
            if (user["mobile"] == MAIN_ADMIN) throw BusinessException("مدیر اصلی سامانه قابل غیرفعال شدن نیست.", HttpStatus.CONFLICT)
            if (id == me.id) throw BusinessException("نمی‌توانید حساب خودتان را غیرفعال کنید.")
            if (user["user_type"] == "ADMIN" && !me.superAdmin && roleIdsOf(id).any { !canGrant(me, it) }) {
                throw BusinessException("این مدیر دسترسی‌هایی بیش از شما دارد و فقط مدیر ارشد می‌تواند آن را غیرفعال کند.", HttpStatus.FORBIDDEN)
            }
        }
        crud.jdbc.update("UPDATE users SET status = :status, updated_at = LOCALTIMESTAMP WHERE id = :id", mapOf("status" to req.status, "id" to id))
        val label = if (req.status == "ACTIVE") "فعال" else "غیرفعال"
        request.setAttribute(ActivityLogService.DESCRIPTION, "$label کردن حساب ${user["full_name"] ?: user["mobile"]}")
        return ApiResponse.ok("حساب کاربری $label شد.", null)
    }

    @DeleteMapping("/users/{id}")
    fun deleteUser(@PathVariable id: Long, request: HttpServletRequest): ApiResponse<Unit> {
        val me = access.current(request)
        val user = crud.one("SELECT mobile FROM users WHERE id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        if (user["mobile"] == MAIN_ADMIN || id == me.id) throw BusinessException("این حساب قابل حذف نیست.", HttpStatus.CONFLICT)
        if (!me.superAdmin && roleIdsOf(id).any { !canGrant(me, it) }) throw BusinessException("فقط مدیر ارشد می‌تواند این حساب را حذف کند.", HttpStatus.FORBIDDEN)
        if (crud.exists("SELECT 1 FROM orders WHERE user_id = :id", mapOf("id" to id))) {
            throw BusinessException("این کاربر سفارش ثبت کرده است؛ به‌جای حذف، حساب را غیرفعال کنید.", HttpStatus.CONFLICT)
        }
        crud.delete("users", id)
        return ApiResponse.ok("حساب کاربری حذف شد.", null)
    }

    private fun roleIdsOf(userId: Long): Set<Long> =
        crud.list("SELECT role_id FROM user_roles WHERE user_id = :id", mapOf("id" to userId)).map { (it["role_id"] as Number).toLong() }.toSet()

    private fun superAdminRoleId(): Long? = crud.one("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'")?.get("id")?.let { (it as Number).toLong() }

    /** A role can be granted by super admins, or by admins who already hold every permission of that role. */
    private fun canGrant(me: AdminPrincipal, roleId: Long): Boolean {
        if (me.superAdmin) return true
        val role = crud.one("SELECT name FROM roles WHERE id = :id", mapOf("id" to roleId)) ?: return false
        if (role["name"] == AdminAccess.SUPER_ADMIN) return false
        return permissionsOf(roleId).all(me::can)
    }

    private fun checkAssignableRoles(me: AdminPrincipal, req: UserRequest): Set<Long> {
        val ids = req.roleIds.orEmpty().toSet()
        if (req.userType != "ADMIN") return emptySet()
        if (ids.isEmpty()) throw BusinessException("برای حساب مدیر حداقل یک نقش انتخاب کنید.")
        ids.forEach { if (!canGrant(me, it)) throw BusinessException("شما اجازه اعطای یکی از نقش‌های انتخاب‌شده را ندارید.", HttpStatus.FORBIDDEN) }
        return ids
    }

    private fun setRoles(userId: Long, roleIds: Set<Long>) {
        crud.jdbc.update("DELETE FROM user_roles WHERE user_id = :id", mapOf("id" to userId))
        roleIds.forEach { crud.jdbc.update("INSERT INTO user_roles (user_id, role_id) VALUES (:u, :r)", mapOf("u" to userId, "r" to it)) }
    }

    private fun withRoleIds(row: Map<String, Any?>): Map<String, Any?> =
        row + ("role_ids" to (row["role_ids"] as String?)?.split(',')?.filter { it.isNotBlank() }?.map { it.toLong() }.orEmpty())

    // ---------- Roles & permissions ----------

    @GetMapping("/roles")
    fun roles(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT r.*, (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS users_count, " +
                "(SELECT string_agg(p.code, ',' ORDER BY p.id) FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = r.id) AS permission_codes " +
                "FROM roles r ORDER BY r.system_role DESC, r.id",
        ).map { it + ("permissions" to (it["permission_codes"] as String?)?.split(',').orEmpty()) },
    )

    /** Permissions grouped like the admin menu. */
    @GetMapping("/permissions")
    fun permissions(): ApiResponse<List<Map<String, Any?>>> {
        val rows = crud.list(
            "SELECT p.code, p.title_fa AS title, m.description, COALESCE(s.title, 'سایر') AS section, COALESCE(s.sort_order, 99) AS section_order, " +
                "COALESCE(m.section_order, 0) AS item_order FROM permissions p LEFT JOIN admin_menu_items m ON m.item_key = p.code " +
                "LEFT JOIN admin_menu_sections s ON s.id = m.section_id ORDER BY section_order, item_order, p.id",
        )
        return ApiResponse.ok(
            rows.groupBy { it["section"] as String }.map { (title, items) ->
                mapOf("title" to title, "items" to items.map { mapOf("code" to it["code"], "title" to it["title"], "description" to it["description"]) })
            },
        )
    }

    @PostMapping("/roles")
    @Transactional
    fun createRole(@Valid @RequestBody req: RoleRequest, request: HttpServletRequest): ApiResponse<Long> {
        requireSuperAdmin(request)
        val id = crud.insert("roles", linkedMapOf("name" to req.name!!.trim().uppercase(), "title_fa" to req.titleFa!!.trim(), "description" to req.description.blankToNull()))
        setPermissions(id, req.permissions.orEmpty())
        return ApiResponse.ok("نقش ایجاد شد.", id)
    }

    @PutMapping("/roles/{id}")
    @Transactional
    fun updateRole(@PathVariable id: Long, @Valid @RequestBody req: RoleRequest, request: HttpServletRequest): ApiResponse<Unit> {
        requireSuperAdmin(request)
        val role = crud.one("SELECT name, system_role FROM roles WHERE id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        if (role["system_role"] == true) {
            // The super admin role always has every permission; only its title and description change.
            crud.jdbc.update("UPDATE roles SET title_fa = :t, description = :d WHERE id = :id", mapOf("t" to req.titleFa!!.trim(), "d" to req.description.blankToNull(), "id" to id))
            return ApiResponse.ok("نقش ویرایش شد.", null)
        }
        crud.update("roles", id, linkedMapOf("name" to req.name!!.trim().uppercase(), "title_fa" to req.titleFa!!.trim(), "description" to req.description.blankToNull()))
        setPermissions(id, req.permissions.orEmpty())
        return ApiResponse.ok("نقش و دسترسی‌های آن ذخیره شد.", null)
    }

    @DeleteMapping("/roles/{id}")
    fun deleteRole(@PathVariable id: Long, request: HttpServletRequest): ApiResponse<Unit> {
        requireSuperAdmin(request)
        val role = crud.one("SELECT system_role FROM roles WHERE id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        if (role["system_role"] == true) throw BusinessException("نقش سیستمی قابل حذف نیست.", HttpStatus.CONFLICT)
        if (crud.exists("SELECT 1 FROM user_roles WHERE role_id = :id", mapOf("id" to id))) {
            throw BusinessException("این نقش به کاربرانی اختصاص داده شده است؛ ابتدا نقش آن‌ها را تغییر دهید.", HttpStatus.CONFLICT)
        }
        crud.delete("roles", id)
        return ApiResponse.ok("نقش حذف شد.", null)
    }

    private fun requireSuperAdmin(request: HttpServletRequest) {
        if (!access.current(request).superAdmin) throw BusinessException("فقط مدیر ارشد می‌تواند نقش‌ها و دسترسی‌ها را تغییر دهد.", HttpStatus.FORBIDDEN)
    }

    private fun permissionsOf(roleId: Long): List<String> = crud.list(
        "SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = :id",
        mapOf("id" to roleId),
    ).map { it["code"] as String }

    private fun setPermissions(roleId: Long, codes: List<String>) {
        crud.jdbc.update("DELETE FROM role_permissions WHERE role_id = :id", mapOf("id" to roleId))
        if (codes.isEmpty()) return
        crud.jdbc.update(
            "INSERT INTO role_permissions (role_id, permission_id) SELECT :id, p.id FROM permissions p WHERE p.code IN (:codes)",
            mapOf("id" to roleId, "codes" to codes),
        )
    }

    // ---------- Activity log ----------

    @GetMapping("/activity-logs")
    fun activityLogs(
        @RequestParam(required = false) action: String?,
        @RequestParam(required = false) section: String?,
        @RequestParam(required = false) userId: Long?,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "15") size: Int,
    ): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(crud.page(LOG_SELECT, LOG_FROM, logFilters(action, section, userId, q, from, to), "l.created_at DESC, l.id DESC", page, size))

    @GetMapping("/activity-logs/summary")
    fun activityLogsSummary(): ApiResponse<Map<String, Any?>> = ApiResponse.ok(
        linkedMapOf(
            "today" to metric(
                crud.number("SELECT COUNT(*) FROM activity_logs WHERE created_at >= CURRENT_DATE"),
                crud.number("SELECT COUNT(*) FROM activity_logs WHERE created_at >= CURRENT_DATE - 1 AND created_at < LOCALTIMESTAMP - INTERVAL '1 day'"),
            ),
            "logins" to metric(
                crud.number("SELECT COUNT(*) FROM activity_logs WHERE action = 'LOGIN' AND created_at >= CURRENT_DATE"),
                crud.number("SELECT COUNT(*) FROM activity_logs WHERE action = 'LOGIN' AND created_at >= CURRENT_DATE - 1 AND created_at < LOCALTIMESTAMP - INTERVAL '1 day'"),
            ),
            "activeAdmins" to metric(
                crud.number("SELECT COUNT(DISTINCT user_id) FROM activity_logs WHERE created_at >= CURRENT_DATE"),
                crud.number("SELECT COUNT(DISTINCT user_id) FROM activity_logs WHERE created_at >= CURRENT_DATE - 1 AND created_at < CURRENT_DATE"),
            ),
            "deletes" to metric(
                crud.number("SELECT COUNT(*) FROM activity_logs WHERE action = 'DELETE' AND created_at >= CURRENT_DATE - 7"),
                crud.number("SELECT COUNT(*) FROM activity_logs WHERE action = 'DELETE' AND created_at >= CURRENT_DATE - 14 AND created_at < CURRENT_DATE - 7"),
            ),
            "actors" to crud.list(
                "SELECT DISTINCT u.id, COALESCE(u.full_name, u.mobile) AS name FROM activity_logs l JOIN users u ON u.id = l.user_id ORDER BY name",
            ),
            "sections" to crud.list(
                "SELECT DISTINCT l.section AS code, COALESCE(p.title_fa, l.section) AS title FROM activity_logs l " +
                    "LEFT JOIN permissions p ON p.code = l.section WHERE l.section IS NOT NULL ORDER BY title",
            ),
        ),
    )

    @GetMapping("/activity-logs/export")
    fun exportActivityLogs(
        @RequestParam(required = false) action: String?,
        @RequestParam(required = false) section: String?,
        @RequestParam(required = false) userId: Long?,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): ResponseEntity<ByteArray> {
        val f = logFilters(action, section, userId, q, from, to)
        val rows = crud.list("$LOG_SELECT $LOG_FROM${f.sql} ORDER BY l.created_at DESC LIMIT 50000", f.params)
        val labels = mapOf("LOGIN" to "ورود", "CREATE" to "ایجاد", "UPDATE" to "ویرایش", "DELETE" to "حذف", "ACTION" to "عملیات")
        return csv(
            "activity-log.csv",
            listOf("زمان", "کاربر", "موبایل", "عملیات", "بخش", "شرح", "آی‌پی"),
            rows.map { listOf(it["created_at"], it["actor_name"], it["actor_mobile"], labels[it["action"]] ?: it["action"], it["section_title"], it["description"], it["ip_address"]) },
        )
    }

    private fun logFilters(action: String?, section: String?, userId: Long?, q: String?, from: LocalDate?, to: LocalDate?) = SqlFilters()
        .whenPresent(action, "l.action = :action", "action")
        .whenPresent(section, "l.section = :section", "section")
        .whenPresent(userId, "l.user_id = :userId", "userId")
        .whenPresent(q, "(l.description ILIKE :q OR l.actor_mobile ILIKE :q OR l.actor_name ILIKE :q OR l.ip_address ILIKE :q)", "q") { likePattern(it as String) }
        .whenPresent(from, "l.created_at >= :from", "from")
        .whenPresent(to, "l.created_at < :to", "to") { (it as LocalDate).plusDays(1) }

    private companion object {
        const val MAIN_ADMIN = "09101414285"
        const val USER_SELECT =
            "SELECT u.id, u.mobile, u.full_name, u.email, u.status, u.user_type, u.avatar_url, u.notes, u.created_at, u.last_login_at, " +
                "(SELECT string_agg(r.title_fa, '، ' ORDER BY r.id) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) AS role_titles, " +
                "(SELECT string_agg(CAST(ur.role_id AS TEXT), ',' ORDER BY ur.role_id) FROM user_roles ur WHERE ur.user_id = u.id) AS role_ids, " +
                "(SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'PAID') AS orders_count, " +
                "(u.mobile = '$MAIN_ADMIN') AS main_admin"
        const val LOG_SELECT = "SELECT l.*, COALESCE(p.title_fa, l.section) AS section_title"
        const val LOG_FROM = "FROM activity_logs l LEFT JOIN permissions p ON p.code = l.section"
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class UserRequest(
    @field:NotBlank(message = "شماره همراه الزامی است.")
    @field:Pattern(regexp = "^09\\d{9}$", message = "شماره همراه معتبر نیست. (نمونه: 09123456789)")
    val mobile: String?,
    @field:Size(max = 100) val fullName: String? = null,
    @field:Email(message = "ایمیل معتبر نیست.") @field:Size(max = 100) val email: String? = null,
    @field:Pattern(regexp = "ADMIN|USER", message = "نوع حساب معتبر نیست.") val userType: String? = "USER",
    @field:Pattern(regexp = "ACTIVE|DISABLED", message = "وضعیت معتبر نیست.") val status: String? = "ACTIVE",
    val notes: String? = null,
    val roleIds: List<Long>? = null,
) {
    fun columns() = linkedMapOf(
        "mobile" to mobile!!.trim(), "full_name" to fullName.blankToNull(), "email" to email.blankToNull(),
        "user_type" to (userType ?: "USER"), "status" to (status ?: "ACTIVE"), "notes" to notes.blankToNull(),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class RoleRequest(
    @field:NotBlank(message = "کد نقش الزامی است.")
    @field:Pattern(regexp = "(?i)^[A-Z][A-Z0-9_]{1,49}$", message = "کد نقش فقط حروف انگلیسی، عدد و _ است (مثل SALES_AGENT).")
    val name: String?,
    @field:NotBlank(message = "عنوان نقش الزامی است.") @field:Size(max = 100) val titleFa: String?,
    @field:Size(max = 255) val description: String? = null,
    val permissions: List<String>? = null,
)
