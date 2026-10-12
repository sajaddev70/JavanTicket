package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.activity.ActivityLogService
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.metric
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate

/** Schools & organizations, their group reservations and the pro-forma invoices issued to them. */
@RestController
@RequestMapping("/api/v1/admin")
class AdminGroupSalesController(private val crud: JdbcCrud) {

    // ---------- Organizations ----------

    @GetMapping("/organizations")
    fun organizations(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT o.*, c.name AS city_name, " +
                "(SELECT COUNT(*) FROM group_reservations g WHERE g.organization_id = o.id) AS reservations_count, " +
                "(SELECT COALESCE(SUM(g.seats), 0) FROM group_reservations g WHERE g.organization_id = o.id AND g.status IN ('CONFIRMED', 'COMPLETED')) AS confirmed_seats, " +
                "(SELECT MAX(g.created_at) FROM group_reservations g WHERE g.organization_id = o.id) AS last_reservation_at, " +
                "(SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i WHERE i.organization_id = o.id AND i.status IN ('ISSUED', 'PAID')) AS invoiced_amount, " +
                "(SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i WHERE i.organization_id = o.id AND i.status = 'PAID') AS paid_amount " +
                "FROM organizations o LEFT JOIN cities c ON c.id = o.city_id ORDER BY o.id DESC",
        ),
    )

    @GetMapping("/organizations/summary")
    fun organizationsSummary(): ApiResponse<Map<String, Any?>> {
        val monthStart = "DATE_TRUNC('month', CURRENT_DATE)"
        return ApiResponse.ok(
            linkedMapOf(
                "total" to metric(crud.number("SELECT COUNT(*) FROM organizations"), crud.number("SELECT COUNT(*) FROM organizations WHERE created_at < $monthStart")),
                "schools" to metric(
                    crud.number("SELECT COUNT(*) FROM organizations WHERE org_type = 'SCHOOL'"),
                    crud.number("SELECT COUNT(*) FROM organizations WHERE org_type = 'SCHOOL' AND created_at < $monthStart"),
                ),
                "activeThisMonth" to metric(
                    crud.number("SELECT COUNT(DISTINCT organization_id) FROM group_reservations WHERE created_at >= $monthStart"),
                    crud.number(
                        "SELECT COUNT(DISTINCT organization_id) FROM group_reservations WHERE created_at >= $monthStart - INTERVAL '1 month' " +
                            "AND created_at < LOCALTIMESTAMP - INTERVAL '1 month'",
                    ),
                ),
                "paidAmount" to metric(
                    crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'PAID' AND paid_at >= $monthStart"),
                    crud.number(
                        "SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'PAID' AND paid_at >= $monthStart - INTERVAL '1 month' " +
                            "AND paid_at < LOCALTIMESTAMP - INTERVAL '1 month'",
                    ),
                ),
            ),
        )
    }

    @PostMapping("/organizations")
    fun createOrganization(@Valid @RequestBody req: OrganizationRequest): ApiResponse<Long> =
        ApiResponse.ok("مدرسه / سازمان ثبت شد.", crud.insert("organizations", req.columns()))

    @PutMapping("/organizations/{id}")
    fun updateOrganization(@PathVariable id: Long, @Valid @RequestBody req: OrganizationRequest): ApiResponse<Unit> {
        crud.update("organizations", id, req.columns())
        return ApiResponse.ok("اطلاعات مدرسه / سازمان ویرایش شد.", null)
    }

    @DeleteMapping("/organizations/{id}")
    fun deleteOrganization(@PathVariable id: Long): ApiResponse<Unit> {
        val params = mapOf("id" to id)
        if (crud.exists("SELECT 1 FROM group_reservations WHERE organization_id = :id", params) || crud.exists("SELECT 1 FROM invoices WHERE organization_id = :id", params)) {
            throw BusinessException("برای این مجموعه رزرو یا پیش‌فاکتور ثبت شده است؛ به‌جای حذف، آن را غیرفعال کنید.", HttpStatus.CONFLICT)
        }
        crud.delete("organizations", id)
        return ApiResponse.ok("مدرسه / سازمان حذف شد.", null)
    }

    // ---------- Group reservations ----------

    @GetMapping("/group-reservations")
    fun groupReservations(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(crud.list("$RESERVATION_SELECT ORDER BY g.created_at DESC, g.id DESC"))

    @GetMapping("/group-reservations/summary")
    fun groupReservationsSummary(): ApiResponse<Map<String, Any?>> {
        val month = "created_at >= DATE_TRUNC('month', CURRENT_DATE)"
        val prev = "created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < LOCALTIMESTAMP - INTERVAL '1 month'"
        val confirmed = "status IN ('CONFIRMED', 'COMPLETED')"
        return ApiResponse.ok(
            linkedMapOf(
                "reservations" to metric(crud.number("SELECT COUNT(*) FROM group_reservations WHERE $month"), crud.number("SELECT COUNT(*) FROM group_reservations WHERE $prev")),
                "seats" to metric(
                    crud.number("SELECT COALESCE(SUM(seats), 0) FROM group_reservations WHERE $confirmed AND $month"),
                    crud.number("SELECT COALESCE(SUM(seats), 0) FROM group_reservations WHERE $confirmed AND $prev"),
                ),
                "amount" to metric(
                    crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM group_reservations WHERE $confirmed AND $month"),
                    crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM group_reservations WHERE $confirmed AND $prev"),
                ),
                "pending" to crud.number("SELECT COUNT(*) FROM group_reservations WHERE status = 'PENDING'"),
            ),
        )
    }

    @PostMapping("/group-reservations")
    @Transactional
    fun createGroupReservation(@Valid @RequestBody req: GroupReservationRequest): ApiResponse<Long> {
        val columns = req.columns(sessionPrice(req.sessionId))
        applyCapacity(null, columns)
        return ApiResponse.ok("رزرو گروهی ثبت شد.", crud.insert("group_reservations", columns))
    }

    @PutMapping("/group-reservations/{id}")
    @Transactional
    fun updateGroupReservation(@PathVariable id: Long, @Valid @RequestBody req: GroupReservationRequest): ApiResponse<Unit> {
        val old = crud.one("SELECT * FROM group_reservations WHERE id = :id FOR UPDATE", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        val columns = req.columns(sessionPrice(req.sessionId))
        // Keep the original confirmation time of a reservation that stays confirmed.
        if (old["confirmed_at"] != null && columns["status"] in CONFIRMED) columns.remove("confirmed_at")
        applyCapacity(old, columns)
        crud.update("group_reservations", id, columns)
        return ApiResponse.ok("رزرو گروهی ویرایش شد.", null)
    }

    @PostMapping("/group-reservations/{id}/status")
    @Transactional
    fun changeReservationStatus(@PathVariable id: Long, @Valid @RequestBody req: StatusRequest, request: HttpServletRequest): ApiResponse<Unit> {
        if (req.status !in setOf("PENDING", "CONFIRMED", "CANCELLED", "COMPLETED")) throw BusinessException("وضعیت رزرو معتبر نیست.")
        val old = crud.one("SELECT * FROM group_reservations WHERE id = :id FOR UPDATE", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        val columns = linkedMapOf<String, Any?>("session_id" to old["session_id"], "seats" to old["seats"], "status" to req.status)
        applyCapacity(old, columns)
        crud.jdbc.update(
            "UPDATE group_reservations SET status = :status, confirmed_at = CASE WHEN :status IN ('CONFIRMED', 'COMPLETED') " +
                "THEN COALESCE(confirmed_at, LOCALTIMESTAMP) ELSE NULL END WHERE id = :id",
            mapOf("status" to req.status, "id" to id),
        )
        request.setAttribute(ActivityLogService.DESCRIPTION, "تغییر وضعیت رزرو گروهی #$id به ${RESERVATION_LABELS[req.status]}")
        return ApiResponse.ok("وضعیت رزرو به «${RESERVATION_LABELS[req.status]}» تغییر کرد.", null)
    }

    @DeleteMapping("/group-reservations/{id}")
    @Transactional
    fun deleteGroupReservation(@PathVariable id: Long): ApiResponse<Unit> {
        val old = crud.one("SELECT * FROM group_reservations WHERE id = :id FOR UPDATE", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        if (crud.exists("SELECT 1 FROM invoices WHERE group_reservation_id = :id AND status = 'PAID'", mapOf("id" to id))) {
            throw BusinessException("پیش‌فاکتور این رزرو پرداخت شده است؛ به‌جای حذف، آن را «لغو» کنید.", HttpStatus.CONFLICT)
        }
        applyCapacity(old, linkedMapOf("session_id" to null, "seats" to 0, "status" to "CANCELLED"))
        crud.delete("group_reservations", id)
        return ApiResponse.ok("رزرو گروهی حذف شد.", null)
    }

    /** Issues a draft pro-forma invoice for a reservation (seats x unit price, with its group discount). */
    @PostMapping("/group-reservations/{id}/invoice")
    @Transactional
    fun invoiceForReservation(@PathVariable id: Long, request: HttpServletRequest): ApiResponse<Long> {
        val g = crud.one("$RESERVATION_SELECT WHERE g.id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        if (crud.exists("SELECT 1 FROM invoices WHERE group_reservation_id = :id AND status <> 'CANCELLED'", mapOf("id" to id))) {
            throw BusinessException("برای این رزرو قبلاً پیش‌فاکتور صادر شده است.", HttpStatus.CONFLICT)
        }
        val seats = (g["seats"] as Number).toInt()
        val unit = g["unit_price"] as BigDecimal
        val discount = unit.multiply(BigDecimal(seats)).multiply(g["discount_percent"] as BigDecimal).divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
        val what = listOfNotNull(g["event_title"] as String?, g["hall_name"] as String?).joinToString(" - ").ifEmpty { "رزرو گروهی" }
        val invoiceId = saveInvoice(
            null,
            InvoiceRequest(
                organizationId = (g["organization_id"] as Number).toLong(), groupReservationId = id,
                title = "پیش‌فاکتور رزرو گروهی $what", issueDate = LocalDate.now(), dueDate = LocalDate.now().plusDays(7),
                discountAmount = discount, taxPercent = BigDecimal(10), status = "DRAFT",
                items = listOf(InvoiceItemRequest("بلیت گروهی «$what»", seats, unit)),
            ),
        )
        request.setAttribute(ActivityLogService.DESCRIPTION, "صدور پیش‌فاکتور برای رزرو گروهی #$id")
        return ApiResponse.ok("پیش‌فاکتور صادر شد.", invoiceId)
    }

    private fun sessionPrice(sessionId: Long?): BigDecimal? =
        sessionId?.let { crud.one("SELECT price FROM sessions WHERE id = :id", mapOf("id" to it))?.get("price") as BigDecimal? }

    /**
     * Confirmed reservations take seats from their session's capacity: frees what [old] held (if it was confirmed)
     * and takes what [new] needs (if it is confirmed), failing when the session has no room left.
     */
    private fun applyCapacity(old: Map<String, Any?>?, new: Map<String, Any?>) {
        if (old != null && old["status"] in CONFIRMED && old["session_id"] != null) {
            crud.jdbc.update(
                "UPDATE sessions SET reserved_seats = GREATEST(0, reserved_seats - :n) WHERE id = :id",
                mapOf("n" to old["seats"], "id" to old["session_id"]),
            )
        }
        if (new["status"] in CONFIRMED && new["session_id"] != null) {
            val session = crud.one("SELECT status FROM sessions WHERE id = :id", mapOf("id" to new["session_id"])) ?: throw BusinessException("سانس انتخاب‌شده پیدا نشد.")
            if (session["status"] == "CANCELLED") throw BusinessException("سانس انتخاب‌شده لغو شده است.")
            val updated = crud.jdbc.update(
                "UPDATE sessions SET reserved_seats = reserved_seats + :n WHERE id = :id AND reserved_seats + :n <= capacity",
                mapOf("n" to new["seats"], "id" to new["session_id"]),
            )
            if (updated == 0) throw BusinessException("ظرفیت باقی‌مانده سانس برای این تعداد صندلی کافی نیست.", HttpStatus.CONFLICT)
        }
    }

    // ---------- Pro-forma invoices ----------

    @GetMapping("/invoices")
    fun invoices(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT i.*, o.name AS organization_name, o.org_type, c.name AS city_name, " +
                "(SELECT COUNT(*) FROM invoice_items it WHERE it.invoice_id = i.id) AS items_count, " +
                "(i.status = 'ISSUED' AND i.due_date < CURRENT_DATE) AS overdue " +
                "FROM invoices i JOIN organizations o ON o.id = i.organization_id LEFT JOIN cities c ON c.id = o.city_id " +
                "ORDER BY i.issue_date DESC, i.id DESC",
        ),
    )

    @GetMapping("/invoices/summary")
    fun invoicesSummary(): ApiResponse<Map<String, Any?>> {
        val monthStart = "DATE_TRUNC('month', CURRENT_DATE)"
        return ApiResponse.ok(
            linkedMapOf(
                "issued" to metric(
                    crud.number("SELECT COUNT(*) FROM invoices WHERE status <> 'CANCELLED' AND created_at >= $monthStart"),
                    crud.number("SELECT COUNT(*) FROM invoices WHERE status <> 'CANCELLED' AND created_at >= $monthStart - INTERVAL '1 month' AND created_at < LOCALTIMESTAMP - INTERVAL '1 month'"),
                ),
                "paid" to metric(
                    crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'PAID' AND paid_at >= $monthStart"),
                    crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'PAID' AND paid_at >= $monthStart - INTERVAL '1 month' AND paid_at < LOCALTIMESTAMP - INTERVAL '1 month'"),
                ),
                "outstanding" to crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'ISSUED'"),
                "outstandingCount" to crud.number("SELECT COUNT(*) FROM invoices WHERE status = 'ISSUED'"),
                "overdue" to crud.number("SELECT COUNT(*) FROM invoices WHERE status = 'ISSUED' AND due_date < CURRENT_DATE"),
                "drafts" to crud.number("SELECT COUNT(*) FROM invoices WHERE status = 'DRAFT'"),
            ),
        )
    }

    /** Invoice with its items, customer and the seller details printed on it. */
    @GetMapping("/invoices/{id}")
    fun invoice(@PathVariable id: Long): ApiResponse<Map<String, Any?>> {
        val invoice = crud.one(
            "SELECT i.*, o.name AS organization_name, o.org_type, o.contact_name, o.contact_mobile, o.phone AS organization_phone, " +
                "o.address AS organization_address, o.economic_code, c.name AS city_name " +
                "FROM invoices i JOIN organizations o ON o.id = i.organization_id LEFT JOIN cities c ON c.id = o.city_id WHERE i.id = :id",
            mapOf("id" to id),
        ) ?: throw JdbcCrud.notFound()
        val items = crud.list("SELECT * FROM invoice_items WHERE invoice_id = :id ORDER BY sort_order, id", mapOf("id" to id))
        val seller = crud.one("SELECT site_name, logo_url, contact_phone, contact_email, address FROM site_settings ORDER BY id LIMIT 1")
        return ApiResponse.ok(invoice + mapOf("items" to items, "seller" to seller))
    }

    @PostMapping("/invoices")
    @Transactional
    fun createInvoice(@Valid @RequestBody req: InvoiceRequest): ApiResponse<Long> = ApiResponse.ok("پیش‌فاکتور ثبت شد.", saveInvoice(null, req))

    @PutMapping("/invoices/{id}")
    @Transactional
    fun updateInvoice(@PathVariable id: Long, @Valid @RequestBody req: InvoiceRequest): ApiResponse<Unit> {
        saveInvoice(id, req)
        return ApiResponse.ok("پیش‌فاکتور ویرایش شد.", null)
    }

    @PostMapping("/invoices/{id}/status")
    @Transactional
    fun changeInvoiceStatus(@PathVariable id: Long, @Valid @RequestBody req: StatusRequest, request: HttpServletRequest): ApiResponse<Unit> {
        val invoice = crud.one("SELECT status, invoice_number FROM invoices WHERE id = :id FOR UPDATE", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        val from = invoice["status"] as String
        val allowed = when (req.status) {
            "ISSUED" -> from == "DRAFT"
            "PAID" -> from == "ISSUED" || from == "DRAFT"
            "CANCELLED" -> from != "CANCELLED"
            "DRAFT" -> from == "ISSUED"
            else -> false
        }
        if (!allowed) throw BusinessException("تغییر وضعیت از «${INVOICE_LABELS[from]}» به «${INVOICE_LABELS[req.status] ?: req.status}» مجاز نیست.")
        crud.jdbc.update(
            "UPDATE invoices SET status = :status, paid_at = CASE WHEN :status = 'PAID' THEN LOCALTIMESTAMP ELSE NULL END WHERE id = :id",
            mapOf("status" to req.status, "id" to id),
        )
        request.setAttribute(ActivityLogService.DESCRIPTION, "تغییر وضعیت پیش‌فاکتور ${invoice["invoice_number"]} به ${INVOICE_LABELS[req.status]}")
        return ApiResponse.ok("وضعیت پیش‌فاکتور به «${INVOICE_LABELS[req.status]}» تغییر کرد.", null)
    }

    @DeleteMapping("/invoices/{id}")
    fun deleteInvoice(@PathVariable id: Long): ApiResponse<Unit> {
        val status = crud.one("SELECT status FROM invoices WHERE id = :id", mapOf("id" to id))?.get("status") ?: throw JdbcCrud.notFound()
        if (status != "DRAFT" && status != "CANCELLED") throw BusinessException("فقط پیش‌فاکتورهای پیش‌نویس یا لغوشده قابل حذف هستند.", HttpStatus.CONFLICT)
        crud.delete("invoices", id)
        return ApiResponse.ok("پیش‌فاکتور حذف شد.", null)
    }

    /** Inserts or updates an invoice with its items and recalculated totals; returns its id. */
    private fun saveInvoice(id: Long?, req: InvoiceRequest): Long {
        if (id != null) {
            val status = crud.one("SELECT status FROM invoices WHERE id = :id FOR UPDATE", mapOf("id" to id))?.get("status") ?: throw JdbcCrud.notFound()
            if (status == "PAID" || status == "CANCELLED") throw BusinessException("پیش‌فاکتور پرداخت‌شده یا لغوشده قابل ویرایش نیست.", HttpStatus.CONFLICT)
        }
        if (req.dueDate != null && req.issueDate != null && req.dueDate.isBefore(req.issueDate)) throw BusinessException("مهلت پرداخت نباید قبل از تاریخ صدور باشد.")
        val items = req.items.orEmpty()
        val subtotal = items.fold(BigDecimal.ZERO) { sum, it -> sum + it.unitPrice!!.multiply(BigDecimal(it.quantity!!)) }
        val discount = (req.discountAmount ?: BigDecimal.ZERO).min(subtotal)
        val taxPercent = req.taxPercent ?: BigDecimal.ZERO
        val tax = (subtotal - discount).multiply(taxPercent).divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
        val columns = linkedMapOf<String, Any?>(
            "organization_id" to req.organizationId, "group_reservation_id" to req.groupReservationId, "title" to req.title!!.trim(),
            "issue_date" to (req.issueDate ?: LocalDate.now()), "due_date" to req.dueDate, "subtotal" to subtotal, "discount_amount" to discount,
            "tax_percent" to taxPercent, "tax_amount" to tax, "total_amount" to subtotal - discount + tax, "notes" to req.notes.blankToNull(),
        )
        val invoiceId = if (id == null) {
            crud.insert("invoices", columns + mapOf("invoice_number" to "TMP-" + java.util.UUID.randomUUID().toString().take(20), "status" to (req.status ?: "DRAFT"))).also {
                crud.jdbc.update("UPDATE invoices SET invoice_number = :n WHERE id = :id", mapOf("n" to "PF-${10_000 + it}", "id" to it))
            }
        } else {
            crud.update("invoices", id, columns)
            crud.jdbc.update("DELETE FROM invoice_items WHERE invoice_id = :id", mapOf("id" to id))
            id
        }
        items.forEachIndexed { i, item ->
            crud.insert(
                "invoice_items",
                linkedMapOf("invoice_id" to invoiceId, "description" to item.description!!.trim(), "quantity" to item.quantity, "unit_price" to item.unitPrice, "sort_order" to i),
            )
        }
        return invoiceId
    }

    private companion object {
        val CONFIRMED = setOf("CONFIRMED", "COMPLETED")
        val RESERVATION_LABELS = mapOf("PENDING" to "در انتظار تأیید", "CONFIRMED" to "تأیید شده", "CANCELLED" to "لغو شده", "COMPLETED" to "برگزار شده")
        val INVOICE_LABELS = mapOf("DRAFT" to "پیش‌نویس", "ISSUED" to "صادر شده", "PAID" to "پرداخت شده", "CANCELLED" to "لغو شده")

        const val RESERVATION_SELECT =
            "SELECT g.*, o.name AS organization_name, o.org_type, c.name AS city_name, s.start_time, s.end_time, s.capacity AS session_capacity, " +
                "s.reserved_seats AS session_reserved, s.price AS session_price, e.id AS event_id, e.title AS event_title, h.name AS hall_name, " +
                "inv.id AS invoice_id, inv.invoice_number, inv.status AS invoice_status " +
                "FROM group_reservations g JOIN organizations o ON o.id = g.organization_id " +
                "LEFT JOIN sessions s ON s.id = g.session_id LEFT JOIN events e ON e.id = s.event_id LEFT JOIN halls h ON h.id = s.hall_id " +
                "LEFT JOIN cities c ON c.id = COALESCE(h.city_id, o.city_id) " +
                "LEFT JOIN LATERAL (SELECT i.id, i.invoice_number, i.status FROM invoices i WHERE i.group_reservation_id = g.id AND i.status <> 'CANCELLED' " +
                "  ORDER BY i.id DESC LIMIT 1) inv ON TRUE "
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class StatusRequest(@field:NotBlank(message = "وضعیت جدید را مشخص کنید.") val status: String?, val referenceCode: String? = null)

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class OrganizationRequest(
    @field:NotBlank(message = "نام مدرسه / سازمان الزامی است.") @field:Size(max = 200) val name: String?,
    @field:Pattern(regexp = "SCHOOL|UNIVERSITY|ORGANIZATION|COMPANY", message = "نوع مجموعه معتبر نیست.") val orgType: String? = "SCHOOL",
    val cityId: Long? = null,
    @field:Size(max = 100) val contactName: String? = null,
    @field:Pattern(regexp = "^(09\\d{9})?$", message = "شماره همراه رابط معتبر نیست.") val contactMobile: String? = null,
    @field:Size(max = 30) val phone: String? = null,
    @field:Email(message = "ایمیل معتبر نیست.") @field:Size(max = 150) val email: String? = null,
    val address: String? = null,
    @field:Size(max = 30) val economicCode: String? = null,
    @field:Min(value = 0, message = "تعداد اعضا نمی‌تواند منفی باشد.") val membersCount: Int? = null,
    @field:Pattern(regexp = "ACTIVE|INACTIVE", message = "وضعیت معتبر نیست.") val status: String? = "ACTIVE",
    val notes: String? = null,
) {
    fun columns() = linkedMapOf(
        "name" to name!!.trim(), "org_type" to (orgType ?: "SCHOOL"), "city_id" to cityId, "contact_name" to contactName.blankToNull(),
        "contact_mobile" to contactMobile.blankToNull(), "phone" to phone.blankToNull(), "email" to email.blankToNull(), "address" to address.blankToNull(),
        "economic_code" to economicCode.blankToNull(), "members_count" to membersCount, "status" to (status ?: "ACTIVE"), "notes" to notes.blankToNull(),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class GroupReservationRequest(
    @field:NotNull(message = "مدرسه / سازمان را انتخاب کنید.") val organizationId: Long?,
    val sessionId: Long? = null,
    @field:NotNull(message = "تعداد صندلی الزامی است.") @field:Min(value = 1, message = "تعداد صندلی باید حداقل ۱ باشد.") val seats: Int?,
    @field:DecimalMin(value = "0", message = "قیمت نمی‌تواند منفی باشد.") val unitPrice: BigDecimal? = null,
    @field:DecimalMin(value = "0") @field:DecimalMax(value = "100", message = "درصد تخفیف حداکثر ۱۰۰ است.") val discountPercent: BigDecimal? = BigDecimal.ZERO,
    @field:Size(max = 100) val contactName: String? = null,
    @field:Pattern(regexp = "^(09\\d{9})?$", message = "شماره همراه رابط معتبر نیست.") val contactMobile: String? = null,
    val notes: String? = null,
    @field:Pattern(regexp = "PENDING|CONFIRMED|CANCELLED|COMPLETED", message = "وضعیت رزرو معتبر نیست.") val status: String? = "PENDING",
) {
    /** Columns with the total; without a unit price the session's price is used. */
    fun columns(sessionPrice: BigDecimal?): LinkedHashMap<String, Any?> {
        val unit = unitPrice ?: sessionPrice ?: BigDecimal.ZERO
        val discount = discountPercent ?: BigDecimal.ZERO
        val total = unit.multiply(BigDecimal(seats!!)).multiply(BigDecimal(100) - discount).divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
        val st = status ?: "PENDING"
        return linkedMapOf(
            "organization_id" to organizationId, "session_id" to sessionId, "seats" to seats, "unit_price" to unit, "discount_percent" to discount,
            "total_amount" to total, "contact_name" to contactName.blankToNull(), "contact_mobile" to contactMobile.blankToNull(),
            "notes" to notes.blankToNull(), "status" to st,
            "confirmed_at" to if (st == "CONFIRMED" || st == "COMPLETED") java.sql.Timestamp(System.currentTimeMillis()) else null,
        )
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class InvoiceItemRequest(
    @field:NotBlank(message = "شرح ردیف پیش‌فاکتور الزامی است.") @field:Size(max = 300) val description: String?,
    @field:NotNull(message = "تعداد الزامی است.") @field:Min(value = 1, message = "تعداد باید حداقل ۱ باشد.") val quantity: Int?,
    @field:NotNull(message = "مبلغ واحد الزامی است.") @field:DecimalMin(value = "0", message = "مبلغ نمی‌تواند منفی باشد.") val unitPrice: BigDecimal?,
)

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class InvoiceRequest(
    @field:NotNull(message = "مدرسه / سازمان را انتخاب کنید.") val organizationId: Long?,
    val groupReservationId: Long? = null,
    @field:NotBlank(message = "عنوان پیش‌فاکتور الزامی است.") @field:Size(max = 200) val title: String?,
    val issueDate: LocalDate? = null,
    val dueDate: LocalDate? = null,
    @field:DecimalMin(value = "0", message = "تخفیف نمی‌تواند منفی باشد.") val discountAmount: BigDecimal? = BigDecimal.ZERO,
    @field:DecimalMin(value = "0") @field:DecimalMax(value = "100", message = "درصد مالیات معتبر نیست.") val taxPercent: BigDecimal? = BigDecimal(10),
    val notes: String? = null,
    @field:Pattern(regexp = "DRAFT|ISSUED", message = "پیش‌فاکتور جدید باید پیش‌نویس یا صادرشده باشد.") val status: String? = "DRAFT",
    @field:NotEmpty(message = "حداقل یک ردیف به پیش‌فاکتور اضافه کنید.") @field:Valid val items: List<InvoiceItemRequest>? = null,
)
