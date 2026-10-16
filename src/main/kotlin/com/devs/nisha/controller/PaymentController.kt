package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.service.payment.DevPaymentGateway
import com.devs.nisha.service.payment.PaymentService
import com.devs.nisha.service.user.CurrentUser
import com.devs.nisha.support.JdbcCrud
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.util.HtmlUtils
import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Locale

/**
 * Online payment: available gateways, starting a payment, the gateways' callback (which verifies and redirects the
 * buyer to the user site's result page) and the result itself.
 */
@RestController
@RequestMapping("/api/v1")
class PaymentController(
    private val payments: PaymentService,
    private val currentUser: CurrentUser,
    private val crud: JdbcCrud,
    private val devGateway: ObjectProvider<DevPaymentGateway>,
) {

    @GetMapping("/user/payment-methods")
    fun methods(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(payments.methods())

    @PostMapping("/user/orders/{number}/payments")
    fun start(authentication: Authentication, @PathVariable number: String, @Valid @RequestBody req: StartPaymentRequest): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok("در حال انتقال به درگاه پرداخت...", payments.start(currentUser.id(authentication), number, req.gateway!!))

    @GetMapping("/user/payments/{id}")
    fun result(authentication: Authentication, @PathVariable id: Long): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(payments.result(currentUser.id(authentication), id))

    /** Gateways return the buyer here (GET or form POST); the backend verifies, then redirects to the user site. */
    @RequestMapping("/payments/callback/{gateway}", method = [RequestMethod.GET, RequestMethod.POST])
    fun callback(@PathVariable gateway: String, @RequestParam params: Map<String, String>): ResponseEntity<Void> =
        ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, payments.callback(gateway, params)).build()

    /** Test bank page of the development gateway. */
    @GetMapping("/payments/dev/{authority}", produces = [MediaType.TEXT_HTML_VALUE])
    fun devBankPage(@PathVariable authority: String): ResponseEntity<String> {
        if (devGateway.ifAvailable == null) return ResponseEntity.notFound().build()
        val payment = crud.one(
            "SELECT p.amount, p.status, o.order_number, (SELECT site_name FROM site_settings ORDER BY id LIMIT 1) AS site_name " +
                "FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.authority = :authority AND p.gateway = :gateway",
            mapOf("authority" to authority, "gateway" to DevPaymentGateway.CODE),
        ) ?: return ResponseEntity.notFound().build()
        val callback = "/api/v1/payments/callback/${DevPaymentGateway.CODE}"
        val amount = NumberFormat.getIntegerInstance(Locale.forLanguageTag("fa-IR")).format(payment["amount"] as BigDecimal)
        val esc = { v: Any? -> HtmlUtils.htmlEscape(v?.toString().orEmpty()) }
        val open = payment["status"] == "INITIATED"
        val html = """
            <!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>درگاه پرداخت آزمایشی</title>
            <style>
              body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef3fb;font-family:Tahoma,sans-serif;color:#0f1b33}
              .card{width:min(420px,calc(100% - 32px));background:#fff;border-radius:20px;padding:28px;box-shadow:0 12px 40px rgb(16 42 84/.12)}
              h1{font-size:20px;margin:0 0 6px}.muted{color:#66748a;font-size:13px;margin:0 0 20px}
              .row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e7ecf3;font-size:14px}
              .badge{display:inline-block;background:#fff4d6;color:#8a5a00;border-radius:8px;padding:4px 10px;font-size:12px;margin-bottom:14px}
              form{display:flex;gap:10px;margin-top:22px}button{flex:1;height:48px;border:0;border-radius:12px;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
              .pay{background:#1463e6;color:#fff}.cancel{background:#f1f5fb;color:#0f1b33}
            </style></head><body><main class="card">
            <span class="badge">محیط آزمایشی — مبلغی کسر نمی‌شود</span>
            <h1>درگاه پرداخت آزمایشی</h1><p class="muted">${esc(payment["site_name"])}</p>
            <div class="row"><span>شماره سفارش</span><b dir="ltr">${esc(payment["order_number"])}</b></div>
            <div class="row"><span>مبلغ قابل پرداخت</span><b>${esc(amount)} تومان</b></div>
            ${if (open) """
            <form method="post" action="$callback"><input type="hidden" name="authority" value="${esc(authority)}">
              <button class="pay" name="status" value="OK">پرداخت</button><button class="cancel" name="status" value="NOK">انصراف</button></form>
            """ else """<form method="get" action="$callback"><input type="hidden" name="authority" value="${esc(authority)}"><button class="cancel">بازگشت به سایت</button></form>"""}
            </main></body></html>
        """.trimIndent()
        return ResponseEntity.ok().contentType(MediaType("text", "html", Charsets.UTF_8)).body(html)
    }
}

data class StartPaymentRequest(@field:NotBlank(message = "روش پرداخت را انتخاب کنید.") @field:Size(max = 30) val gateway: String?)
