package com.devs.nisha.config

import com.devs.nisha.entity.User
import com.devs.nisha.repository.RoleRepository
import com.devs.nisha.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Makes sure the main admin account exists on every startup (all profiles, prod included) and is an active
 * SUPER_ADMIN. If the mobile was registered earlier as a regular user it is promoted.
 */
@Component
@Order(1)
class MainAdminSeeder(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
) : CommandLineRunner {

    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    override fun run(vararg args: String) {
        val superAdmin = roleRepository.findByName("SUPER_ADMIN")
        val user = userRepository.findByMobile(MAIN_ADMIN_MOBILE)
            ?: User(mobile = MAIN_ADMIN_MOBILE, fullName = "مدیر ارشد سامانه", userType = "ADMIN")

        user.userType = "ADMIN"
        user.status = "ACTIVE"
        superAdmin?.let { user.roles.add(it) }
        userRepository.save(user)
        log.info("[MainAdminSeeder] Main admin [{}] is ready with SUPER_ADMIN role.", MAIN_ADMIN_MOBILE)
    }

    private companion object {
        const val MAIN_ADMIN_MOBILE = "09101414285"
    }
}
