package com.devs.nisha.config

import com.devs.nisha.security.AdminPermissionInterceptor
import com.devs.nisha.service.activity.ActivityLogInterceptor
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.http.CacheControl
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.nio.file.Path
import java.util.concurrent.TimeUnit

/**
 * Serves images uploaded from the admin panel (see AdminSystemController) under /uploads/, and applies the
 * admin role permissions and activity log to the admin API.
 */
@Configuration
class WebConfig(
    @Value("\${app.upload-dir:uploads}") uploadDir: String,
    private val permissionInterceptor: AdminPermissionInterceptor,
    private val activityLogInterceptor: ActivityLogInterceptor,
) : WebMvcConfigurer {

    private val uploadRoot: Path = Path.of(uploadDir).toAbsolutePath().normalize()

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:$uploadRoot/")
            // Every upload gets a fresh random name, so its URL never changes content.
            .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
    }

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(permissionInterceptor).addPathPatterns("/api/v1/admin/**")
        registry.addInterceptor(activityLogInterceptor).addPathPatterns("/api/v1/admin/**")
    }
}
