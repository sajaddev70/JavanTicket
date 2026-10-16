package com.devs.nisha_user.core.common

import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import kotlinx.coroutines.CancellationException

/**
 * Every failure the UI sees: always a Persian, user-presentable message (never raw exception text), like the web's
 * ApiError. [status] is the HTTP status when the server answered; [offline] marks connectivity problems.
 */
class AppError(
    override val message: String,
    val status: Int? = null,
    val fieldErrors: Map<String, String> = emptyMap(),
    val offline: Boolean = false,
    cause: Throwable? = null,
) : Exception(message, cause) {

    val isNotFound: Boolean get() = status == 404
    val isConflict: Boolean get() = status == 409
    val isUnauthorized: Boolean get() = status == 401

    companion object {
        const val GENERIC = "دریافت اطلاعات با خطا مواجه شد."

        private val STATUS_MESSAGES = mapOf(
            400 to "اطلاعات ارسالی معتبر نیست.",
            401 to "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
            403 to "شما دسترسی لازم برای این عملیات را ندارید.",
            404 to "اطلاعات موردنظر پیدا نشد.",
            409 to "این عملیات با وضعیت فعلی سازگار نیست. لطفاً صفحه را به‌روز کنید.",
            429 to "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
            500 to "خطایی در سامانه رخ داده است. لطفاً دوباره تلاش کنید.",
            502 to "سرویس در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
            503 to "سرویس در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
        )

        private val PERSIAN = Regex("[\\u0600-\\u06FF]")

        /** Server answer → error; the backend's own message is used when it is Persian. */
        fun http(status: Int, serverMessage: String?, fieldErrors: Map<String, String> = emptyMap()): AppError {
            val message = serverMessage?.takeIf { it.isNotBlank() && PERSIAN.containsMatchIn(it) }
                ?: STATUS_MESSAGES[status]
                ?: GENERIC
            return AppError(message, status, fieldErrors)
        }

        fun from(t: Throwable): AppError = when (t) {
            is AppError -> t
            is CancellationException -> throw t
            is SocketTimeoutException -> AppError("پاسخی از سرور دریافت نشد. لطفاً دوباره تلاش کنید.", offline = true, cause = t)
            is UnknownHostException, is IOException ->
                AppError("ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.", offline = true, cause = t)
            else -> AppError("خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.", cause = t)
        }
    }
}

/** Runs [block] and maps any failure to an [AppError] (cancellation is rethrown). */
suspend inline fun <T> appResult(crossinline block: suspend () -> T): Result<T> =
    try {
        Result.success(block())
    } catch (e: CancellationException) {
        throw e
    } catch (e: Throwable) {
        Result.failure(AppError.from(e))
    }

val Throwable.appError: AppError get() = AppError.from(this)
