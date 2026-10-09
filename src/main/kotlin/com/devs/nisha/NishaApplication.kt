package com.devs.nisha

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching

@SpringBootApplication
@EnableCaching
class NishaApplication

fun main(args: Array<String>) {
    runApplication<NishaApplication>(*args)
}
