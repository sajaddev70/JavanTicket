package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.repository.UserRepository
import com.devs.nisha.support.JdbcCrud
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.time.YearMonth
import java.util.UUID

/** The signed-in admin, the panel's navigation and image uploads. */
@RestController
@RequestMapping("/api/v1/admin")
class AdminSystemController(
    private val crud: JdbcCrud,
    private val userRepository: UserRepository,
    @Value("\${app.upload-dir:uploads}") uploadDir: String,
) {
    private val uploadRoot: Path = Path.of(uploadDir).toAbsolutePath().normalize()

    @GetMapping("/me")
    fun me(authentication: Authentication): ApiResponse<Map<String, Any?>> {
        val user = userRepository.findByMobileAndUserType(authentication.name, "ADMIN") ?: throw JdbcCrud.notFound()
        return ApiResponse.ok(
            linkedMapOf(
                "id" to user.id,
                "mobile" to user.mobile,
                "fullName" to user.fullName,
                "email" to user.email,
                "avatarUrl" to user.avatarUrl,
                "roles" to user.roles.map { mapOf("name" to it.name, "title" to it.titleFa) },
                "permissions" to user.roles.flatMap { it.permissions }.map { it.code }.toSet(),
            ),
        )
    }

    /** Sidebar groups and the "menu structure" page, both read from admin_menu_sections / admin_menu_items. */
    @GetMapping("/menu")
    fun menu(): ApiResponse<Map<String, Any?>> {
        val items = crud.list(
            "SELECT id, item_key AS \"key\", title, description, path, icon, section_id, section_order, sidebar_group, sidebar_order, implemented " +
                "FROM admin_menu_items WHERE active = TRUE ORDER BY sidebar_group, sidebar_order, id",
        )
        val sections = crud.list("SELECT * FROM admin_menu_sections ORDER BY sort_order, id").map { section ->
            section + ("items" to items.filter { it["section_id"] == section["id"] }.sortedBy { (it["section_order"] as Number?)?.toInt() ?: 0 })
        }
        val sidebar = items.groupBy { it["sidebar_group"] }.values.toList()
        return ApiResponse.ok(mapOf("sidebar" to sidebar, "sections" to sections))
    }

    /** Stores an image and returns its public URL (served by WebConfig under /uploads/). */
    @PostMapping("/uploads", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun upload(@RequestParam("file") file: MultipartFile): ApiResponse<Map<String, String>> {
        if (file.isEmpty) throw BusinessException("فایلی انتخاب نشده است.")
        if (file.size > MAX_UPLOAD_BYTES) throw BusinessException("حجم تصویر حداکثر ۵ مگابایت است.", HttpStatus.PAYLOAD_TOO_LARGE)

        // Trust the file's bytes, not its name or the browser-sent content type.
        val bytes = file.bytes
        val extension = imageExtension(bytes)
            ?: throw BusinessException("فقط تصاویر PNG، JPG، WEBP یا GIF قابل بارگذاری هستند.", HttpStatus.UNSUPPORTED_MEDIA_TYPE)

        val month = YearMonth.now()
        val relative = "%d/%02d/%s.%s".format(month.year, month.monthValue, UUID.randomUUID(), extension)
        val target = uploadRoot.resolve(relative).normalize()
        Files.createDirectories(target.parent)
        Files.write(target, bytes)
        return ApiResponse.ok("تصویر بارگذاری شد.", mapOf("url" to "/uploads/$relative"))
    }

    private fun imageExtension(b: ByteArray): String? = when {
        b.startsWith(0x89, 0x50, 0x4E, 0x47) -> "png"
        b.startsWith(0xFF, 0xD8, 0xFF) -> "jpg"
        b.startsWith(0x47, 0x49, 0x46, 0x38) -> "gif"
        b.size > 12 && b.startsWith(0x52, 0x49, 0x46, 0x46) && String(b, 8, 4, Charsets.US_ASCII) == "WEBP" -> "webp"
        else -> null
    }

    private fun ByteArray.startsWith(vararg prefix: Int) =
        size >= prefix.size && prefix.indices.all { this[it] == prefix[it].toByte() }

    private companion object {
        const val MAX_UPLOAD_BYTES = 5L * 1024 * 1024
    }
}
