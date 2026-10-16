package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.service.seatmap.SeatHoldService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming

/**
 * Seat locks from the seat map. Buyers may pick seats before signing in, so a lock belongs to the browser's random
 * hold token (X-Hold-Token header); checkout turns the token's seats into the signed-in user's order.
 */
@RestController
@RequestMapping("/api/v1/public/sessions/{sessionId}/holds")
class SeatHoldController(private val holds: SeatHoldService) {

    @GetMapping
    fun holds(@PathVariable sessionId: Long, @RequestHeader(HOLD_HEADER) token: String): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(holds.holds(sessionId, token))

    @PostMapping
    fun hold(@PathVariable sessionId: Long, @RequestHeader(HOLD_HEADER) token: String, @Valid @RequestBody req: HoldRequest): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok("صندلی برای شما نگه داشته شد.", holds.hold(sessionId, req.seatId!!, token))

    @DeleteMapping("/{seatId}")
    fun release(@PathVariable sessionId: Long, @PathVariable seatId: Long, @RequestHeader(HOLD_HEADER) token: String): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok("صندلی آزاد شد.", holds.release(sessionId, seatId, token))

    @DeleteMapping
    fun releaseAll(@PathVariable sessionId: Long, @RequestHeader(HOLD_HEADER) token: String): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok("انتخاب صندلی‌ها لغو شد.", holds.releaseAll(sessionId, token))

    companion object {
        const val HOLD_HEADER = "X-Hold-Token"
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class HoldRequest(@field:NotNull(message = "صندلی مشخص نشده است.") val seatId: Long?)
