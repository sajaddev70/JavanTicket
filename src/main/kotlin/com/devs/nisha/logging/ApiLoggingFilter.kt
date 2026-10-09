package com.devs.nisha.logging

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ApiLoggingFilter : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val path = request.requestURI
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response)
            return
        }

        val method = request.method
        val clientIp = clientIp(request)
        val query = sanitizeQueryString(request.queryString)
        val startTime = System.currentTimeMillis()

        log.info(
            "\n========== API REQUEST ==========\nMETHOD: {}\nPATH: {}\nCLIENT IP: {}\nQUERY: {}\n=================================",
            method, path, clientIp, query ?: "none",
        )

        try {
            filterChain.doFilter(request, response)
        } catch (ex: Exception) {
            request.setAttribute(EXCEPTION_ATTRIBUTE, ex)
            throw ex
        } finally {
            val duration = System.currentTimeMillis() - startTime
            val status = response.status
            val exception = request.getAttribute(EXCEPTION_ATTRIBUTE) as Throwable?

            if (status >= 400 || exception != null) {
                log.error(
                    "\n========== API ERROR ==========\nMETHOD: {}\nPATH: {}\nCLIENT IP: {}\nSTATUS: {}\nDURATION: {}ms\nEXCEPTION: {}\nMESSAGE: {}\n=================================",
                    method, path, clientIp, status, duration,
                    exception?.javaClass?.name ?: "HTTP Status $status",
                    exception?.message ?: "Request failed with HTTP status $status",
                )
            } else {
                log.info(
                    "\n========== API RESPONSE ==========\nSTATUS: {}\nPATH: {}\nDURATION: {}ms\n=================================",
                    status, path, duration,
                )
            }
        }
    }

    private fun clientIp(request: HttpServletRequest): String =
        request.getHeader("X-Forwarded-For")?.takeIf { it.isNotEmpty() }?.split(",")?.first()?.trim()
            ?: request.remoteAddr

    /** Redacts potentially sensitive values (password, otp, code, token, secret, auth) from the query string. */
    private fun sanitizeQueryString(query: String?): String? =
        query?.takeIf { it.isNotEmpty() }?.replace(SENSITIVE_PARAMS, "$1=[REDACTED]")

    companion object {
        const val EXCEPTION_ATTRIBUTE = "API_EXCEPTION"
        private val SENSITIVE_PARAMS = Regex("(?i)(password|otp|code|token|secret|auth)=[^&]*")
    }
}
