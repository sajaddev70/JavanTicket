package com.devs.nisha_user.data.di

import com.devs.nisha_user.BuildConfig
import com.devs.nisha_user.data.remote.ApiLogInterceptor
import com.devs.nisha_user.data.remote.AuthInterceptor
import com.devs.nisha_user.data.remote.HoldTokenInterceptor
import com.devs.nisha_user.data.remote.TokenAuthenticator
import com.devs.nisha_user.data.remote.api.AuthApi
import com.devs.nisha_user.data.remote.api.PublicApi
import com.devs.nisha_user.data.remote.api.UserApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import java.util.concurrent.TimeUnit
import javax.inject.Named
import javax.inject.Singleton
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun json(): Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = true
        isLenient = true
    }

    /** "http://host:8081/api/v1/" (Retrofit needs the trailing slash). */
    @Provides
    @Named("baseUrl")
    fun baseUrl(): String = BuildConfig.API_BASE_URL.trimEnd('/') + "/"

    /** Origin of the backend, which serves /media (built-in images) and /uploads (admin uploads). */
    @Provides
    @Named("mediaOrigin")
    fun mediaOrigin(): String = BuildConfig.API_BASE_URL.replace(Regex("/api/v\\d+/?$"), "")

    /** Client without auth handling, for the token refresh itself. */
    @Provides
    @Singleton
    @Named("plain")
    fun plainClient(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .addInterceptor(ApiLogInterceptor(BuildConfig.DEBUG))
        .build()

    @Provides
    @Singleton
    fun client(
        @Named("plain") plain: OkHttpClient,
        auth: AuthInterceptor,
        hold: HoldTokenInterceptor,
        authenticator: TokenAuthenticator,
    ): OkHttpClient = plain.newBuilder()
        .addInterceptor(auth)
        .addInterceptor(hold)
        .authenticator(authenticator)
        .build()

    @Provides
    @Singleton
    fun retrofit(@Named("baseUrl") baseUrl: String, client: OkHttpClient, json: Json): Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    @Provides @Singleton fun publicApi(retrofit: Retrofit): PublicApi = retrofit.create(PublicApi::class.java)
    @Provides @Singleton fun authApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)
    @Provides @Singleton fun userApi(retrofit: Retrofit): UserApi = retrofit.create(UserApi::class.java)
}
