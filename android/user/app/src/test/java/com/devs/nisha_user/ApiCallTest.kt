package com.devs.nisha_user

import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.data.di.NetworkModule
import com.devs.nisha_user.data.remote.ApiCall
import com.devs.nisha_user.data.remote.api.PublicApi
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/** The data layer against the backend's real JSON shapes (envelope, snake_case, UTC instants, errors). */
class ApiCallTest {
    private val server = MockWebServer()
    private val json = NetworkModule.json()
    private lateinit var api: PublicApi
    private val call = ApiCall(json)

    @Before
    fun setUp() {
        server.start()
        api = Retrofit.Builder().baseUrl(server.url("/api/v1/"))
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build().create(PublicApi::class.java)
    }

    @After
    fun tearDown() = server.shutdown()

    @Test
    fun `unwraps the envelope and reads the event detail`() = runTest {
        server.enqueue(
            MockResponse().setBody(
                """{"success":true,"message":"عملیات با موفقیت انجام شد.","data":{"id":29,"title":"نمایشگاه","slug":"iran-tech-expo",
                "min_price":150000.0,"status":"PUBLISHED","first_start":"2026-11-02T05:30:00Z","sold_count":928,"unknown_field":1,
                "sessions":[{"id":40,"start_time":"2026-11-02T05:30:00Z","end_time":"2026-11-02T14:30:00Z","price":150000.0,
                "from_price":150000.0,"capacity":2500,"reserved_seats":750,"status":"ACTIVE","hall_name":"سالن اصلی","city_name":"تهران",
                "available_seats":1750,"has_seat_map":false}],"stats":[],"topics":[],"speakers":[],"gallery":[],"faqs":[]},"timestamp":"x"}""",
            ),
        )
        val event = call { api.event("iran-tech-expo") }
        assertEquals("iran-tech-expo", event.slug)
        assertEquals(1, event.sessions.size)
        assertEquals(1750, event.sessions[0].availableSeats)
        assertEquals("/api/v1/public/events/iran-tech-expo", server.takeRequest().path)
    }

    @Test
    fun `http errors carry the backend's persian message and status`() = runTest {
        server.enqueue(MockResponse().setResponseCode(409).setBody("""{"success":false,"message":"این صندلی توسط کاربر دیگری انتخاب شده است."}"""))
        val error = runCatching { call { api.seatMap(44) } }.exceptionOrNull() as AppError
        assertEquals(409, error.status)
        assertTrue(error.isConflict)
        assertEquals("این صندلی توسط کاربر دیگری انتخاب شده است.", error.message)
    }

    @Test
    fun `field errors of a 400 are kept for the form`() = runTest {
        server.enqueue(MockResponse().setResponseCode(400).setBody("""{"success":false,"message":"اطلاعات نامعتبر است.","errors":{"email":"ایمیل معتبر نیست."}}"""))
        val error = runCatching { call { api.cities() } }.exceptionOrNull() as AppError
        assertEquals("ایمیل معتبر نیست.", error.fieldErrors["email"])
    }

    @Test
    fun `html error pages from proxies fall back to the status message`() = runTest {
        server.enqueue(MockResponse().setResponseCode(502).setBody("<html>Bad Gateway</html>"))
        val error = runCatching { call { api.cities() } }.exceptionOrNull() as AppError
        assertEquals("سرویس در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.", error.message)
    }
}
