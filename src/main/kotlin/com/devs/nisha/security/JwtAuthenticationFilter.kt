package com.devs.nisha.security

import com.devs.nisha.repository.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Reads the `Authorization: Bearer <jwt>` header and authenticates the request as ROLE_ADMIN or ROLE_USER.
 * Admin tokens are re-checked against the database so a disabled or demoted admin loses access immediately.
 */
class JwtAuthenticationFilter(
    private val jwtProvider: JwtProvider,
    private val userRepository: UserRepository,
) : OncePerRequestFilter() {

    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val token = request.getHeader("Authorization")?.takeIf { it.startsWith(BEARER) }?.substring(BEARER.length)?.trim()
        val claims = token?.let(jwtProvider::parse)

        if (claims != null && SecurityContextHolder.getContext().authentication == null) {
            val mobile = claims.subject
            val userType = claims["userType"] as? String
            val allowed = when (userType) {
                "ADMIN" -> userRepository.findByMobileAndUserType(mobile, "ADMIN")?.status == "ACTIVE"
                "USER" -> true
                else -> false
            }
            if (allowed) {
                val authentication = UsernamePasswordAuthenticationToken(mobile, null, listOf(SimpleGrantedAuthority("ROLE_$userType")))
                SecurityContextHolder.getContext().authentication = authentication
            }
        }
        filterChain.doFilter(request, response)
    }

    private companion object {
        const val BEARER = "Bearer "
    }
}
