package com.devs.nisha.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.http.CacheControl
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.nio.file.Path
import java.util.concurrent.TimeUnit

/** Serves images uploaded from the admin panel (see AdminUploadController) under /uploads/. */
@Configuration
class WebConfig(@Value("\${app.upload-dir:uploads}") uploadDir: String) : WebMvcConfigurer {

    private val uploadRoot: Path = Path.of(uploadDir).toAbsolutePath().normalize()

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:$uploadRoot/")
            // Every upload gets a fresh random name, so its URL never changes content.
            .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
    }
}
