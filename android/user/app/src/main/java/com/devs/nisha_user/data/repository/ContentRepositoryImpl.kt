package com.devs.nisha_user.data.repository

import com.devs.nisha_user.data.remote.ApiCall
import com.devs.nisha_user.data.remote.api.EmailBody
import com.devs.nisha_user.data.remote.api.PublicApi
import com.devs.nisha_user.domain.model.Banner
import com.devs.nisha_user.domain.model.Category
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.ContentPage
import com.devs.nisha_user.domain.model.Feature
import com.devs.nisha_user.domain.model.HomeSection
import com.devs.nisha_user.domain.model.Navigation
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.SiteSettings
import com.devs.nisha_user.domain.repository.ContentRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Site content (settings, menus, page blocks, features, categories, cities) is loaded once and kept in memory, as the
 * web keeps it in the React Query cache; [refreshSiteContent] with force re-reads it (pull to refresh).
 */
@Singleton
class ContentRepositoryImpl @Inject constructor(
    private val api: PublicApi,
    private val call: ApiCall,
) : ContentRepository {

    private val _settings = MutableStateFlow<SiteSettings?>(null)
    private val _navigation = MutableStateFlow<Navigation?>(null)
    private val _blocks = MutableStateFlow<Map<String, PageBlock>>(emptyMap())
    private val _features = MutableStateFlow<List<Feature>>(emptyList())
    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    private val _cities = MutableStateFlow<List<City>>(emptyList())

    override val settings: StateFlow<SiteSettings?> = _settings.asStateFlow()
    override val navigation: StateFlow<Navigation?> = _navigation.asStateFlow()
    override val pageBlocks: StateFlow<Map<String, PageBlock>> = _blocks.asStateFlow()
    override val features: StateFlow<List<Feature>> = _features.asStateFlow()
    override val categories: StateFlow<List<Category>> = _categories.asStateFlow()
    override val cities: StateFlow<List<City>> = _cities.asStateFlow()

    private val mutex = Mutex()
    private var loaded = false

    override suspend fun refreshSiteContent(force: Boolean) = mutex.withLock {
        if (loaded && !force) return@withLock
        coroutineScope {
            val settings = async { call { api.siteSettings() } }
            val navigation = async { call { api.navigation() } }
            val blocks = async { call { api.pageBlocks() } }
            val features = async { call { api.features() } }
            val categories = async { call { api.categories() } }
            val cities = async { call { api.cities() } }
            _settings.value = settings.await()
            _navigation.value = navigation.await()
            _blocks.value = blocks.await()
            _features.value = features.await()
            _categories.value = categories.await()
            _cities.value = cities.await()
        }
        loaded = true
    }

    override suspend fun homeSections(): List<HomeSection> = call { api.homeSections() }
    override suspend fun banners(): List<Banner> = call { api.banners() }
    override suspend fun page(slug: String): ContentPage = call { api.page(slug) }
    override suspend fun subscribe(email: String) = call.unit { api.subscribe(EmailBody(email)) }
}
