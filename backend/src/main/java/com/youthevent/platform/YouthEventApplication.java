package com.youthevent.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class YouthEventApplication {
    public static void main(String[] args) {
        SpringApplication.run(YouthEventApplication.class, args);
    }
}
