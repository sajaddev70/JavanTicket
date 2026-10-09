package com.devs.nisha.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtProvider(
    @Value("\${jwt.secret}") secretKey: String,
    @Value("\${jwt.expiration-ms:86400000}") private val expirationMs: Long,
) {
    private val signingKey: SecretKey = Keys.hmacShaKeyFor(secretKey.toByteArray(Charsets.UTF_8))

    fun generateToken(mobile: String, userType: String): String {
        val now = Date()
        return Jwts.builder()
            .subject(mobile)
            .claim("userType", userType)
            .issuedAt(now)
            .expiration(Date(now.time + expirationMs))
            .signWith(signingKey)
            .compact()
    }

    /** Verified claims, or null when the token is malformed, tampered with or expired. */
    fun parse(token: String): Claims? = runCatching {
        Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).payload
    }.getOrNull()
}
