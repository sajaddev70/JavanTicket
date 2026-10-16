package com.devs.nisha.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

/**
 * Access tokens (short-lived, sent on every request) and refresh tokens (long-lived, only accepted by the refresh
 * endpoint). The `type` claim keeps them apart; tokens issued before it existed count as access tokens.
 */
@Component
class JwtProvider(
    @Value("\${jwt.secret}") secretKey: String,
    @Value("\${jwt.expiration-ms:86400000}") private val expirationMs: Long,
    @Value("\${jwt.refresh-expiration-ms:604800000}") private val refreshExpirationMs: Long,
) {
    private val signingKey: SecretKey = Keys.hmacShaKeyFor(secretKey.toByteArray(Charsets.UTF_8))

    fun generateToken(mobile: String, userType: String): String = build(mobile, userType, ACCESS, expirationMs)

    fun generateRefreshToken(mobile: String, userType: String): String = build(mobile, userType, REFRESH, refreshExpirationMs)

    private fun build(mobile: String, userType: String, type: String, lifetimeMs: Long): String {
        val now = Date()
        return Jwts.builder()
            .subject(mobile)
            .claim("userType", userType)
            .claim("type", type)
            .issuedAt(now)
            .expiration(Date(now.time + lifetimeMs))
            .signWith(signingKey)
            .compact()
    }

    /** Verified claims, or null when the token is malformed, tampered with or expired. */
    fun parse(token: String): Claims? = runCatching {
        Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).payload
    }.getOrNull()

    /** Claims of a valid access token (never a refresh token). */
    fun parseAccess(token: String): Claims? = parse(token)?.takeIf { (it["type"] ?: ACCESS) == ACCESS }

    /** Claims of a valid refresh token. */
    fun parseRefresh(token: String): Claims? = parse(token)?.takeIf { it["type"] == REFRESH }

    private companion object {
        const val ACCESS = "access"
        const val REFRESH = "refresh"
    }
}
