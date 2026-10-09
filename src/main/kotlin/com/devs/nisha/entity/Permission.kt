package com.devs.nisha.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "permissions")
class Permission(
    @Column(nullable = false, unique = true, length = 100)
    var code: String,

    @Column(name = "title_fa", nullable = false, length = 100)
    var titleFa: String,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
