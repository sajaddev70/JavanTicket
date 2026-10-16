package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.event.EventQueries.EVENT_SELECT
import com.devs.nisha.service.user.CurrentUser
import com.devs.nisha.support.JdbcCrud
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming

/** The signed-in user's profile and favorite events. */
@RestController
@RequestMapping("/api/v1/user")
class UserProfileController(private val crud: JdbcCrud, private val currentUser: CurrentUser) {

    @GetMapping("/profile")
    fun profile(authentication: Authentication): ApiResponse<Map<String, Any?>> = ApiResponse.ok(load(currentUser.id(authentication)))

    @PutMapping("/profile")
    fun update(authentication: Authentication, @Valid @RequestBody req: ProfileRequest): ApiResponse<Map<String, Any?>> {
        val userId = currentUser.id(authentication)
        if (req.cityId != null && !crud.exists("SELECT 1 FROM cities WHERE id = :id AND active = TRUE", mapOf("id" to req.cityId))) {
            throw BusinessException("شهر انتخاب‌شده معتبر نیست.")
        }
        val first = req.firstName!!.trim()
        val last = req.lastName!!.trim()
        crud.jdbc.update(
            "UPDATE users SET first_name = :first, last_name = :last, full_name = :full, email = :email, city_id = :cityId, updated_at = LOCALTIMESTAMP WHERE id = :id",
            mapOf("first" to first, "last" to last, "full" to "$first $last", "email" to req.email?.trim()?.ifBlank { null }, "cityId" to req.cityId, "id" to userId),
        )
        return ApiResponse.ok("اطلاعات حساب کاربری ذخیره شد.", load(userId))
    }

    /** Favorite events as event cards, most recently added first. */
    @GetMapping("/favorites")
    fun favorites(authentication: Authentication): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "$EVENT_SELECT JOIN user_favorites f ON f.event_id = e.id AND f.user_id = :userId WHERE e.status IN ('PUBLISHED', 'CANCELLED') " +
                "ORDER BY f.created_at DESC",
            mapOf("userId" to currentUser.id(authentication)),
        ),
    )

    @GetMapping("/favorites/ids")
    fun favoriteIds(authentication: Authentication): ApiResponse<List<Any?>> = ApiResponse.ok(
        crud.list("SELECT event_id FROM user_favorites WHERE user_id = :userId", mapOf("userId" to currentUser.id(authentication))).map { it["event_id"] },
    )

    @PutMapping("/favorites/{eventId}")
    fun addFavorite(authentication: Authentication, @PathVariable eventId: Long): ApiResponse<Unit> {
        if (!crud.exists("SELECT 1 FROM events WHERE id = :id AND status = 'PUBLISHED'", mapOf("id" to eventId))) {
            throw BusinessException("رویداد موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        }
        crud.jdbc.update(
            "INSERT INTO user_favorites (user_id, event_id) VALUES (:userId, :eventId) ON CONFLICT DO NOTHING",
            mapOf("userId" to currentUser.id(authentication), "eventId" to eventId),
        )
        return ApiResponse.ok("به علاقه‌مندی‌ها اضافه شد.", null)
    }

    @DeleteMapping("/favorites/{eventId}")
    fun removeFavorite(authentication: Authentication, @PathVariable eventId: Long): ApiResponse<Unit> {
        crud.jdbc.update(
            "DELETE FROM user_favorites WHERE user_id = :userId AND event_id = :eventId",
            mapOf("userId" to currentUser.id(authentication), "eventId" to eventId),
        )
        return ApiResponse.ok("از علاقه‌مندی‌ها حذف شد.", null)
    }

    private fun load(userId: Long): Map<String, Any?> = crud.one(
        "SELECT u.id, u.mobile, u.first_name, u.last_name, u.full_name, u.email, u.city_id, ci.name AS city_name, u.avatar_url, u.created_at, " +
            "(SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'PAID') AS orders_count, " +
            "(SELECT COUNT(*) FROM tickets t JOIN sessions s ON s.id = t.session_id WHERE t.user_id = u.id AND t.status <> 'CANCELLED' " +
            "AND s.end_time >= LOCALTIMESTAMP) AS upcoming_tickets_count, " +
            "(SELECT COUNT(*) FROM user_favorites f WHERE f.user_id = u.id) AS favorites_count " +
            "FROM users u LEFT JOIN cities ci ON ci.id = u.city_id WHERE u.id = :id",
        mapOf("id" to userId),
    ) ?: throw BusinessException("کاربر یافت نشد.", HttpStatus.NOT_FOUND)
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class ProfileRequest(
    @field:NotBlank(message = "نام را وارد کنید.") @field:Size(max = 50, message = "نام حداکثر ۵۰ کاراکتر است.") val firstName: String?,
    @field:NotBlank(message = "نام خانوادگی را وارد کنید.") @field:Size(max = 50, message = "نام خانوادگی حداکثر ۵۰ کاراکتر است.") val lastName: String?,
    @field:Email(message = "ایمیل واردشده معتبر نیست.") @field:Size(max = 100, message = "ایمیل حداکثر ۱۰۰ کاراکتر است.") val email: String? = null,
    val cityId: Long? = null,
)
