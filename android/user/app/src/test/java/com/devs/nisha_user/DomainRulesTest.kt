package com.devs.nisha_user

import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.format.groupCode
import com.devs.nisha_user.core.format.maskMobile
import com.devs.nisha_user.core.format.normalizeIranMobile
import com.devs.nisha_user.core.format.paragraphs
import com.devs.nisha_user.core.format.toEnDigits
import com.devs.nisha_user.core.format.toFaDigits
import com.devs.nisha_user.domain.model.Banner
import com.devs.nisha_user.domain.model.EventSession
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.usecase.AvailabilityTone
import com.devs.nisha_user.domain.usecase.BuyerForm
import com.devs.nisha_user.domain.usecase.GetHomeFeedUseCase
import com.devs.nisha_user.domain.usecase.SendOtpUseCase
import com.devs.nisha_user.domain.usecase.SubmitBuyerUseCase
import com.devs.nisha_user.domain.usecase.availability
import java.io.IOException
import java.net.SocketTimeoutException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainRulesTest {

    @Test
    fun `iranian mobiles in any form normalize to 09xxxxxxxxx`() {
        assertEquals("09121234567", normalizeIranMobile("09121234567"))
        assertEquals("09121234567", normalizeIranMobile("۰۹۱۲ ۱۲۳ ۴۵۶۷"))
        assertEquals("09121234567", normalizeIranMobile("+98 912 123 4567"))
        assertEquals("09121234567", normalizeIranMobile("00989121234567"))
        assertEquals("09121234567", normalizeIranMobile("9121234567"))
        assertNull(normalizeIranMobile("0212345678"))
        assertNull(normalizeIranMobile("0912123"))
    }

    @Test
    fun `send otp rejects empty and invalid numbers with the site's messages`() {
        assertEquals("شماره موبایل خود را وارد کنید.", runCatching { SendOtpUseCase.validateMobile(" ") }.exceptionOrNull()?.message)
        assertEquals("شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۳۴۵۶۷۸۹", runCatching { SendOtpUseCase.validateMobile("123") }.exceptionOrNull()?.message)
    }

    @Test
    fun `digits and codes`() {
        assertEquals("۰۹۱۲", toFaDigits("0912"))
        assertEquals("0912", toEnDigits("۰۹۱۲"))
        assertEquals("0912", toEnDigits("٠٩١٢"))
        assertEquals("WYAX-XWRL-FTAB-A375", groupCode("WYAXXWRLFTABA375"))
        assertEquals("۰۹۱۲ *** ۴۵۶۷", maskMobile("09121234567"))
        assertEquals(listOf("یک", "دو"), paragraphs("یک\n\n  \n\nدو"))
    }

    @Test
    fun `buyer form follows the web validation`() {
        val ok = BuyerForm("سارا", "رضایی", "09121234567", "sara@example.com", "", terms = true)
        assertTrue(SubmitBuyerUseCase.validate(ok).isEmpty())

        val bad = SubmitBuyerUseCase.validate(BuyerForm(mobile = "123", email = "not-an-email"))
        assertEquals("نام را وارد کنید.", bad["first_name"])
        assertEquals("نام خانوادگی را وارد کنید.", bad["last_name"])
        assertEquals("شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۳۴۵۶۷۸۹", bad["mobile"])
        assertEquals("ایمیل واردشده معتبر نیست.", bad["email"])
        assertEquals("برای ادامه، پذیرش قوانین و مقررات لازم است.", bad["terms"])
        assertTrue(SubmitBuyerUseCase.validate(ok.copy(email = "")).isEmpty())
    }

    @Test
    fun `session availability labels`() {
        val base = EventSession(1, startTime = "2026-11-01T10:00:00Z", endTime = "2026-11-01T12:00:00Z", capacity = 500, availableSeats = 300)
        val fa = { n: Int -> n.toString() }
        assertEquals(AvailabilityTone.OK, base.availability(fa).tone)
        assertEquals("ظرفیت محدود (8 جای خالی)", base.copy(availableSeats = 8).availability(fa).label)
        assertFalse(base.copy(availableSeats = 0).availability(fa).bookable)
        assertEquals("به‌زودی", base.copy(status = "SCHEDULED").availability(fa).label)
    }

    @Test
    fun `hero slides start with HOME_HERO and banners follow their event's slug`() {
        val hero = PageBlock("HOME_HERO", kicker = "k", title = "عنوان", subtitle = null)
        val banners = listOf(
            Banner(1, "کنسرت", linkUrl = "/events/old-slug", eventSlug = "hamid-hirad-concert", categoryName = "موسیقی", cityName = "تهران"),
            Banner(2, "بدون رویداد", linkUrl = "/about"),
        )
        val slides = GetHomeFeedUseCase.slides(hero, banners)
        assertEquals(3, slides.size)
        assertEquals("/events", slides[0].link)
        assertEquals("/events/hamid-hirad-concert", slides[1].link)
        assertEquals("موسیقی • تهران", slides[1].kicker)
        assertEquals("/about", slides[2].link)
        assertTrue(GetHomeFeedUseCase.slides(PageBlock("HOME_HERO"), emptyList()).isEmpty())
    }

    @Test
    fun `errors become persian user messages`() {
        assertEquals("ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.", AppError.from(IOException("boom")).message)
        assertTrue(AppError.from(IOException()).offline)
        assertEquals("پاسخی از سرور دریافت نشد. لطفاً دوباره تلاش کنید.", AppError.from(SocketTimeoutException()).message)
        assertEquals("رویداد موردنظر پیدا نشد.", AppError.http(404, "رویداد موردنظر پیدا نشد.").message)
        // Non-Persian server text (stack traces, proxies) is never shown.
        assertEquals("اطلاعات موردنظر پیدا نشد.", AppError.http(404, "Not Found").message)
        assertEquals("خطایی در سامانه رخ داده است. لطفاً دوباره تلاش کنید.", AppError.http(500, null).message)
    }
}
