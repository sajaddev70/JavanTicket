package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.activity.ActivityLogService
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.SqlFilters
import com.devs.nisha.support.likePattern
import com.devs.nisha.support.metric
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
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
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/** Finance overview, the transaction ledger and settlements with event organizers. */
@RestController
@RequestMapping("/api/v1/admin")
class AdminFinanceController(private val crud: JdbcCrud) {

    // ---------- Overview ----------

    /** Totals of [from, to] (default: last 30 days) compared with the period of the same length before it. */
    @GetMapping("/finance/overview")
    fun overview(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): ApiResponse<Map<String, Any?>> {
        val end = (to ?: LocalDate.now()).plusDays(1)
        val start = from ?: end.minusDays(30)
        if (!start.isBefore(end)) throw BusinessException("بازه تاریخ معتبر نیست.")
        val days = ChronoUnit.DAYS.between(start, end)
        val prevStart = start.minusDays(days)

        fun totals(a: LocalDate, b: LocalDate): Map<String, Double> {
            val p = mapOf("a" to a, "b" to b)
            val online = crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('PAID', 'REFUNDED') AND COALESCE(paid_at, created_at) >= :a AND COALESCE(paid_at, created_at) < :b", p)
            val refunds = crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'REFUNDED' AND refunded_at >= :a AND refunded_at < :b", p)
            val discounts = crud.number("SELECT COALESCE(SUM(discount_amount), 0) FROM orders WHERE status IN ('PAID', 'REFUNDED') AND COALESCE(paid_at, created_at) >= :a AND COALESCE(paid_at, created_at) < :b", p)
            val group = crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'PAID' AND paid_at >= :a AND paid_at < :b", p)
            val settled = crud.number("SELECT COALESCE(SUM(net_amount), 0) FROM settlements WHERE status = 'PAID' AND paid_at >= :a AND paid_at < :b", p)
            val commission = crud.number("SELECT COALESCE(SUM(commission_amount), 0) FROM settlements WHERE status IN ('APPROVED', 'PAID') AND created_at >= :a AND created_at < :b", p)
            return mapOf(
                "online" to online, "refunds" to refunds, "discounts" to discounts, "group" to group, "settled" to settled,
                "commission" to commission, "revenue" to online + group - refunds, "balance" to online + group - refunds - settled,
            )
        }
        val now = totals(start, end)
        val prev = totals(prevStart, start)

        val daily = crud.list(
            "SELECT d::date AS date, " +
                "(SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.status IN ('PAID', 'REFUNDED') AND COALESCE(o.paid_at, o.created_at) >= d AND COALESCE(o.paid_at, o.created_at) < d + INTERVAL '1 day') " +
                " + (SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i WHERE i.status = 'PAID' AND i.paid_at >= d AND i.paid_at < d + INTERVAL '1 day') AS income, " +
                "(SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.status = 'REFUNDED' AND o.refunded_at >= d AND o.refunded_at < d + INTERVAL '1 day') " +
                " + (SELECT COALESCE(SUM(st.net_amount), 0) FROM settlements st WHERE st.status = 'PAID' AND st.paid_at >= d AND st.paid_at < d + INTERVAL '1 day') AS expense " +
                "FROM generate_series(CAST(:a AS DATE), CAST(:b AS DATE) - 1, INTERVAL '1 day') d ORDER BY d",
            mapOf("a" to start, "b" to end),
        ).map { mapOf("date" to it["date"].toString(), "income" to it["income"], "expense" to it["expense"]) }

        val byCategory = crud.list(
            "SELECT COALESCE(c.name, 'بدون دسته') AS name, c.color, COALESCE(SUM(o.total_amount), 0) AS amount, COUNT(o.id) AS orders " +
                "FROM orders o JOIN sessions s ON s.id = o.session_id JOIN events e ON e.id = s.event_id LEFT JOIN categories c ON c.id = e.category_id " +
                "WHERE o.status = 'PAID' AND COALESCE(o.paid_at, o.created_at) >= :a AND COALESCE(o.paid_at, o.created_at) < :b " +
                "GROUP BY c.name, c.color ORDER BY amount DESC",
            mapOf("a" to start, "b" to end),
        )

        return ApiResponse.ok(
            linkedMapOf(
                "from" to start.toString(), "to" to end.minusDays(1).toString(),
                "revenue" to metric(now.getValue("revenue"), prev.getValue("revenue")),
                "online" to metric(now.getValue("online"), prev.getValue("online")),
                "group" to metric(now.getValue("group"), prev.getValue("group")),
                "refunds" to metric(now.getValue("refunds"), prev.getValue("refunds")),
                "discounts" to metric(now.getValue("discounts"), prev.getValue("discounts")),
                "settled" to metric(now.getValue("settled"), prev.getValue("settled")),
                "commission" to metric(now.getValue("commission"), prev.getValue("commission")),
                "balance" to metric(now.getValue("balance"), prev.getValue("balance")),
                "pendingSettlements" to crud.number("SELECT COALESCE(SUM(net_amount), 0) FROM settlements WHERE status IN ('PENDING', 'APPROVED')"),
                "outstandingInvoices" to crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'ISSUED'"),
                "daily" to daily,
                "byCategory" to byCategory,
            ),
        )
    }

