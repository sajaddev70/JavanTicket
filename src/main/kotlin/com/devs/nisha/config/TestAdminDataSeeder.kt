package com.devs.nisha.config

import com.devs.nisha.entity.User
import com.devs.nisha.repository.RoleRepository
import com.devs.nisha.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Profile("!prod")
class TestAdminDataSeeder(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
) : CommandLineRunner {

    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    override fun run(vararg args: String) {
        if (userRepository.findByMobile(TEST_ADMIN_MOBILE) != null) return

        val superAdmin = roleRepository.findByName("SUPER_ADMIN")
        userRepository.save(
            User(
                mobile = TEST_ADMIN_MOBILE,
                fullName = "مدیر آزمایشی",
                email = "admin.test@youthevent.ir",
                status = "ACTIVE",
                userType = "ADMIN",
                roles = listOfNotNull(superAdmin).toMutableSet(),
            ),
        )
        log.info("[TestAdminDataSeeder] Initialized test admin user [{}] with SUPER_ADMIN role.", TEST_ADMIN_MOBILE)
    }

    private companion object {
        const val TEST_ADMIN_MOBILE = "09101414285"
    }
}
