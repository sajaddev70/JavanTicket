package com.devs.nisha.repository

import com.devs.nisha.entity.Otp
import com.devs.nisha.entity.Role
import com.devs.nisha.entity.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<User, Long> {
    fun findByMobile(mobile: String): User?
    fun findByMobileAndUserType(mobile: String, userType: String): User?
}

interface OtpRepository : JpaRepository<Otp, Long> {
    fun findTopByMobileAndDomainAndUsedFalseOrderByCreatedAtDesc(mobile: String, domain: String): Otp?
}

interface RoleRepository : JpaRepository<Role, Long> {
    fun findByName(name: String): Role?
}