    /** Ledger of money in (ticket sales, paid invoices) and out (refunds, settlements), newest first. */
    @GetMapping("/finance/transactions")
    fun transactions(
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
    ): ApiResponse<Map<String, Any?>> = ApiResponse.ok(crud.page("SELECT tx.*", LEDGER_FROM, ledgerFilters(type, q, from, to), "tx.at DESC, tx.reference DESC", page, size))

    @GetMapping("/finance/transactions/export")
    fun exportTransactions(
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): ResponseEntity<ByteArray> {
        val f = ledgerFilters(type, q, from, to)
        val rows = crud.list("SELECT tx.* $LEDGER_FROM${f.sql} ORDER BY tx.at DESC LIMIT 50000", f.params)
        val labels = mapOf("SALE" to "فروش بلیت", "REFUND" to "استرداد", "INVOICE" to "پیش‌فاکتور سازمانی", "SETTLEMENT" to "تسویه با برگزارکننده")
        return csv(
            "transactions.csv",
            listOf("نوع", "شماره مرجع", "تاریخ", "طرف حساب", "شرح", "واریز", "برداشت"),
            rows.map { r ->
                val incoming = r["direction"] == "IN"
                listOf(labels[r["type"]] ?: r["type"], r["reference"], r["at"], r["party"], r["description"], if (incoming) r["amount"] else "", if (incoming) "" else r["amount"])
            },
        )
    }

    private fun ledgerFilters(type: String?, q: String?, from: LocalDate?, to: LocalDate?) = SqlFilters()
        .whenPresent(type, "tx.type = :type", "type")
        .whenPresent(q, "(tx.reference ILIKE :q OR tx.party ILIKE :q OR tx.description ILIKE :q)", "q") { likePattern(it as String) }
        .whenPresent(from, "tx.at >= :from", "from")
        .whenPresent(to, "tx.at < :to", "to") { (it as LocalDate).plusDays(1) }

    // ---------- Settlements ----------

    @GetMapping("/settlements")
    fun settlements(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list("SELECT st.*, e.title AS event_title FROM settlements st LEFT JOIN events e ON e.id = st.event_id ORDER BY st.created_at DESC, st.id DESC"),
    )

    @GetMapping("/settlements/summary")
    fun settlementsSummary(): ApiResponse<Map<String, Any?>> {
        val monthStart = "DATE_TRUNC('month', CURRENT_DATE)"
        val prev = ">= $monthStart - INTERVAL '1 month' AND %s < LOCALTIMESTAMP - INTERVAL '1 month'"
        return ApiResponse.ok(
            linkedMapOf(
                "paid" to metric(
                    crud.number("SELECT COALESCE(SUM(net_amount), 0) FROM settlements WHERE status = 'PAID' AND paid_at >= $monthStart"),
                    crud.number("SELECT COALESCE(SUM(net_amount), 0) FROM settlements WHERE status = 'PAID' AND paid_at ${prev.format("paid_at")}"),
                ),
                "commission" to metric(
                    crud.number("SELECT COALESCE(SUM(commission_amount), 0) FROM settlements WHERE status IN ('APPROVED', 'PAID') AND created_at >= $monthStart"),
                    crud.number("SELECT COALESCE(SUM(commission_amount), 0) FROM settlements WHERE status IN ('APPROVED', 'PAID') AND created_at ${prev.format("created_at")}"),
                ),
                "pendingAmount" to crud.number("SELECT COALESCE(SUM(net_amount), 0) FROM settlements WHERE status = 'PENDING'"),
                "pendingCount" to crud.number("SELECT COUNT(*) FROM settlements WHERE status = 'PENDING'"),
                "approvedAmount" to crud.number("SELECT COALESCE(SUM(net_amount), 0) FROM settlements WHERE status = 'APPROVED'"),
                "approvedCount" to crud.number("SELECT COUNT(*) FROM settlements WHERE status = 'APPROVED'"),
            ),
        )
    }

