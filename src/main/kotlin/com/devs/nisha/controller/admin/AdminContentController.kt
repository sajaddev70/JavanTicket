package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.support.JdbcCrud
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
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
import java.time.Instant

/** Everything the user site renders besides events: settings, banners, menus, pages, features, home rows, alerts. */
@RestController
@RequestMapping("/api/v1/admin")
class AdminContentController(private val crud: JdbcCrud) {

    // ---------- Site settings ----------

    @GetMapping("/site-settings")
    fun siteSettings(): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(crud.list("SELECT * FROM site_settings ORDER BY id LIMIT 1").firstOrNull() ?: emptyMap())

    @PutMapping("/site-settings")
    fun updateSiteSettings(@Valid @RequestBody req: SiteSettingsRequest): ApiResponse<Unit> {
        val values = req.columns()
        val updated = crud.jdbc.update(
            "UPDATE site_settings SET ${values.keys.joinToString { "$it = :$it" }}, updated_at = CURRENT_TIMESTAMP " +
                "WHERE id = (SELECT MIN(id) FROM site_settings)",
            values,
        )
        if (updated == 0) crud.insert("site_settings", values)
        return ApiResponse.ok("تنظیمات با موفقیت ذخیره شد.", null)
    }

    // ---------- Banners ----------

    @GetMapping("/banners")
    fun banners(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list("SELECT b.*, e.title AS event_title FROM banners b LEFT JOIN events e ON e.id = b.event_id ORDER BY b.sort_order, b.id"),
    )

    @PostMapping("/banners")
    fun createBanner(@Valid @RequestBody req: BannerRequest): ApiResponse<Long> =
        ApiResponse.ok("بنر ثبت شد.", crud.insert("banners", req.columns()))

    @PutMapping("/banners/{id}")
    fun updateBanner(@PathVariable id: Long, @Valid @RequestBody req: BannerRequest): ApiResponse<Unit> {
        crud.update("banners", id, req.columns())
        return ApiResponse.ok("بنر ویرایش شد.", null)
    }

    @DeleteMapping("/banners/{id}")
    fun deleteBanner(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("banners", id)
        return ApiResponse.ok("بنر حذف شد.", null)
    }

    // ---------- Feature strip ----------

    @GetMapping("/features")
    fun features(): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(crud.list("SELECT * FROM site_features ORDER BY sort_order, id"))

    @PostMapping("/features")
    fun createFeature(@Valid @RequestBody req: FeatureRequest): ApiResponse<Long> =
        ApiResponse.ok("مورد ثبت شد.", crud.insert("site_features", req.columns()))

    @PutMapping("/features/{id}")
    fun updateFeature(@PathVariable id: Long, @Valid @RequestBody req: FeatureRequest): ApiResponse<Unit> {
        crud.update("site_features", id, req.columns())
        return ApiResponse.ok("مورد ویرایش شد.", null)
    }

    @DeleteMapping("/features/{id}")
    fun deleteFeature(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("site_features", id)
        return ApiResponse.ok("مورد حذف شد.", null)
    }

    // ---------- Homepage event rows ----------

