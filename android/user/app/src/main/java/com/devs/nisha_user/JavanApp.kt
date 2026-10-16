package com.devs.nisha_user

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.SvgDecoder
import coil.disk.DiskCache
import coil.memory.MemoryCache
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject
import javax.inject.Named
import okhttp3.OkHttpClient

@HiltAndroidApp
class JavanApp : Application(), ImageLoaderFactory {

    @Inject @Named("plain") lateinit var httpClient: OkHttpClient

    /** Posters, photos and the admin's SVG icons (SVG files under /media/icons) through the app's HTTP client. */
    override fun newImageLoader(): ImageLoader = ImageLoader.Builder(this)
        .okHttpClient(httpClient)
        .components { add(SvgDecoder.Factory()) }
        .memoryCache { MemoryCache.Builder(this).maxSizePercent(0.25).build() }
        .diskCache { DiskCache.Builder().directory(cacheDir.resolve("images")).maxSizeBytes(150L * 1024 * 1024).build() }
        .crossfade(true)
        .respectCacheHeaders(false)
        .build()
}