    /** Paid ticket sales of an event in a period and its organizer, to prefill a new settlement. */
    @GetMapping("/settlements/calculate")
    fun calculate(
        @RequestParam eventId: Long,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): ApiResponse<Map<String, Any?>> {
        val event = crud.one("SELECT id, title, organizer_name FROM events WHERE id = :id", mapOf("id" to eventId)) ?: throw JdbcCrud.notFound()
        val params = mapOf("id" to eventId, "from" to from, "to" to to?.plusDays(1))
        val gross = crud.number(
            "SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o JOIN sessions s ON s.id = o.session_id WHERE s.event_id = :id AND o.status = 'PAID' " +
                "AND (CAST(:from AS DATE) IS NULL OR COALESCE(o.paid_at, o.created_at) >= CAST(:from AS DATE)) " +
                "AND (CAST(:to AS DATE) IS NULL OR COALESCE(o.paid_at, o.created_at) < CAST(:to AS DATE))",
            params,
        )
        val alreadySettled = crud.number("SELECT COALESCE(SUM(gross_amount), 0) FROM settlements WHERE event_id = :id AND status <> 'REJECTED'", params)
        return ApiResponse.ok(mapOf("gross_amount" to gross, "payee_name" to event["organizer_name"], "event_title" to event["title"], "already_settled" to alreadySettled))
    }

    @PostMapping("/settlements")
    fun createSettlement(@Valid @RequestBody req: SettlementRequest): ApiResponse<Long> {
        val id = crud.insert("settlements", req.columns() + mapOf("settlement_number" to "TMP-" + java.util.UUID.randomUUID().toString().take(20), "status" to "PENDING"))
        crud.jdbc.update("UPDATE settlements SET settlement_number = :n WHERE id = :id", mapOf("n" to "ST-${10_000 + id}", "id" to id))
        return ApiResponse.ok("درخواست تسویه ثبت شد.", id)
    }

    @PutMapping("/settlements/{id}")
    fun updateSettlement(@PathVariable id: Long, @Valid @RequestBody req: SettlementRequest): ApiResponse<Unit> {
        val status = crud.one("SELECT status FROM settlements WHERE id = :id", mapOf("id" to id))?.get("status") ?: throw JdbcCrud.notFound()
        if (status != "PENDING" && status != "REJECTED") throw BusinessException("تسویه تأییدشده یا پرداخت‌شده قابل ویرایش نیست.", HttpStatus.CONFLICT)
        crud.update("settlements", id, req.columns())
        return ApiResponse.ok("تسویه ویرایش شد.", null)
    }

