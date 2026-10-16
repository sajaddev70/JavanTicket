package com.devs.nisha.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "otps")
class Otp(
    @Column(nullable = false, length = 15)
    var mobile: String,

    @Column(nullable = false, length = 10)
    var code: String,

    /** ADMIN or USER */
    @Column(nullable = false, length = 20)
    var domain: String,

    @Column(name = "expires_at", nullable = false)
    var expiresAt: LocalDateTime,

    var used: Boolean = false,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime? = null

    @PrePersist
    fun prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now()
    }
}
