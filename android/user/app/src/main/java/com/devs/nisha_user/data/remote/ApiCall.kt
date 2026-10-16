package com.devs.nisha_user.data.remote

import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.data.remote.api.Envelope
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException

/** A successful answer with the backend's message (shown in toasts, e.g. "بلیت پیامک شد."). */
data class WithMessage<T>(val data: T, val message: String?)

/**
 * Unwraps the backend's { success, message, data } envelope and turns every failure into an [AppError]:
 * HTTP errors carry the server's Persian message, network problems a connectivity message.
 */
@Singleton
class ApiCall @Inject constructor(private val json: Json) {

    suspend operator fun <T> invoke(block: suspend () -> Envelope<T>): T = withMessage(block).data

    suspend fun <T> withMessage(block: suspend () -> Envelope<T>): WithMessage<T> {
        val envelope = try {
            block()
        } catch (e: CancellationException) {
            throw e
        } catch (e: HttpException) {
            throw httpError(e)
        } catch (e: Throwable) {
            throw AppError.from(e)
        }
        if (!envelope.success) throw AppError.http(400, envelope.message, envelope.errors.orEmpty())
        @Suppress("UNCHECKED_CAST")
        return WithMessage(envelope.data as T, envelope.message)
    }

    /** For endpoints without a payload (send OTP, favorites, newsletter). */
    suspend fun unit(block: suspend () -> Envelope<JsonElement>) {
        withMessage(block)
    }

    private fun httpError(e: HttpException): AppError {
        val body = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
        val obj: JsonObject? = body?.let { runCatching { json.parseToJsonElement(it).jsonObject }.getOrNull() }
        val message = obj?.get("message")?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }
        val fields = obj?.get("errors")?.let { el ->
            runCatching { el.jsonObject.mapValues { it.value.jsonPrimitive.content } }.getOrNull()
        }.orEmpty()
        return AppError.http(e.code(), message, fields)
    }
}
