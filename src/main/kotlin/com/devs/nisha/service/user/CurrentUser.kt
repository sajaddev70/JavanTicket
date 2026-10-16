package com.devs.nisha.service.user

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component

/** Id of the signed-in site user (the JWT subject is the mobile number). */
@Component
class CurrentUser(private val users: UserRepository) {
    fun id(authentication: Authentication): Long =
        users.findByMobile(authentication.name)?.id ?: throw BusinessException("کاربر یافت نشد.", HttpStatus.UNAUTHORIZED)
}
