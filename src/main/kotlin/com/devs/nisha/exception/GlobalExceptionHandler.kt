package com.devs.nisha.exception

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.logging.ApiLoggingFilter
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.multipart.MaxUploadSizeExceededException
import org.springframework.web.servlet.resource.NoResourceFoundException

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(ex: BusinessException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        request.setAttribute(ApiLoggingFilter.EXCEPTION_ATTRIBUTE, ex)
        log.warn("Business Exception [{}] on [{}]: {}", ex.status, request.requestURI, ex.message)
        return ResponseEntity.status(ex.status).body(ApiResponse.error(ex.message ?: ""))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(ex: MethodArgumentNotValidException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        request.setAttribute(ApiLoggingFilter.EXCEPTION_ATTRIBUTE, ex)
        val errors = ex.bindingResult.fieldErrors.associate { it.field to it.defaultMessage }
        log.warn("Validation Exception on [{}]: {}", request.requestURI, errors)
        val message = errors.values.firstOrNull() ?: "اطلاعات واردشده معتبر نیست."
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(message, errors))
    }

    @ExceptionHandler(HttpMessageNotReadableException::class, MethodArgumentTypeMismatchException::class)
    fun handleUnreadableRequest(ex: Exception, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        request.setAttribute(ApiLoggingFilter.EXCEPTION_ATTRIBUTE, ex)
        log.warn("Unreadable request on [{}]: {}", request.requestURI, ex.message)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("اطلاعات ارسالی قابل پردازش نیست."))
    }

    /** Unique / foreign-key violations, e.g. a duplicate slug or a reference to a deleted city. */
    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrity(ex: DataIntegrityViolationException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        request.setAttribute(ApiLoggingFilter.EXCEPTION_ATTRIBUTE, ex)
        log.warn("Data integrity violation on [{}]: {}", request.requestURI, ex.mostSpecificCause.message)
        val duplicate = ex.mostSpecificCause.message?.contains("duplicate key", ignoreCase = true) == true
        val message = if (duplicate) "مقدار واردشده تکراری است و قبلاً ثبت شده است." else "این عملیات با اطلاعات مرتبط موجود سازگار نیست."
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(message))
    }

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleUploadTooLarge(ex: MaxUploadSizeExceededException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        request.setAttribute(ApiLoggingFilter.EXCEPTION_ATTRIBUTE, ex)
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ApiResponse.error("حجم فایل بیش از حد مجاز است."))
    }

    @ExceptionHandler(NoResourceFoundException::class)
    fun handleNoResource(ex: NoResourceFoundException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        request.setAttribute(ApiLoggingFilter.EXCEPTION_ATTRIBUTE, ex)
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("مورد درخواستی پیدا نشد."))
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        request.setAttribute(ApiLoggingFilter.EXCEPTION_ATTRIBUTE, ex)
        log.error("Unhandled Exception on [{}]: ", request.requestURI, ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("خطای غیرمنتظره‌ای در سرور رخ داده است. لطفاً مجدداً تلاش کنید."))
    }
}
