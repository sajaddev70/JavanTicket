package com.devs.nisha.dto

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.LocalDateTime

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val errors: Any? = null,
    val timestamp: LocalDateTime = LocalDateTime.now(),
) {
    companion object {
        private const val DEFAULT_OK_MESSAGE = "عملیات با موفقیت انجام شد."

        fun <T> ok(message: String, data: T?): ApiResponse<T> = ApiResponse(success = true, message = message, data = data)

        fun <T> ok(data: T?): ApiResponse<T> = ok(DEFAULT_OK_MESSAGE, data)

        fun <T> error(message: String, errors: Any? = null): ApiResponse<T> =
            ApiResponse(success = false, message = message, errors = errors)
    }
}
