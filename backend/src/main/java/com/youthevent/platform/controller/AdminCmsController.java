package com.youthevent.platform.controller;

import com.youthevent.platform.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/cms")
@RequiredArgsConstructor
public class AdminCmsController {

    private final JdbcTemplate jdbcTemplate;

    // --- EVENTS CRUD ---
    @GetMapping("/events")
    public ApiResponse<List<Map<String, Object>>> getAllEvents() {
        List<Map<String, Object>> events = jdbcTemplate.queryForList(
            "SELECT e.*, c.name as category_name, ci.name as city_name, h.name as hall_name " +
            "FROM events e " +
            "LEFT JOIN categories c ON e.category_id = c.id " +
            "LEFT JOIN cities ci ON e.city_id = ci.id " +
            "LEFT JOIN halls h ON e.hall_id = h.id " +
            "ORDER BY e.id DESC"
        );
        return ApiResponse.ok(events);
    }

    @PostMapping("/events")
    public ApiResponse<String> createEvent(@RequestBody Map<String, Object> req) {
        jdbcTemplate.update(
            "INSERT INTO events (title, slug, category_id, city_id, hall_id, description, banner_url, organizer_name, min_price, status, featured, popular) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            req.get("title"),
            req.get("slug"),
            req.get("category_id"),
            req.get("city_id"),
            req.get("hall_id"),
            req.get("description"),
            req.get("banner_url"),
            req.get("organizer_name"),
            req.get("min_price"),
            req.getOrDefault("status", "PUBLISHED"),
            req.getOrDefault("featured", true),
            req.getOrDefault("popular", false)
        );
        return ApiResponse.ok("Event created successfully");
    }

    @PutMapping("/events/{id}")
    public ApiResponse<String> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        jdbcTemplate.update(
            "UPDATE events SET title = ?, slug = ?, description = ?, banner_url = ?, organizer_name = ?, min_price = ?, status = ?, featured = ? WHERE id = ?",
            req.get("title"),
            req.get("slug"),
            req.get("description"),
            req.get("banner_url"),
            req.get("organizer_name"),
            req.get("min_price"),
            req.get("status"),
            req.get("featured"),
            id
        );
        return ApiResponse.ok("Event updated successfully");
    }

    @DeleteMapping("/events/{id}")
    public ApiResponse<String> deleteEvent(@PathVariable Long id) {
        jdbcTemplate.update("DELETE FROM events WHERE id = ?", id);
        return ApiResponse.ok("Event deleted successfully");
    }

    // --- BANNERS CRUD ---
    @GetMapping("/banners")
    public ApiResponse<List<Map<String, Object>>> getBanners() {
        return ApiResponse.ok(jdbcTemplate.queryForList("SELECT * FROM banners ORDER BY sort_order ASC"));
    }

    @PostMapping("/banners")
    public ApiResponse<String> createBanner(@RequestBody Map<String, Object> req) {
        jdbcTemplate.update(
            "INSERT INTO banners (title, subtitle, image_url, link_url, button_text, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?)",
            req.get("title"),
            req.get("subtitle"),
            req.get("image_url"),
            req.get("link_url"),
            req.get("button_text"),
            req.getOrDefault("sort_order", 1),
            req.getOrDefault("active", true)
        );
        return ApiResponse.ok("Banner created successfully");
    }

    @DeleteMapping("/banners/{id}")
    public ApiResponse<String> deleteBanner(@PathVariable Long id) {
        jdbcTemplate.update("DELETE FROM banners WHERE id = ?", id);
        return ApiResponse.ok("Banner deleted successfully");
    }

    // --- SITE SETTINGS ---
    @GetMapping("/site-settings")
    public ApiResponse<Map<String, Object>> getSiteSettings() {
        List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT * FROM site_settings LIMIT 1");
        return ApiResponse.ok(list.isEmpty() ? Map.of() : list.get(0));
    }

    @PutMapping("/site-settings")
    public ApiResponse<String> updateSiteSettings(@RequestBody Map<String, Object> req) {
        jdbcTemplate.update(
            "UPDATE site_settings SET site_name = ?, logo_url = ?, contact_phone = ?, contact_email = ?, address = ?, footer_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
            req.get("site_name"),
            req.get("logo_url"),
            req.get("contact_phone"),
            req.get("contact_email"),
            req.get("address"),
            req.get("footer_text")
        );
        return ApiResponse.ok("Settings updated successfully");
    }
}
