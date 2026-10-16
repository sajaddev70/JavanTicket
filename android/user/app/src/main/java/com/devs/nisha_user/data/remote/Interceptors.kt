package com.devs.nisha_user.data.remote

import android.util.Log
import com.devs.nisha_user.data.local.PreferencesStore
import com.devs.nisha_user.data.local.Session
import com.devs.nisha_user.data.local.SessionStore
import com.devs.nisha_user.data.remote.api.Envelope
import com.devs.nisha_user.data.remote.api.RefreshBody
import com.devs.nisha_user.domain.model.AuthResponse
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route

/** Bearer token of the signed-in user on every request (the backend issues tokens, not cookies). */
@Singleton
class AuthInterceptor @Inject constructor(private val sessions: SessionStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = sessions.current?.accessToken
        val request = chain.request()
        if (token == null || request.url.encodedPath.contains("/auth/")) return chain.proceed(request)
        return chain.proceed(request.newBuilder().header("Authorization", "Bearer $token").build())
    }
}

/** Seat locks belong to this device's hold token (seat map, holds and checkout read it). */
@Singleton
class HoldTokenInterceptor @Inject constructor(private val prefs: PreferencesStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response =
        chain.proceed(chain.request().newBuilder().header("X-Hold-Token", prefs.holdToken).build())
}

/** Logcat line per call, like the web's [API] console logs in development. */
class ApiLogInterceptor(private val enabled: Boolean) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (!enabled) return chain.proceed(request)
        val started = System.nanoTime()
        return try {
            chain.proceed(request).also {
                Log.d(TAG, "${request.method} ${request.url.encodedPath} ${it.code} ${(System.nanoTime() - started) / 1_000_000}ms")
            }
        } catch (e: Exception) {
            Log.w(TAG, "${request.method} ${request.url.encodedPath} NETWORK ${e.javaClass.simpleName}")
            throw e
        }
    }

    private companion object {
        const val TAG = "API"
    }
}

/**
 * Expired access token: renews it once with the refresh token and replays the request (OkHttp calls this on 401).
 * Requests failing meanwhile wait on the lock and reuse the new token. If renewing fails the session is cleared and
 * the app shows the signed-out state.
 */
@Singleton
class TokenAuthenticator @Inject constructor(
    private val sessions: SessionStore,
    private val json: Json,
    @Named("baseUrl") private val baseUrl: String,
    @Named("plain") private val plainClient: OkHttpClient,
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        val request = response.request
        if (request.url.encodedPath.contains("/auth/") || request.header("Authorization") == null) return null
        if (response.priorResponse != null) return null // already retried once

        val sentToken = request.header("Authorization")!!.removePrefix("Bearer ")
        val token = synchronized(this) {
            val current = sessions.current ?: return null
            // Another request already renewed the token.
            if (current.accessToken != sentToken) current.accessToken else refresh(current)
        } ?: return null
        return request.newBuilder().header("Authorization", "Bearer $token").build()
    }

    private fun refresh(current: Session): String? {
        val body = json.encodeToString(RefreshBody.serializer(), RefreshBody(current.refreshToken))
            .toRequestBody("application/json".toMediaType())
        val renewed = runCatching {
            plainClient.newCall(Request.Builder().url(baseUrl + "auth/user/refresh").post(body).build()).execute().use { r ->
                if (!r.isSuccessful) return@use null
                json.decodeFromString(Envelope.serializer(AuthResponse.serializer()), r.body!!.string()).data
            }
        }.getOrNull()
        if (renewed == null) {
            sessions.clear()
            return null
        }
        sessions.save(Session(renewed.accessToken, renewed.refreshToken, renewed.user))
        return renewed.accessToken
    }
}
