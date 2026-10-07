package com.youthevent.platform.controller;

import com.youthevent.platform.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicDataController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("todaySalesAmount", 48500000);
        stats.put("ticketsSoldToday", 240);
        stats.put("hallOccupancyPercent", 82.5);
        stats.put("schoolReservationsCount", 14);

        List<Map<String, Object>> salesChart = List.of(
            Map.of("day", "شنبه", "sales", 12000000),
            Map.of("day", "یکشنبه", "sales", 18000000),
            Map.of("day", "دوشنبه", "sales", 25000000),
            Map.of("day", "سه‌شنبه", "sales", 32000000),
            Map.of("day", "چهارشنبه", "sales", 40000000),
            Map.of("day", "پنج‌شنبه", "sales", 55000000),
            Map.of("day", "جمعه", "sales", 48500000)
        );
        stats.put("salesChart", salesChart);

        return ApiResponse.ok(stats);
    }

    @GetMapping("/cities")
    public ApiResponse<List<Map<String, Object>>> getCities() {
        List<Map<String, Object>> cities = jdbcTemplate.queryForList("SELECT id, name, province FROM cities WHERE active = TRUE");
        return ApiResponse.ok(cities);
    }

    @GetMapping("/categories")
    public ApiResponse<List<Map<String, Object>>> getCategories() {
        List<Map<String, Object>> categories = jdbcTemplate.queryForList("SELECT id, name, slug, icon FROM categories");
        return ApiResponse.ok(categories);
    }

    @GetMapping("/events")
    public ApiResponse<List<Map<String, Object>>> getEvents() {
        List<Map<String, Object>> events = jdbcTemplate.queryForList(
            "SELECT e.id, e.title, e.slug, e.description, e.banner_url, e.organizer_name, e.min_price, e.featured, e.popular, " +
            "c.name as category_name, ci.name as city_name, h.name as hall_name " +
            "FROM events e " +
            "LEFT JOIN categories c ON e.category_id = c.id " +
            "LEFT JOIN cities ci ON e.city_id = ci.id " +
            "LEFT JOIN halls h ON e.hall_id = h.id " +
            "WHERE e.status = 'PUBLISHED'"
        );
        return ApiResponse.ok(events);
    }
}
