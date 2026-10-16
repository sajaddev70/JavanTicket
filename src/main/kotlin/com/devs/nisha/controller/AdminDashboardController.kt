package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.service.dashboard.AdminDashboardService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/admin/dashboard")
class AdminDashboardController(private val dashboardService: AdminDashboardService) {

    @GetMapping("/stats")
    fun getStats(@RequestParam(required = false) cityId: Long?): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(dashboardService.getStats(cityId))

    @GetMapping("/sales-chart")
    fun getSalesChart(
        @RequestParam(defaultValue = "30") days: Int,
        @RequestParam(required = false) cityId: Long?,
    ): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(dashboardService.getSalesChart(days.coerceIn(7, 90), cityId))

    @GetMapping("/cities")
    fun getCityStatus(): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(dashboardService.getCityStatus())

    @GetMapping("/today-sessions")
    fun getTodaySessions(
        @RequestParam(defaultValue = "5") limit: Int,
        @RequestParam(required = false) cityId: Long?,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.ok(dashboardService.getTodaySessions(limit.coerceIn(1, 50), cityId))

    @GetMapping("/alerts")
    fun getAlerts(@RequestParam(defaultValue = "5") limit: Int): ApiResponse<Map<String, Any>> =
        ApiResponse.ok(dashboardService.getAlerts(limit.coerceIn(1, 50)))
}