    @GetMapping("/home-sections")
    fun homeSections(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT hs.*, c.name AS category_name FROM home_sections hs LEFT JOIN categories c ON c.id = hs.category_id " +
                "ORDER BY hs.sort_order, hs.id",
        ),
    )

    @PostMapping("/home-sections")
    fun createHomeSection(@Valid @RequestBody req: HomeSectionRequest): ApiResponse<Long> =
        ApiResponse.ok("بخش ثبت شد.", crud.insert("home_sections", req.columns()))

    @PutMapping("/home-sections/{id}")
    fun updateHomeSection(@PathVariable id: Long, @Valid @RequestBody req: HomeSectionRequest): ApiResponse<Unit> {
        crud.update("home_sections", id, req.columns())
        return ApiResponse.ok("بخش ویرایش شد.", null)
    }

    @DeleteMapping("/home-sections/{id}")
    fun deleteHomeSection(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("home_sections", id)
        return ApiResponse.ok("بخش حذف شد.", null)
    }

    // ---------- Header / footer navigation ----------

    @GetMapping("/navigation")
    fun navigation(): ApiResponse<List<Map<String, Any?>>> {
        val links = crud.list("SELECT * FROM links ORDER BY sort_order, id").groupBy { it["group_id"] }
        val groups = crud.list("SELECT * FROM link_groups ORDER BY sort_order, id")
        return ApiResponse.ok(groups.map { it + ("links" to (links[it["id"]] ?: emptyList())) })
    }

    @PostMapping("/link-groups")
    fun createLinkGroup(@Valid @RequestBody req: LinkGroupRequest): ApiResponse<Long> =
        ApiResponse.ok("گروه لینک ثبت شد.", crud.insert("link_groups", req.columns()))

    @PutMapping("/link-groups/{id}")
    fun updateLinkGroup(@PathVariable id: Long, @Valid @RequestBody req: LinkGroupRequest): ApiResponse<Unit> {
        crud.update("link_groups", id, req.columns())
        return ApiResponse.ok("گروه لینک ویرایش شد.", null)
    }

    @DeleteMapping("/link-groups/{id}")
    fun deleteLinkGroup(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("link_groups", id)
        return ApiResponse.ok("گروه لینک و لینک‌های آن حذف شد.", null)
    }

    @PostMapping("/links")
    fun createLink(@Valid @RequestBody req: LinkRequest): ApiResponse<Long> =
        ApiResponse.ok("لینک ثبت شد.", crud.insert("links", req.columns()))

    @PutMapping("/links/{id}")
    fun updateLink(@PathVariable id: Long, @Valid @RequestBody req: LinkRequest): ApiResponse<Unit> {
        crud.update("links", id, req.columns())
        return ApiResponse.ok("لینک ویرایش شد.", null)
    }

    @DeleteMapping("/links/{id}")
    fun deleteLink(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("links", id)
        return ApiResponse.ok("لینک حذف شد.", null)
    }

    // ---------- Content pages ----------

    @GetMapping("/pages")
    fun pages(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(crud.list("SELECT * FROM pages ORDER BY id"))

    @PostMapping("/pages")
    fun createPage(@Valid @RequestBody req: PageRequest): ApiResponse<Long> =
        ApiResponse.ok("صفحه ثبت شد.", crud.insert("pages", req.columns()))

    @PutMapping("/pages/{id}")
    fun updatePage(@PathVariable id: Long, @Valid @RequestBody req: PageRequest): ApiResponse<Unit> {
        crud.update("pages", id, req.columns())
        return ApiResponse.ok("صفحه ویرایش شد.", null)
    }

    @DeleteMapping("/pages/{id}")
    fun deletePage(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("pages", id)
        return ApiResponse.ok("صفحه حذف شد.", null)
    }

    // ---------- Newsletter ----------

    @GetMapping("/newsletter")
    fun newsletter(): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(crud.list("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC, id DESC"))

    @DeleteMapping("/newsletter/{id}")
    fun deleteSubscriber(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("newsletter_subscribers", id)
        return ApiResponse.ok("عضو خبرنامه حذف شد.", null)
    }

    // ---------- Discount codes ----------

    @GetMapping("/discounts")
    fun discounts(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(crud.list("SELECT * FROM discount_codes ORDER BY id DESC"))

    @PostMapping("/discounts")
    fun createDiscount(@Valid @RequestBody req: DiscountRequest): ApiResponse<Long> =
        ApiResponse.ok("کد تخفیف ثبت شد.", crud.insert("discount_codes", req.columns()))

    @PutMapping("/discounts/{id}")
    fun updateDiscount(@PathVariable id: Long, @Valid @RequestBody req: DiscountRequest): ApiResponse<Unit> {
        crud.update("discount_codes", id, req.columns())
        return ApiResponse.ok("کد تخفیف ویرایش شد.", null)
    }

    @DeleteMapping("/discounts/{id}")
    fun deleteDiscount(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("discount_codes", id)
        return ApiResponse.ok("کد تخفیف حذف شد.", null)
    }

    // ---------- Page blocks (heroes, call-to-action) ----------

    @GetMapping("/page-blocks")
    fun pageBlocks(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(crud.list("SELECT * FROM page_blocks ORDER BY id"))

    @PostMapping("/page-blocks")
    fun createPageBlock(@Valid @RequestBody req: PageBlockRequest): ApiResponse<Long> =
        ApiResponse.ok("بلوک ثبت شد.", crud.insert("page_blocks", req.columns()))

    @PutMapping("/page-blocks/{id}")
    fun updatePageBlock(@PathVariable id: Long, @Valid @RequestBody req: PageBlockRequest): ApiResponse<Unit> {
        crud.update("page_blocks", id, req.columns())
        return ApiResponse.ok("بلوک ویرایش شد.", null)
    }

    @DeleteMapping("/page-blocks/{id}")
    fun deletePageBlock(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("page_blocks", id)
        return ApiResponse.ok("بلوک حذف شد.", null)
    }

    // ---------- System alerts (dashboard) ----------

    @GetMapping("/alerts")
    fun alerts(): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(crud.list("SELECT * FROM system_alerts ORDER BY created_at DESC, id DESC"))

    @PostMapping("/alerts")
    fun createAlert(@Valid @RequestBody req: AlertRequest): ApiResponse<Long> =
        ApiResponse.ok("هشدار ثبت شد.", crud.insert("system_alerts", req.columns()))

    @PutMapping("/alerts/{id}")
    fun updateAlert(@PathVariable id: Long, @Valid @RequestBody req: AlertRequest): ApiResponse<Unit> {
        crud.update("system_alerts", id, req.columns())
        return ApiResponse.ok("هشدار ویرایش شد.", null)
    }

    @DeleteMapping("/alerts/{id}")
    fun deleteAlert(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("system_alerts", id)
        return ApiResponse.ok("هشدار حذف شد.", null)
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class SiteSettingsRequest(
    @field:NotBlank(message = "نام سامانه الزامی است.") @field:Size(max = 150) val siteName: String?,
    @field:Size(max = 60) val shortName: String? = null,
    @field:Size(max = 255) val tagline: String? = null,
    @field:Size(max = 500) val metaDescription: String? = null,
    @field:Size(max = 500) val logoUrl: String? = null,
    @field:Size(max = 500) val logoDarkUrl: String? = null,
    @field:Size(max = 50) val contactPhone: String? = null,
    @field:Email(message = "ایمیل تماس معتبر نیست.") @field:Size(max = 100) val contactEmail: String? = null,
    val address: String? = null,
    @field:Size(max = 255) val instagramUrl: String? = null,
    @field:Size(max = 255) val telegramUrl: String? = null,
    @field:Size(max = 255) val linkedinUrl: String? = null,
    @field:Size(max = 255) val aparatUrl: String? = null,
    @field:Size(max = 150) val newsletterTitle: String? = null,
    @field:Size(max = 255) val newsletterText: String? = null,
    val footerText: String? = null,
) {
    fun columns() = linkedMapOf(
        "site_name" to siteName!!.trim(), "short_name" to shortName.blankToNull(), "tagline" to tagline.blankToNull(),
        "meta_description" to metaDescription.blankToNull(), "logo_url" to logoUrl.blankToNull(), "logo_dark_url" to logoDarkUrl.blankToNull(),
        "contact_phone" to contactPhone.blankToNull(), "contact_email" to contactEmail.blankToNull(), "address" to address.blankToNull(),
        "instagram_url" to instagramUrl.blankToNull(), "telegram_url" to telegramUrl.blankToNull(), "linkedin_url" to linkedinUrl.blankToNull(), "aparat_url" to aparatUrl.blankToNull(),
        "newsletter_title" to newsletterTitle.blankToNull(), "newsletter_text" to newsletterText.blankToNull(), "footer_text" to footerText.blankToNull(),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class BannerRequest(
    @field:NotBlank(message = "عنوان بنر الزامی است.") @field:Size(max = 200) val title: String?,
    @field:Size(max = 255) val subtitle: String? = null,
    @field:Size(max = 500) val imageUrl: String? = null,
    @field:Size(max = 500) val linkUrl: String? = null,
    @field:Size(max = 100) val buttonText: String? = null,
    val eventId: Long? = null,
    val sortOrder: Int? = 0,
    val active: Boolean? = true,
) {
    fun columns() = linkedMapOf(
        "title" to title!!.trim(), "subtitle" to subtitle.blankToNull(), "image_url" to imageUrl.blankToNull(),
        "link_url" to linkUrl.blankToNull(), "button_text" to buttonText.blankToNull(), "event_id" to eventId,
        "sort_order" to (sortOrder ?: 0), "active" to (active ?: true),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class FeatureRequest(
    @field:NotBlank(message = "عنوان الزامی است.") @field:Size(max = 100) val title: String?,
    @field:Size(max = 255) val description: String? = null,
    @field:Size(max = 500) val iconUrl: String? = null,
    val sortOrder: Int? = 0,
    val active: Boolean? = true,
) {
    fun columns() = linkedMapOf(
        "title" to title!!.trim(), "description" to description.blankToNull(), "icon_url" to iconUrl.blankToNull(),
        "sort_order" to (sortOrder ?: 0), "active" to (active ?: true),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class HomeSectionRequest(
    @field:NotBlank(message = "عنوان بخش الزامی است.") @field:Size(max = 150) val title: String?,
    @field:Size(max = 255) val subtitle: String? = null,
    @field:NotNull(message = "نوع بخش را انتخاب کنید.")
    @field:Pattern(regexp = "THIS_WEEK|FEATURED|POPULAR|LATEST|CATEGORY", message = "نوع بخش معتبر نیست.")
    val sectionType: String?,
    val categoryId: Long? = null,
    @field:Min(value = 1, message = "تعداد رویداد باید بین ۱ تا ۲۰ باشد.") @field:Max(value = 20, message = "تعداد رویداد باید بین ۱ تا ۲۰ باشد.")
    val itemLimit: Int? = 5,
    val sortOrder: Int? = 0,
    val active: Boolean? = true,
) {
    fun columns(): Map<String, Any?> {
        if (sectionType == "CATEGORY" && categoryId == null) throw BusinessException("برای بخش «دسته‌بندی» یک دسته‌بندی انتخاب کنید.")
        return linkedMapOf(
            "title" to title!!.trim(), "subtitle" to subtitle.blankToNull(), "section_type" to sectionType,
            "category_id" to if (sectionType == "CATEGORY") categoryId else null, "item_limit" to (itemLimit ?: 5),
            "sort_order" to (sortOrder ?: 0), "active" to (active ?: true),
        )
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class LinkGroupRequest(
    @field:NotBlank(message = "عنوان گروه الزامی است.") @field:Size(max = 100) val title: String?,
    @field:NotNull(message = "محل نمایش را انتخاب کنید.") @field:Pattern(regexp = "HEADER|FOOTER", message = "محل نمایش معتبر نیست.")
    val placement: String?,
    val sortOrder: Int? = 0,
    val active: Boolean? = true,
) {
    fun columns() = linkedMapOf("title" to title!!.trim(), "placement" to placement, "sort_order" to (sortOrder ?: 0), "active" to (active ?: true))
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class LinkRequest(
    @field:NotNull(message = "گروه لینک را انتخاب کنید.") val groupId: Long?,
    @field:NotBlank(message = "عنوان لینک الزامی است.") @field:Size(max = 100) val title: String?,
    @field:NotBlank(message = "آدرس لینک الزامی است.") @field:Size(max = 500)
    @field:Pattern(regexp = "^(/|https?://|mailto:|tel:).*", message = "آدرس باید با / یا http(s):// یا mailto: یا tel: شروع شود.")
    val url: String?,
    val sortOrder: Int? = 0,
    val active: Boolean? = true,
    val openInNewTab: Boolean? = false,
) {
    fun columns() = linkedMapOf(
        "group_id" to groupId, "title" to title!!.trim(), "url" to url!!.trim(), "sort_order" to (sortOrder ?: 0),
        "active" to (active ?: true), "open_in_new_tab" to (openInNewTab ?: false),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class PageRequest(
    @field:NotBlank(message = "نامک صفحه الزامی است.") @field:Pattern(regexp = SLUG_PATTERN, message = SLUG_MESSAGE) val slug: String?,
    @field:NotBlank(message = "عنوان صفحه الزامی است.") @field:Size(max = 200) val title: String?,
    val content: String? = null,
    val active: Boolean? = true,
) {
    fun columns() = linkedMapOf(
        "slug" to slug!!.trim(), "title" to title!!.trim(), "content" to (content ?: ""), "active" to (active ?: true), "updated_at" to Instant.now(),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class AlertRequest(
    @field:NotBlank(message = "عنوان هشدار الزامی است.") @field:Size(max = 200) val title: String?,
    @field:NotBlank(message = "متن هشدار الزامی است.") val message: String?,
    @field:Pattern(regexp = "INFO|WARNING|SUCCESS|DANGER", message = "نوع هشدار معتبر نیست.") val alertType: String? = "INFO",
    val active: Boolean? = true,
) {
    fun columns() = linkedMapOf("title" to title!!.trim(), "message" to message!!.trim(), "alert_type" to (alertType ?: "INFO"), "active" to (active ?: true))
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class DiscountRequest(
    @field:NotBlank(message = "کد تخفیف الزامی است.") @field:Pattern(regexp = "^[A-Za-z0-9_-]{3,50}$", message = "کد فقط حروف انگلیسی، عدد، - و _ (۳ تا ۵۰ کاراکتر)")
    val code: String?,
    @field:Size(max = 150) val title: String? = null,
    @field:NotNull @field:Pattern(regexp = "PERCENT|AMOUNT", message = "نوع تخفیف معتبر نیست.") val discountType: String? = "PERCENT",
    @field:NotNull(message = "مقدار تخفیف الزامی است.") @field:DecimalMin(value = "0.01", message = "مقدار تخفیف باید بیشتر از صفر باشد.") val value: BigDecimal?,
    @field:Min(value = 1, message = "حداکثر استفاده باید حداقل ۱ باشد.") val maxUses: Int? = null,
    val validFrom: Instant? = null,
    val validTo: Instant? = null,
    val active: Boolean? = true,
) {
    fun columns(): Map<String, Any?> {
        if (discountType == "PERCENT" && value!! > BigDecimal(100)) throw BusinessException("درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.")
        return linkedMapOf(
            "code" to code!!.trim().uppercase(), "title" to title.blankToNull(), "discount_type" to discountType, "value" to value,
            "max_uses" to maxUses, "valid_from" to validFrom, "valid_to" to validTo, "active" to (active ?: true),
        )
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class PageBlockRequest(
    @field:NotBlank(message = "کلید بلوک الزامی است.") @field:Pattern(regexp = "^[A-Z_]{3,40}$", message = "کلید فقط حروف بزرگ انگلیسی و _")
    val blockKey: String?,
    @field:Size(max = 150) val kicker: String? = null,
    @field:Size(max = 200) val title: String? = null,
    @field:Size(max = 500) val subtitle: String? = null,
    @field:Size(max = 100) val buttonText: String? = null,
    @field:Size(max = 500) val buttonUrl: String? = null,
    @field:Size(max = 500) val imageUrl: String? = null,
    val active: Boolean? = true,
) {
    fun columns() = linkedMapOf(
        "block_key" to blockKey!!.trim(), "kicker" to kicker.blankToNull(), "title" to title.blankToNull(), "subtitle" to subtitle.blankToNull(),
        "button_text" to buttonText.blankToNull(), "button_url" to buttonUrl.blankToNull(), "image_url" to imageUrl.blankToNull(), "active" to (active ?: true),
    )
}