    @PostMapping("/settlements/{id}/status")
    @Transactional
    fun changeSettlementStatus(@PathVariable id: Long, @Valid @RequestBody req: StatusRequest, request: HttpServletRequest): ApiResponse<Unit> {
        val row = crud.one("SELECT status, settlement_number FROM settlements WHERE id = :id FOR UPDATE", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        val from = row["status"] as String
        val allowed = when (req.status) {
            "APPROVED" -> from == "PENDING"
            "REJECTED" -> from == "PENDING" || from == "APPROVED"
            "PAID" -> from == "APPROVED"
            "PENDING" -> from == "REJECTED"
            else -> false
        }
        if (!allowed) throw BusinessException("تغییر وضعیت از «${LABELS[from]}» به «${LABELS[req.status] ?: req.status}» مجاز نیست.")
        val reference = req.referenceCode.blankToNull()
        if (req.status == "PAID" && reference == null) throw BusinessException("کد پیگیری واریز را وارد کنید.")
        crud.jdbc.update(
            "UPDATE settlements SET status = :status, reference_code = COALESCE(:ref, reference_code), " +
                "paid_at = CASE WHEN :status = 'PAID' THEN LOCALTIMESTAMP ELSE NULL END WHERE id = :id",
            mapOf("status" to req.status, "ref" to reference, "id" to id),
        )
        request.setAttribute(ActivityLogService.DESCRIPTION, "تغییر وضعیت تسویه ${row["settlement_number"]} به ${LABELS[req.status]}")
        return ApiResponse.ok("وضعیت تسویه به «${LABELS[req.status]}» تغییر کرد.", null)
    }

    @DeleteMapping("/settlements/{id}")
    fun deleteSettlement(@PathVariable id: Long): ApiResponse<Unit> {
        val status = crud.one("SELECT status FROM settlements WHERE id = :id", mapOf("id" to id))?.get("status") ?: throw JdbcCrud.notFound()
        if (status == "PAID" || status == "APPROVED") throw BusinessException("تسویه تأییدشده یا پرداخت‌شده قابل حذف نیست.", HttpStatus.CONFLICT)
        crud.delete("settlements", id)
        return ApiResponse.ok("تسویه حذف شد.", null)
    }

    private companion object {
        val LABELS = mapOf("PENDING" to "در انتظار بررسی", "APPROVED" to "تأیید شده", "PAID" to "پرداخت شده", "REJECTED" to "رد شده")

        const val LEDGER_FROM =
            "FROM (" +
                "SELECT 'SALE' AS type, 'IN' AS direction, o.order_number AS reference, COALESCE(o.paid_at, o.created_at) AS at, o.total_amount AS amount, " +
                "  COALESCE(u.full_name, u.mobile) AS party, e.title AS description, o.id AS source_id " +
                "  FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN sessions s ON s.id = o.session_id LEFT JOIN events e ON e.id = s.event_id " +
                "  WHERE o.status IN ('PAID', 'REFUNDED') " +
                "UNION ALL SELECT 'REFUND', 'OUT', o.order_number, o.refunded_at, o.total_amount, COALESCE(u.full_name, u.mobile), " +
                "  COALESCE(o.refund_reason, e.title), o.id " +
                "  FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN sessions s ON s.id = o.session_id LEFT JOIN events e ON e.id = s.event_id " +
                "  WHERE o.status = 'REFUNDED' AND o.refunded_at IS NOT NULL " +
                "UNION ALL SELECT 'INVOICE', 'IN', i.invoice_number, i.paid_at, i.total_amount, org.name, i.title, i.id " +
                "  FROM invoices i JOIN organizations org ON org.id = i.organization_id WHERE i.status = 'PAID' " +
                "UNION ALL SELECT 'SETTLEMENT', 'OUT', st.settlement_number, st.paid_at, st.net_amount, st.payee_name, COALESCE(ev.title, 'تسویه حساب'), st.id " +
                "  FROM settlements st LEFT JOIN events ev ON ev.id = st.event_id WHERE st.status = 'PAID'" +
                ") tx"
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class SettlementRequest(
    @field:NotBlank(message = "نام طرف حساب الزامی است.") @field:Size(max = 150) val payeeName: String?,
    val eventId: Long? = null,
    val periodFrom: LocalDate? = null,
    val periodTo: LocalDate? = null,
    @field:NotNull(message = "مبلغ فروش الزامی است.") @field:DecimalMin(value = "0", message = "مبلغ نمی‌تواند منفی باشد.") val grossAmount: BigDecimal?,
    @field:DecimalMin(value = "0") @field:DecimalMax(value = "100", message = "درصد کارمزد معتبر نیست.") val commissionPercent: BigDecimal? = BigDecimal(10),
    @field:Pattern(regexp = "(?i)^(IR\\d{24})?$", message = "شماره شبا باید به شکل IR و ۲۴ رقم باشد.") val iban: String? = null,
    val notes: String? = null,
) {
    fun columns(): Map<String, Any?> {
        if (periodFrom != null && periodTo != null && periodTo.isBefore(periodFrom)) throw BusinessException("پایان دوره نباید قبل از شروع آن باشد.")
        val percent = commissionPercent ?: BigDecimal.ZERO
        val commission = grossAmount!!.multiply(percent).divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
        return linkedMapOf(
            "payee_name" to payeeName!!.trim(), "event_id" to eventId, "period_from" to periodFrom, "period_to" to periodTo,
            "gross_amount" to grossAmount, "commission_percent" to percent, "commission_amount" to commission, "net_amount" to grossAmount - commission,
            "iban" to iban.blankToNull()?.uppercase(), "notes" to notes.blankToNull(),
        )
    }
}
