package com.youthevent.platform.config;

import com.youthevent.platform.entity.Role;
import com.youthevent.platform.entity.User;
import com.youthevent.platform.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Slf4j
@Component
@Profile("!prod")
@RequiredArgsConstructor
public class TestAdminDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        String testAdminMobile = "09101414285";
        if (userRepository.findByMobile(testAdminMobile).isEmpty()) {
            Role superAdminRole = entityManager.createQuery("SELECT r FROM Role r WHERE r.name = :name", Role.class)
                    .setParameter("name", "SUPER_ADMIN")
                    .getResultList()
                    .stream()
                    .findFirst()
                    .orElse(null);

            User testAdmin = User.builder()
                    .mobile(testAdminMobile)
                    .fullName("مدیر آزمایشی")
                    .email("admin.test@youthevent.ir")
                    .status("ACTIVE")
                    .userType("ADMIN")
                    .roles(superAdminRole != null ? Collections.singleton(superAdminRole) : Collections.emptySet())
                    .build();

            userRepository.save(testAdmin);
            log.info("[TestAdminDataSeeder] Initialized test admin user [{}] with SUPER_ADMIN role.", testAdminMobile);
        }
    }
}
