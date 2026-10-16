package com.devs.nisha_user.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.devs.nisha_user.domain.model.ThemeMode
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
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

private val Context.prefsStore: DataStore<Preferences> by preferencesDataStore(name = "preferences")

/** Device preferences: theme, the city picked in the header and the id of this device's seat selection. */
@Singleton
class PreferencesStore @Inject constructor(@ApplicationContext context: Context) {
    private val store = context.prefsStore
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val initial = runBlocking(Dispatchers.IO) { store.data.first() }

    private val theme = MutableStateFlow(initial[THEME]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() } ?: ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = theme.asStateFlow()

    private val city = MutableStateFlow(initial[CITY]?.takeIf { it > 0 })
    /** City of the header; every event list follows it (null = all cities). */
    val cityId: StateFlow<Long?> = city.asStateFlow()

    /**
     * Random id of this device's seat selection (sent as X-Hold-Token). Seats are locked on the server for this id
     * before the buyer signs in; checkout turns them into the signed-in user's order.
     */
    val holdToken: String = initial[HOLD_TOKEN] ?: UUID.randomUUID().toString().also { token ->
        scope.launch { store.edit { it[HOLD_TOKEN] = token } }
    }

    fun setTheme(mode: ThemeMode) {
        theme.value = mode
        scope.launch { store.edit { it[THEME] = mode.name } }
    }

    fun setCity(id: Long?) {
        city.value = id
        scope.launch { store.edit { if (id == null) it.remove(CITY) else it[CITY] = id } }
    }

    private companion object {
        val THEME = stringPreferencesKey("theme")
        val CITY = longPreferencesKey("city_id")
        val HOLD_TOKEN = stringPreferencesKey("seat_hold_token")
    }
}
