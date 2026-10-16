package com.devs.nisha_user.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.devs.nisha_user.domain.model.AuthUser
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json

/** The signed-in session: bearer tokens plus the user. Kept in its own file, excluded from backups. */
data class Session(val accessToken: String, val refreshToken: String, val user: AuthUser)

private val Context.sessionStore: DataStore<Preferences> by preferencesDataStore(name = "session")

/**
 * Persistence of the user session, like the web's authStorage (localStorage there). The current value is mirrored in
 * memory so the network layer can read the token synchronously on every request.
 */
@Singleton
class SessionStore @Inject constructor(@ApplicationContext context: Context, private val json: Json) {
    private val store = context.sessionStore
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    // Read once at startup (a few hundred bytes) so the first requests already carry the token.
    private val state = MutableStateFlow(runBlocking(Dispatchers.IO) { read(store.data.first()) })
    val session: StateFlow<Session?> = state.asStateFlow()

    val current: Session? get() = state.value

    private fun read(p: Preferences): Session? {
        val access = p[ACCESS] ?: return null
        val refresh = p[REFRESH] ?: return null
        val user = p[USER]?.let { runCatching { json.decodeFromString<AuthUser>(it) }.getOrNull() } ?: return null
        return Session(access, refresh, user)
    }

    fun save(session: Session) {
        state.value = session
        scope.launch {
            store.edit {
                it[ACCESS] = session.accessToken
                it[REFRESH] = session.refreshToken
                it[USER] = json.encodeToString(AuthUser.serializer(), session.user)
            }
        }
    }

    fun updateUser(user: AuthUser) {
        val s = state.value ?: return
        save(s.copy(user = user))
    }

    fun clear() {
        state.value = null
        scope.launch { store.edit { it.clear() } }
    }

    private companion object {
        val ACCESS = stringPreferencesKey("access_token")
        val REFRESH = stringPreferencesKey("refresh_token")
        val USER = stringPreferencesKey("user")
    }
}
