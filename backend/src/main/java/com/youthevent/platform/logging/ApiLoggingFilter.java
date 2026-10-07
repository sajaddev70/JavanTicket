package com.youthevent.platform.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip static assets or non-API calls if necessary
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String method = request.getMethod();
        String clientIp = getClientIp(request);
        String queryString = sanitizeQueryString(request.getQueryString());
        long startTime = System.currentTimeMillis();

        log.info("\n========== API REQUEST ==========\nMETHOD: {}\nPATH: {}\nCLIENT IP: {}\nQUERY: {}\n=================================",
                method, path, clientIp, queryString != null ? queryString : "none");

        try {
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            request.setAttribute("API_EXCEPTION", ex);
            throw ex;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            Throwable exception = (Throwable) request.getAttribute("API_EXCEPTION");

            if (status >= 400 || exception != null) {
                String exName = exception != null ? exception.getClass().getName() : "HTTP Status " + status;
                String exMessage = exception != null ? exception.getMessage() : "Request failed with HTTP status " + status;

                log.error("\n========== API ERROR ==========\nMETHOD: {}\nPATH: {}\nCLIENT IP: {}\nSTATUS: {}\nDURATION: {}ms\nEXCEPTION: {}\nMESSAGE: {}\n=================================",
                        method, path, clientIp, status, duration, exName, exMessage);
            } else {
                log.info("\n========== API RESPONSE ==========\nSTATUS: {}\nPATH: {}\nDURATION: {}ms\n=================================",
                        status, path, duration);
            }
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private String sanitizeQueryString(String query) {
        if (query == null || query.isEmpty()) {
            return null;
        }
        // Redact potential sensitive params in query strings (e.g. token, secret, otp, password)
        return query.replaceAll("(?i)(password|otp|code|token|secret|auth)=[^&]*", "$1=[REDACTED]");
    }
}
