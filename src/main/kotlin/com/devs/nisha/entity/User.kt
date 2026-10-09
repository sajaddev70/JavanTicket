package com.devs.nisha.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class User(
    @Column(nullable = false, unique = true, length = 15)
    var mobile: String,

    @Column(name = "full_name", length = 100)
    var fullName: String? = null,

    @Column(length = 100)
    var email: String? = null,

    /** ACTIVE or DISABLED */
    @Column(nullable = false, length = 20)
    var status: String = "ACTIVE",

    /** ADMIN or USER */
    @Column(name = "user_type", nullable = false, length = 20)
    var userType: String,

    @Column(name = "avatar_url", length = 500)
    var avatarUrl: String? = null,

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")],
    )
    var roles: MutableSet<Role> = mutableSetOf(),
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
