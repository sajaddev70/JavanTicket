package com.devs.nisha.config

import com.devs.nisha.service.seatmap.SeatMapService
import com.devs.nisha.support.JdbcCrud
import org.slf4j.LoggerFactory
import com.devs.nisha.support.SecureCodes
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.sql.Timestamp
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.temporal.TemporalAdjusters
import kotlin.random.Random

/**
 * Demo data that mirrors the UI designs (file/screen and file/screen/new), so a fresh installation is never empty:
 * cities, halls with seat maps, ~50 events with sessions around today, a month of orders, tickets and payments,
 * schools, invoices, settlements, CRM, alerts, site content, and a demo customer account with its own tickets.
 *
 * Runs once per [SEED_VERSION] (tracked in app_meta), in every profile (the Docker setup included):
 * - a database the seeder has never touched is filled only while it holds no data of its own (no customer, order or
 *   event besides the V1 samples), so a production database with real content is never wiped;
 * - a database filled by an older seed version is wiped and loaded again unless `demo.seed.reseed-on-upgrade` is off.
 * `demo.seed.force` (DEMO_SEED_FORCE=true) loads it over whatever is there; set it for one start, then back to false.
 * Admin accounts, roles and the admin menu are always kept. Turn it off completely with DEMO_SEED_ENABLED=false.
 */
@Component
@Order(10)
@ConditionalOnProperty(name = ["demo.seed.enabled"], havingValue = "true")
class DemoDataSeeder(
    private val crud: JdbcCrud,
    private val seatMaps: SeatMapService,
    @param:Value("\${demo.seed.reseed-on-upgrade:true}") private val reseedOnUpgrade: Boolean,
    @param:Value("\${demo.seed.force:false}") private val force: Boolean,
) : CommandLineRunner {

    private val log = LoggerFactory.getLogger(javaClass)
    private val random = Random(1405)
    private val jdbc get() = crud.jdbc
    private val today: LocalDate = LocalDate.now()

    @Transactional
    override fun run(vararg args: String) {
        val loaded = jdbc.queryForList("SELECT meta_value FROM app_meta WHERE meta_key = 'demo_seed'", emptyMap<String, Any>(), String::class.java)
        val version = loaded.firstOrNull()
        if (version == SEED_VERSION && !force) return
        if (!force && version == null && hasOwnData()) {
            log.info("[DemoDataSeeder] Database already has its own events, orders or customers; demo data is not loaded.")
            return
        }
        if (!force && version != null && !reseedOnUpgrade) {
            log.info("[DemoDataSeeder] Demo data {} is loaded; reseeding to {} is turned off.", version, SEED_VERSION)
            return
        }

        log.info("[DemoDataSeeder] Loading design sample data (version {})...", SEED_VERSION)
        reset()
        val categories = seedCategories()
        val cities = seedCities()
        val halls = seedHalls(cities)
        val events = seedEvents(categories, halls)
        val sessions = seedSessions(events, halls)
        seedEventPages(events)
        val users = seedUsers()
        seedOrders(users, sessions)
        seedDemoCustomer(cities, events, sessions)
        seedPayments()
        val organizations = seedSchools(cities, sessions)
        seedInvoices(organizations)
        seedSettlements(events)
        seedGateScans()
        val staff = seedStaff()
        seedCrm(users, organizations, staff)
        seedActivityLog(staff)
        seedAlerts()
        seedSiteContent(categories)
        jdbc.update(
            "INSERT INTO app_meta (meta_key, meta_value) VALUES ('demo_seed', :v) ON CONFLICT (meta_key) DO UPDATE SET meta_value = :v",
            mapOf("v" to SEED_VERSION),
        )
        log.info("[DemoDataSeeder] Sample data loaded: {} events, {} sessions.", events.size, sessions.size)
    }

    /** True when the database holds content that did not come from this seeder or the V1 migration samples. */
    private fun hasOwnData(): Boolean {
        val count = crud.number(
            "SELECT (SELECT COUNT(*) FROM orders) + (SELECT COUNT(*) FROM users WHERE user_type = 'USER') + " +
                "(SELECT COUNT(*) FROM events WHERE slug NOT IN (:samples))",
            mapOf("samples" to V1_SAMPLE_EVENTS),
        )
        return count.toLong() > 0
    }

    private fun reset() {
        jdbc.update(
            "TRUNCATE seat_reservations, session_prices, seats, hall_sections, tickets, orders, sessions, event_stats, event_topics, " +
                "event_speakers, event_gallery, event_faqs, banners, events, group_reservations, organizations, halls, categories, " +
                "system_alerts, discount_codes, page_blocks, site_features, home_sections, links, link_groups, pages, newsletter_subscribers, " +
                "invoice_items, invoices, settlements, gate_scans, crm_interactions, activity_logs, payments, user_favorites " +
                "RESTART IDENTITY CASCADE",
            emptyMap<String, Any>(),
        )
        // Not in the TRUNCATE: users.city_id references cities, so CASCADE would empty users (and every admin) too.
        jdbc.update("DELETE FROM cities", emptyMap<String, Any>())
        jdbc.update("ALTER SEQUENCE cities_id_seq RESTART", emptyMap<String, Any>())
        jdbc.update("DELETE FROM users WHERE user_type = 'USER'", emptyMap<String, Any>())
    }

    // ---------------------------------------------------------------- categories

    private fun seedCategories(): Map<String, Long> {
        val rows = listOf(
            Cat("music", "کنسرت و موسیقی", "موسیقی زنده", "music", "#EF476F", "/media/events/concert.webp"),
            Cat("conference", "همایش و کنفرانس", "دانش و ارتباط", "conference", "#22C55E", "/media/events/card-2.jpg"),
            Cat("theater", "نمایش و تئاتر", "صحنه و هنر", "theater", "#8B5CF6", "/media/events/theater.webp"),
            Cat("workshop", "کارگاه و آموزشی", "یادگیری کاربردی", "education", "#F5A524", "/media/events/card-8.jpg"),
            Cat("sports", "ورزشی", "هیجان و رقابت", "sports", "#10B981", "/media/events/technology.webp"),
            Cat("exhibition", "نمایشگاه", "نمایشگاه‌ها و رویدادها", "exhibition", "#2F80F5", "/media/events/card-3.jpg"),
            Cat("kids", "خانوادگی و کودک", "شادی و آموزش", "children", "#38BDF8", "/media/events/puppet.webp"),
            Cat("business", "کسب‌وکار", "کارآفرینی و سرمایه‌گذاری", "business", "#0EA5E9", "/media/events/poster-a7.jpg"),
            Cat("other", "سایر رویدادها", "فرهنگی و سرگرمی", "other", "#94A3B8", "/media/events/circus.webp"),
        )
        return rows.mapIndexed { i, c ->
            c.slug to crud.insert(
                "categories",
                linkedMapOf(
                    "name" to c.name, "slug" to c.slug, "tagline" to c.tagline, "icon" to null,
                    "icon_url" to "/media/icons/categories/${c.icon}.svg", "cover_url" to c.cover, "color" to c.color,
                    "sort_order" to i + 1, "active" to true,
                ),
            )
        }.toMap()
    }

    // ---------------------------------------------------------------- cities & halls

    private fun seedCities(): Map<String, Long> {
        val rows = listOf(
            listOf("تهران", "تهران", "علی محمدی", "tehran", "ACTIVE", 35.6892, 51.3890, 14),
            listOf("مشهد", "خراسان رضوی", "مریم احمدی", "mashhad", "ACTIVE", 36.2970, 59.6057, 12),
            listOf("اصفهان", "اصفهان", "رضا حسینی", "isfahan", "ACTIVE", 32.6546, 51.6680, 10),
            listOf("شیراز", "فارس", "سارا کریمی", "shiraz", "PLANNED", 29.5918, 52.5837, 3),
            listOf("تبریز", "آذربایجان شرقی", "حسین نوروزی", "tabriz", "ACTIVE", 38.0800, 46.2919, 2),
            listOf("کرج", "البرز", "نرگس رحیمی", null, "INACTIVE", 35.8400, 50.9391, 1),
        )
        return rows.associate { r ->
            r[0] as String to crud.insert(
                "cities",
                linkedMapOf(
                    "name" to r[0], "province" to r[1], "manager_name" to r[2], "image_url" to r[3]?.let { "/media/cities/$it.jpg" },
                    "status" to r[4], "active" to (r[4] != "INACTIVE"), "latitude" to r[5], "longitude" to r[6],
                    "created_at" to Timestamp.valueOf(today.minusDays((r[7] as Int) * 7L).atTime(9, 0)),
                ),
            )
        }
    }

    /** Halls; those with `seatMap` get the ~500 seat theatre layout and their capacity follows it. */
    private fun seedHalls(cities: Map<String, Long>): Map<String, HallRef> {
        val rows = listOf(
            H("main-tehran", "تهران", "سالن اصلی", "نمایشگاه بین‌المللی تهران", "CONFERENCE", 2500, 4, "ACTIVE", 1, "تهران، بزرگراه شهید چمران، نمایشگاه بین‌المللی تهران"),
            H("javan-main", "تهران", "سالن اصلی جوان", "مرکز همایش و نمایش جوان", "CONFERENCE", 0, 3, "ACTIVE", 3, "تهران، خیابان آزادی، مرکز همایش و نمایش جوان", seatMap = true),
            H("javan-side", "تهران", "سالن فرعی", "مرکز همایش و نمایش جوان", "THEATER", 0, 2, "ACTIVE", 7, "تهران، خیابان آزادی، مرکز همایش و نمایش جوان", seatMap = true),
            H("saadi", "تهران", "سالن سعدی", "مرکز همایش جوان", "CONFERENCE", 1500, 3, "INACTIVE", 6, "تهران، خیابان آزادی"),
            H("persian-gulf", "شیراز", "سالن خلیج فارس", "نمایشگاه بین‌المللی شیراز", "EXHIBITION", 1800, 3, "ACTIVE", 2, "شیراز، بلوار نمایشگاه"),
            H("hafez", "شیراز", "سالن حافظ", "مرکز همایش شیراز", "CONCERT", 0, 3, "ACTIVE", 3, "شیراز، بلوار حافظ", seatMap = true),
            H("sepahan", "اصفهان", "سالن سپاهان", "مرکز همایش اصفهان", "CONFERENCE", 0, 3, "ACTIVE", 5, "اصفهان، خیابان چهارباغ بالا", seatMap = true),
            H("innovation", "اصفهان", "سالن نوآوری", "مرکز همایش جوان", "EDUCATION", 600, 2, "UNDER_CONSTRUCTION", 8, "اصفهان، شهرک علمی و تحقیقاتی"),
            H("milad", "مشهد", "سالن میلاد", "مرکز همایش مشهد", "CONCERT", 2000, 4, "EQUIPPING", 4, "مشهد، بلوار سجاد"),
            H("ferdowsi", "مشهد", "سالن فردوسی", "مرکز همایش مشهد", "THEATER", 0, 2, "ACTIVE", 5, "مشهد، بلوار فردوسی", seatMap = true),
            H("intl-mashhad", "مشهد", "سالن بین‌المللی", "نمایشگاه بین‌المللی مشهد", "EXHIBITION", 3000, 5, "ACTIVE", 7, "مشهد، بلوار نمایشگاه"),
            H("setaregan", "تبریز", "سالن ستارگان", "مرکز همایش تبریز", "CONFERENCE", 0, 2, "ACTIVE", 1, "تبریز، خیابان امام", seatMap = true),
            H("ferdowsi-tabriz", "تبریز", "سالن فردوسی", "نمایشگاه بین‌المللی تبریز", "EXHIBITION", 900, 2, "ACTIVE", 5, "تبریز، جاده ائل‌گلی"),
        )
        return rows.associate { h ->
            val id = crud.insert(
                "halls",
                linkedMapOf(
                    "city_id" to cities.getValue(h.city), "name" to h.name, "venue_name" to h.venue, "address" to h.address,
                    "hall_type" to h.type, "capacity" to h.capacity, "gates_count" to h.gates, "status" to h.status,
                    "active" to (h.status == "ACTIVE"), "image_url" to "/media/halls/hall-${h.image}.jpg",
                    "created_at" to Timestamp.valueOf(today.minusDays(random.nextLong(20, 400)).atTime(10, 0)),
                ),
            )
            var capacity = h.capacity
            if (h.seatMap) {
                THEATRE_LAYOUT.forEachIndexed { i, s ->
                    crud.insert(
                        "hall_sections",
                        linkedMapOf(
                            "hall_id" to id, "name" to s.name, "first_row" to s.firstRow, "rows_count" to s.rows, "seats_per_row" to s.perRow,
                            "pos_x" to s.x, "pos_y" to s.y, "curve" to s.curve, "tier_code" to s.tier, "sort_order" to i + 1,
                        ),
                    )
                }
                seatMaps.regenerateHall(id)
                // A few seats out of service (camera / technical positions), as in the seat map design.
                jdbc.update(
                    "UPDATE seats SET disabled = TRUE WHERE id IN (SELECT id FROM seats WHERE hall_id = :id AND " +
                        "((seat_number = 1 OR seat_number = 7) AND row_index BETWEEN 3 AND 12 AND section_id IN " +
                        "(SELECT id FROM hall_sections WHERE hall_id = :id AND seats_per_row = 7)))",
                    mapOf("id" to id),
                )
                capacity = jdbc.queryForObject("SELECT COUNT(*) FROM seats WHERE hall_id = :id AND disabled = FALSE", mapOf("id" to id), Int::class.java)!!
                jdbc.update("UPDATE halls SET capacity = :c WHERE id = :id", mapOf("c" to capacity, "id" to id))
            }
            h.key to HallRef(id, cities.getValue(h.city), capacity, h.seatMap)
        }
    }

    // ---------------------------------------------------------------- events & sessions

    private fun seedEvents(categories: Map<String, Long>, halls: Map<String, HallRef>): List<Ev> {
        val events = EVENTS.map { e ->
            val hall = halls.getValue(e.hall)
            val start = e.dateRange?.let { Timestamp.valueOf(today.plusDays(it.first.toLong()).atTime(9, 0)) }
            val end = e.dateRange?.let { Timestamp.valueOf(today.plusDays(it.second.toLong()).atTime(18, 0)) }
            val id = crud.insert(
                "events",
                linkedMapOf(
                    "title" to e.title, "slug" to e.slug, "subtitle" to e.subtitle, "category_id" to categories.getValue(e.category),
                    "city_id" to hall.cityId, "hall_id" to hall.id, "description" to (e.description ?: defaultDescription(e)),
                    "banner_url" to e.image, "organizer_name" to e.organizer, "min_price" to BigDecimal(e.price), "status" to e.status,
                    "featured" to e.featured, "popular" to e.popular, "start_date" to start, "end_date" to end,
                    "website_url" to e.website, "notice" to e.notice,
                    "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(e.createdDaysAgo.toLong())),
                ),
            )
            Ev(id, e, hall)
        }
        return events
    }

    private fun seedSessions(events: List<Ev>, halls: Map<String, HallRef>): List<SessionRef> {
        val sessions = mutableListOf<SessionRef>()
        for (ev in events) {
            for (s in ev.def.sessions) {
                val hall = s.hall?.let { halls.getValue(it) } ?: ev.hall
                val start = today.plusDays(s.day.toLong()).atTime(s.time)
                val capacity = if (hall.seatMap) hall.capacity else (s.capacity ?: hall.capacity.coerceAtMost(1200))
                val status = when {
                    ev.def.status == "CANCELLED" -> "CANCELLED"
                    ev.def.status == "DRAFT" -> "SCHEDULED"
                    else -> "ACTIVE"
                }
                val fill = if (status == "ACTIVE" || start.isBefore(LocalDateTime.now())) s.fill else 0.0
                val id = crud.insert(
                    "sessions",
                    linkedMapOf(
                        "event_id" to ev.id, "hall_id" to hall.id, "title" to s.title, "start_time" to Timestamp.valueOf(start),
                        "end_time" to Timestamp.valueOf(start.plusMinutes(s.minutes.toLong())), "capacity" to capacity,
                        "reserved_seats" to (capacity * fill).toInt(), "price" to BigDecimal(ev.def.price), "status" to status,
                        "created_at" to Timestamp.valueOf(start.minusDays(random.nextLong(10, 60))),
                    ),
                )
                if (hall.seatMap) {
                    val base = ev.def.price
                    val prices = ev.def.tierPrices ?: mapOf("NORMAL" to base, "SILVER" to base * 8 / 5, "GOLD" to base * 5 / 2, "VIP" to base * 3)
                    prices.forEach { (tier, price) ->
                        jdbc.update(
                            "INSERT INTO session_prices (session_id, tier_code, price) VALUES (:s, :t, :p)",
                            mapOf("s" to id, "t" to tier, "p" to BigDecimal(price)),
                        )
                    }
                    if (fill > 0) markSoldSeats(id, hall.id, fill)
                }
                sessions += SessionRef(id, ev, start, capacity)
            }
        }
        return sessions
    }

    /** Marks a share of a seat-mapped session as sold (front rows first fill faster) and keeps reserved_seats in step. */
    private fun markSoldSeats(sessionId: Long, hallId: Long, fill: Double) {
        val seats = jdbc.queryForList(
            "SELECT id, row_index FROM seats WHERE hall_id = :h AND disabled = FALSE", mapOf("h" to hallId),
        )
        val sold = seats.filter { random.nextDouble() < fill * (1.25 - (it["row_index"] as Int) * 0.025) }
        jdbc.batchUpdate(
            "INSERT INTO seat_reservations (session_id, seat_id, status) VALUES (:s, :seat, :st)",
            sold.map { mapOf("s" to sessionId, "seat" to it["id"], "st" to if (random.nextInt(14) == 0) "BLOCKED" else "SOLD") }.toTypedArray(),
        )
        jdbc.update("UPDATE sessions SET reserved_seats = LEAST(capacity, :n) WHERE id = :id", mapOf("n" to sold.size, "id" to sessionId))
    }

    private fun seedEventPages(events: List<Ev>) {
        for (ev in events) {
            val page = ev.def.page ?: continue
            page.stats.forEachIndexed { i, (value, label, icon, color) ->
                crud.insert("event_stats", linkedMapOf("event_id" to ev.id, "value" to value, "label" to label, "icon_url" to icon, "color" to color, "sort_order" to i))
            }
            page.topics.forEachIndexed { i, (title, icon, color) ->
                crud.insert("event_topics", linkedMapOf("event_id" to ev.id, "title" to title, "icon_url" to icon, "color" to color, "sort_order" to i))
            }
            page.speakers.forEachIndexed { i, sp ->
                crud.insert(
                    "event_speakers",
                    linkedMapOf(
                        "event_id" to ev.id, "full_name" to sp[0], "job_title" to sp[1], "organization" to sp[2], "photo_url" to sp[3].ifBlank { null },
                        "keynote" to (i < 3), "sort_order" to i,
                    ),
                )
            }
            page.gallery.forEachIndexed { i, (url, caption) ->
                crud.insert("event_gallery", linkedMapOf("event_id" to ev.id, "image_url" to url, "caption" to caption, "sort_order" to i))
            }
            page.faqs.forEachIndexed { i, (q, a) ->
                crud.insert("event_faqs", linkedMapOf("event_id" to ev.id, "question" to q, "answer" to a, "sort_order" to i))
            }
        }
    }

    // ---------------------------------------------------------------- customers, orders & tickets

    private fun seedUsers(): List<Long> {
        val first = listOf("محمد", "زهرا", "علی", "فاطمه", "حسین", "مریم", "رضا", "سارا", "امیر", "نرگس", "مهدی", "الهام", "سعید", "نازنین", "حامد", "شیما", "پویا", "ترانه", "کاوه", "یاسمن")
        val last = listOf("احمدی", "محمدی", "رضایی", "حسینی", "کریمی", "موسوی", "جعفری", "صادقی", "رحیمی", "نوروزی", "کاظمی", "قاسمی", "اکبری", "شریفی", "طاهری")
        return (1..1200).map { i ->
            val name = "${first[i % first.size]} ${last[(i * 7) % last.size]}"
            crud.insert(
                "users",
                linkedMapOf(
                    "mobile" to "0912%07d".format(1_000_000 + i * 7919 % 9_000_000), "full_name" to name,
                    "email" to "user$i@example.com", "status" to if (i % 97 == 0) "DISABLED" else "ACTIVE", "user_type" to "USER",
                    "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(if (i > 1140) random.nextLong(1, 25) else random.nextLong(40, 700))),
                ),
            )
        }
    }

    /**
     * 37 days of paid orders with a rising trend (sales chart and "today vs yesterday" cards).
     * Each order picks a session that already existed at that time.
     */
    private fun seedOrders(users: List<Long>, sessions: List<SessionRef>) {
        val sellable = sessions.filter { it.event.def.status == "PUBLISHED" }
        var orderNo = 100_000
        val tickets = mutableListOf<Map<String, Any?>>()
        for (offset in 36 downTo 0) {
            val day = today.minusDays(offset.toLong())
            val trend = 1.0 + (36 - offset) / 30.0
            val count = ((70 + random.nextInt(60)) * trend).toInt()
            repeat(count) {
                val session = sellable[random.nextInt(sellable.size)]
                val qty = 1 + random.nextInt(4)
                val unit = session.event.def.price.toLong()
                val createdAt = if (offset == 0) {
                    LocalDateTime.now().minusMinutes(random.nextLong(1, maxOf(2, LocalTime.now().toSecondOfDay() / 60L)))
                } else {
                    day.atTime(8 + random.nextInt(15), random.nextInt(60))
                }
                val number = "JT-${orderNo++}"
                val orderId = crud.insert(
                    "orders",
                    linkedMapOf(
                        "order_number" to number, "user_id" to customer(users, offset), "session_id" to session.id,
                        "total_amount" to BigDecimal(unit * qty), "status" to "PAID", "payment_method" to "ONLINE",
                        "tracking_code" to "%012d".format(random.nextLong(100_000_000_000L, 999_999_999_999L)),
                        "created_at" to Timestamp.valueOf(createdAt), "paid_at" to Timestamp.valueOf(createdAt),
                    ),
                )
                repeat(qty) { t ->
                    tickets += mapOf(
                        "code" to "$number-${t + 1}", "qr" to SecureCodes.ticketQr(), "order" to orderId, "user" to null,
                        "session" to session.id, "price" to BigDecimal(unit), "at" to Timestamp.valueOf(createdAt),
                    )
                }
            }
        }
        // A couple of abandoned / cancelled orders for realism
        repeat(12) {
            val session = sellable[random.nextInt(sellable.size)]
            crud.insert(
                "orders",
                linkedMapOf(
                    "order_number" to "JT-${orderNo++}", "user_id" to users[random.nextInt(users.size)], "session_id" to session.id,
                    "total_amount" to BigDecimal(session.event.def.price), "status" to "CANCELLED", "payment_method" to "ONLINE",
                    "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(random.nextLong(1, 20))),
                ),
            )
        }
        jdbc.batchUpdate(
            "INSERT INTO tickets (ticket_code, qr_code, order_id, user_id, session_id, price, status, seat_label, created_at) " +
                "VALUES (:code, :qr, :order, (SELECT user_id FROM orders WHERE id = :order), :session, :price, 'VALID', 'ورود عمومی', :at)",
            tickets.toTypedArray(),
        )
        // Tickets of sessions that already started were mostly scanned at the gate.
        jdbc.update(
            "UPDATE tickets t SET status = 'USED', used_at = s.start_time - INTERVAL '40 minutes' + (t.id % 55) * INTERVAL '1 minute' " +
                "FROM sessions s WHERE s.id = t.session_id AND s.start_time < LOCALTIMESTAMP AND t.id % 9 <> 0",
            emptyMap<String, Any>(),
        )
        // Some refunds (upcoming sessions only) and a few unpaid checkouts.
        jdbc.update(
            "WITH r AS (SELECT o.id FROM orders o JOIN sessions s ON s.id = o.session_id WHERE o.status = 'PAID' AND s.start_time > LOCALTIMESTAMP " +
                "  AND o.id % 61 = 0) " +
                "UPDATE orders o SET status = 'REFUNDED', refunded_at = o.created_at + INTERVAL '2 days', " +
                "  refund_reason = 'انصراف مشتری از حضور در رویداد' FROM r WHERE r.id = o.id",
            emptyMap<String, Any>(),
        )
        jdbc.update("UPDATE orders SET refunded_at = LOCALTIMESTAMP - INTERVAL '1 hour' WHERE status = 'REFUNDED' AND refunded_at > LOCALTIMESTAMP", emptyMap<String, Any>())
        jdbc.update("UPDATE tickets t SET status = 'CANCELLED' FROM orders o WHERE o.id = t.order_id AND o.status = 'REFUNDED'", emptyMap<String, Any>())
        repeat(6) {
            val session = sellable.filter { it.start.isAfter(LocalDateTime.now()) }.let { it[random.nextInt(it.size)] }
            crud.insert(
                "orders",
                linkedMapOf(
                    "order_number" to "JT-${orderNo++}", "user_id" to customer(users, 0), "session_id" to session.id, "quantity" to 2,
                    "total_amount" to BigDecimal(session.event.def.price * 2), "status" to "PENDING", "payment_method" to "ONLINE",
                    "created_at" to Timestamp.valueOf(LocalDateTime.now().minusMinutes(random.nextLong(2, 50))),
                ),
            )
        }
    }

    /**
     * A few frequent buyers and a long tail of occasional ones (for the CRM segments). The newest 150 accounts never
     * buy, and every 7th customer stopped buying a month ago ("at risk" when they bought before that).
     */
    private fun customer(users: List<Long>, daysAgo: Int): Long {
        while (true) {
            val r = random.nextDouble()
            val index = (r * r * (users.size - 150)).toInt()
            if (daysAgo <= 32 && index % 7 == 6) continue
            return users[index]
        }
    }

    private fun seedSchools(cities: Map<String, Long>, sessions: List<SessionRef>): List<Long> {
        val names = listOf(
            "دبستان شهید بهشتی", "دبیرستان علامه حلی", "دبستان دخترانه فرزانگان", "هنرستان فنی شهید چمران", "دبیرستان نمونه دولتی امام",
            "دبستان پسرانه سعادت", "مدرسه هوشمند فردا", "دبیرستان دخترانه فرهنگ", "دبستان غیرانتفاعی مهر", "سازمان فرهنگی شهرداری",
            "دانشگاه صنعتی اصفهان", "انجمن علمی دانش‌آموزی", "شرکت فناوران نوآور", "دانشگاه شیراز",
        )
        val contacts = listOf("آقای کریمی", "خانم رضایی", "آقای موسوی", "خانم احمدی", "آقای جعفری", "خانم صادقی", "آقای نوروزی")
        val cityIds = cities.values.toList()
        val orgs = names.mapIndexed { i, n ->
            val type = when {
                n.startsWith("دانشگاه") -> "UNIVERSITY"
                n.startsWith("شرکت") -> "COMPANY"
                n.startsWith("سازمان") || n.startsWith("انجمن") -> "ORGANIZATION"
                else -> "SCHOOL"
            }
            crud.insert(
                "organizations",
                linkedMapOf(
                    "name" to n, "org_type" to type, "city_id" to cityIds[i % 5], "contact_name" to contacts[i % contacts.size],
                    "contact_mobile" to "0913%07d".format(2_000_000 + i * 131), "phone" to "0%d-%08d".format(21 + i % 5 * 10, 33_000_000 + i * 4_517),
                    "email" to "info${i + 1}@school.example.ir", "address" to "خیابان ${listOf("آزادی", "انقلاب", "ولیعصر", "فردوسی", "امام")[i % 5]}، پلاک ${10 + i * 3}",
                    "economic_code" to "4114%08d".format(10_000_000 + i * 7_211), "members_count" to 200 + i * 85,
                    "status" to if (i == 12) "INACTIVE" else "ACTIVE",
                    "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(20L + i * 9)),
                ),
            )
        }
        val buyers = orgs.filterIndexed { i, _ -> i != 12 }
        val upcoming = sessions.filter { it.start.isAfter(LocalDateTime.now()) && it.event.def.status == "PUBLISHED" }
        val monthStart = today.withDayOfMonth(1)
        listOf(monthStart.minusMonths(1) to 112, monthStart to 125).forEach { (month, count) ->
            val days = if (month == monthStart) today.dayOfMonth else month.lengthOfMonth()
            repeat(count) { n ->
                val seats = 20 + random.nextInt(60)
                val status = when (random.nextInt(10)) {
                    0, 1 -> "PENDING"
                    2 -> "CANCELLED"
                    else -> if (month == monthStart) "CONFIRMED" else "COMPLETED"
                }
                // Recent reservations point at an upcoming session; confirmed ones take its capacity.
                val session = if (month == monthStart && n % 3 == 0 && upcoming.isNotEmpty()) upcoming[random.nextInt(upcoming.size)] else null
                val sessionId = session?.let { s ->
                    if (status != "CONFIRMED") s.id
                    else s.id.takeIf {
                        jdbc.update(
                            "UPDATE sessions SET reserved_seats = reserved_seats + :n WHERE id = :id AND reserved_seats + :n <= capacity",
                            mapOf("n" to seats, "id" to s.id),
                        ) > 0
                    }
                }
                val unit = BigDecimal(session?.event?.def?.price ?: (80_000 + random.nextInt(8) * 10_000))
                val discount = BigDecimal(listOf(0, 10, 15, 20)[random.nextInt(4)])
                val createdAt = month.plusDays(random.nextLong(days.toLong())).atTime(9 + random.nextInt(8), random.nextInt(60))
                crud.insert(
                    "group_reservations",
                    linkedMapOf(
                        "organization_id" to buyers[random.nextInt(buyers.size)], "session_id" to sessionId, "seats" to seats,
                        "unit_price" to unit, "discount_percent" to discount,
                        "total_amount" to unit.multiply(BigDecimal(seats)).multiply(BigDecimal(100) - discount).divide(BigDecimal(100)),
                        "contact_name" to contacts[random.nextInt(contacts.size)], "status" to status,
                        "confirmed_at" to if (status == "CONFIRMED" || status == "COMPLETED") Timestamp.valueOf(createdAt.plusDays(1)) else null,
                        "created_at" to Timestamp.valueOf(createdAt),
                    ),
                )
            }
        }
        return orgs
    }

    /** Pro-forma invoices for part of the group reservations, in every state. */
    private fun seedInvoices(organizations: List<Long>) {
        val reservations = jdbc.queryForList(
            "SELECT g.id, g.organization_id, g.seats, g.unit_price, g.discount_percent, g.status, g.created_at, e.title " +
                "FROM group_reservations g LEFT JOIN sessions s ON s.id = g.session_id LEFT JOIN events e ON e.id = s.event_id " +
                "WHERE g.status <> 'CANCELLED' AND g.id % 4 = 0 ORDER BY g.id",
            emptyMap<String, Any>(),
        )
        reservations.forEachIndexed { i, g ->
            val created = (g["created_at"] as Timestamp).toLocalDateTime().plusDays(1)
            val status = when {
                g["status"] == "PENDING" -> if (i % 2 == 0) "DRAFT" else "ISSUED"
                g["status"] == "COMPLETED" -> "PAID"
                else -> listOf("PAID", "PAID", "ISSUED", "ISSUED", "CANCELLED")[i % 5]
            }
            val seats = (g["seats"] as Number).toInt()
            val unit = g["unit_price"] as BigDecimal
            val subtotal = unit.multiply(BigDecimal(seats))
            val discount = subtotal.multiply(g["discount_percent"] as BigDecimal).divide(BigDecimal(100))
            val tax = (subtotal - discount).multiply(BigDecimal(10)).divide(BigDecimal(100))
            val title = (g["title"] as String?) ?: "برنامه فرهنگی ویژه دانش‌آموزان"
            val issue = created.toLocalDate()
            val id = crud.insert(
                "invoices",
                linkedMapOf(
                    "invoice_number" to "PF-TMP-$i", "organization_id" to g["organization_id"], "group_reservation_id" to g["id"],
                    "title" to "پیش‌فاکتور رزرو گروهی «$title»", "issue_date" to issue,
                    // A couple of issued invoices are already overdue.
                    "due_date" to if (status == "ISSUED" && i % 3 == 0) today.minusDays(3) else issue.plusDays(14), "status" to status,
                    "subtotal" to subtotal, "discount_amount" to discount, "tax_percent" to BigDecimal(10), "tax_amount" to tax,
                    "total_amount" to subtotal - discount + tax,
                    "paid_at" to if (status == "PAID") Timestamp.valueOf(minOf(created.plusDays(3), LocalDateTime.now().minusHours(2))) else null,
                    "created_at" to Timestamp.valueOf(created),
                ),
            )
            jdbc.update("UPDATE invoices SET invoice_number = :n WHERE id = :id", mapOf("n" to "PF-${10_000 + id}", "id" to id))
            crud.insert("invoice_items", linkedMapOf("invoice_id" to id, "description" to "بلیت گروهی «$title»", "quantity" to seats, "unit_price" to unit, "sort_order" to 0))
        }
        // One invoice not tied to a reservation (e.g. a hall rental)
        val id = crud.insert(
            "invoices",
            linkedMapOf(
                "invoice_number" to "PF-TMP-X", "organization_id" to organizations[9], "title" to "اجاره سالن برای همایش سالانه",
                "issue_date" to today.minusDays(2), "due_date" to today.plusDays(12), "status" to "ISSUED", "subtotal" to BigDecimal(185_000_000),
                "discount_amount" to BigDecimal(5_000_000), "tax_percent" to BigDecimal(10), "tax_amount" to BigDecimal(18_000_000),
                "total_amount" to BigDecimal(198_000_000), "notes" to "شامل تجهیزات صوت و تصویر و پذیرایی",
            ),
        )
        jdbc.update("UPDATE invoices SET invoice_number = :n WHERE id = :id", mapOf("n" to "PF-${10_000 + id}", "id" to id))
        listOf(Triple("اجاره سالن اصلی (۸ ساعت)", 1, 150_000_000), Triple("تجهیزات صوت و تصویر", 1, 25_000_000), Triple("پذیرایی میان‌وعده", 200, 50_000))
            .forEachIndexed { i, (d, q, p) ->
                crud.insert("invoice_items", linkedMapOf("invoice_id" to id, "description" to d, "quantity" to q, "unit_price" to BigDecimal(p), "sort_order" to i))
            }
    }

    /** Settlements with the organizers of the best-selling events. */
    private fun seedSettlements(events: List<Ev>) {
        val sales = jdbc.queryForList(
            "SELECT e.id, e.organizer_name, SUM(o.total_amount) AS gross FROM orders o JOIN sessions s ON s.id = o.session_id " +
                "JOIN events e ON e.id = s.event_id WHERE o.status = 'PAID' AND o.created_at < DATE_TRUNC('week', CURRENT_DATE) " +
                "GROUP BY e.id, e.organizer_name ORDER BY gross DESC LIMIT 16",
            emptyMap<String, Any>(),
        )
        val statuses = listOf("PAID", "PAID", "PAID", "APPROVED", "PENDING", "PAID", "REJECTED", "PENDING")
        sales.forEachIndexed { i, row ->
            val gross = (row["gross"] as BigDecimal).multiply(BigDecimal("0.6")).setScale(0, java.math.RoundingMode.DOWN)
            val percent = BigDecimal(if (i % 3 == 0) 12 else 10)
            val commission = gross.multiply(percent).divide(BigDecimal(100), 0, java.math.RoundingMode.HALF_UP)
            val status = statuses[i % statuses.size]
            val created = LocalDateTime.now().minusDays(2L + i * 2)
            val id = crud.insert(
                "settlements",
                linkedMapOf(
                    "settlement_number" to "ST-TMP-$i", "payee_name" to (row["organizer_name"] ?: "برگزارکننده"), "event_id" to row["id"],
                    "period_from" to today.minusDays(37), "period_to" to today.minusDays(7), "gross_amount" to gross,
                    "commission_percent" to percent, "commission_amount" to commission, "net_amount" to gross - commission,
                    "iban" to "IR%024d".format(120_000_000_000_000_000L + i * 7_777_777L), "status" to status,
                    "reference_code" to if (status == "PAID") "%010d".format(5_000_000_000L + i * 13_579L) else null,
                    "paid_at" to if (status == "PAID") Timestamp.valueOf(created.plusDays(1)) else null,
                    "notes" to if (status == "REJECTED") "مغایرت در گزارش فروش؛ نیاز به بررسی مجدد" else null,
                    "created_at" to Timestamp.valueOf(created),
                ),
            )
            jdbc.update("UPDATE settlements SET settlement_number = :n WHERE id = :id", mapOf("n" to "ST-${10_000 + id}", "id" to id))
        }
    }

    /** Gate log of the used tickets, plus some rejected scans. */
    private fun seedGateScans() {
        jdbc.update(
            "INSERT INTO gate_scans (ticket_id, ticket_code, session_id, gate_name, result, scanned_at) " +
                "SELECT t.id, t.ticket_code, t.session_id, 'گیت ' || (1 + t.id % 3), 'ACCEPTED', t.used_at FROM tickets t " +
                "WHERE t.status = 'USED' AND t.used_at >= LOCALTIMESTAMP - INTERVAL '14 days'",
            emptyMap<String, Any>(),
        )
        jdbc.update(
            "INSERT INTO gate_scans (ticket_id, ticket_code, session_id, gate_name, result, scanned_at) " +
                "SELECT t.id, t.ticket_code, t.session_id, 'گیت ' || (1 + t.id % 3), 'ALREADY_USED', t.used_at + INTERVAL '12 minutes' FROM tickets t " +
                "WHERE t.status = 'USED' AND t.used_at >= LOCALTIMESTAMP - INTERVAL '14 days' AND t.id % 37 = 0",
            emptyMap<String, Any>(),
        )
        jdbc.update(
            "INSERT INTO gate_scans (ticket_code, session_id, gate_name, result, scanned_at) " +
                "SELECT 'JT-' || (900000 + s.id * 7), s.id, 'گیت ۱', 'INVALID', s.start_time - INTERVAL '15 minutes' FROM sessions s " +
                "WHERE s.start_time < LOCALTIMESTAMP AND s.start_time >= LOCALTIMESTAMP - INTERVAL '14 days' AND s.id % 3 = 0",
            emptyMap<String, Any>(),
        )
    }

    /** Panel staff with limited roles (the main admin is created by MainAdminSeeder). */
    private fun seedStaff(): List<Long> {
        val staff = listOf(
            Triple("09121110001", "سارا محمدی", "EVENT_MANAGER"),
            Triple("09121110002", "رضا کاظمی", "FINANCE_MANAGER"),
            Triple("09121110003", "مریم حسینی", "SALES_MANAGER"),
            Triple("09121110004", "علی نوروزی", "GATE_OPERATOR"),
            Triple("09121110005", "الهام صادقی", "CONTENT_MANAGER"),
        )
        val ids = staff.mapIndexed { i, (mobile, name, role) ->
            val id = jdbc.queryForList("SELECT id FROM users WHERE mobile = :m", mapOf("m" to mobile), Long::class.java).firstOrNull()
                ?: crud.insert(
                    "users",
                    linkedMapOf(
                        "mobile" to mobile, "full_name" to name, "email" to "staff${i + 1}@javan.example.ir", "status" to "ACTIVE", "user_type" to "ADMIN",
                        "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(90L - i * 10)),
                        "last_login_at" to Timestamp.valueOf(LocalDateTime.now().minusHours(i * 7L + 1)),
                    ),
                )
            jdbc.update(
                "INSERT INTO user_roles (user_id, role_id) SELECT :u, id FROM roles WHERE name = :r ON CONFLICT DO NOTHING",
                mapOf("u" to id, "r" to role),
            )
            id
        }
        val main = jdbc.queryForList("SELECT id FROM users WHERE mobile = '09101414285'", emptyMap<String, Any>(), Long::class.java)
        return (main + ids).filterNotNull()
    }

    private fun seedCrm(users: List<Long>, organizations: List<Long>, staff: List<Long>) {
        val topics = listOf(
            Triple("CALL", "پیگیری خرید بلیت گروهی خانوادگی", "مشتری برای ۸ نفر درخواست تخفیف دارد."),
            Triple("SUPPORT", "مشکل در دریافت بلیت الکترونیکی", "پیامک بلیت دریافت نشده؛ بلیت مجدداً ارسال شد."),
            Triple("SMS", "اطلاع‌رسانی رویداد جدید", "ارسال پیامک معرفی جشنواره به مشتریان وفادار."),
            Triple("EMAIL", "درخواست فاکتور رسمی", "فاکتور رسمی سفارش برای مشتری ایمیل شود."),
            Triple("CALL", "نظرسنجی پس از رویداد", "رضایت کامل از کیفیت اجرا و نظم ورود."),
            Triple("MEETING", "جلسه هماهنگی بازدید دانش‌آموزان", "هماهنگی حمل‌ونقل و زمان ورود گروه‌ها."),
            Triple("CALL", "پیگیری پرداخت پیش‌فاکتور", "قرار شد تا پایان هفته پرداخت انجام شود."),
        )
        repeat(36) { i ->
            val (channel, subject, notes) = topics[i % topics.size]
            val forOrg = channel == "MEETING" || subject.contains("پیش‌فاکتور")
            val status = listOf("OPEN", "FOLLOW_UP", "CLOSED", "CLOSED")[i % 4]
            crud.insert(
                "crm_interactions",
                linkedMapOf(
                    "user_id" to if (forOrg) null else users[(i * 7) % 60], "organization_id" to if (forOrg) organizations[i % organizations.size] else null,
                    "channel" to channel, "subject" to subject, "notes" to notes, "status" to status,
                    "follow_up_at" to if (status == "CLOSED") null else Timestamp.valueOf(LocalDateTime.now().plusDays((i % 7) - 2L).withHour(10).withMinute(0)),
                    "created_by" to staff[i % staff.size], "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(i / 2L).minusHours(i % 5L)),
                ),
            )
        }
    }

    /** Two weeks of panel activity by the staff. */
    private fun seedActivityLog(staff: List<Long>) {
        val names = jdbc.queryForList("SELECT id, mobile, full_name FROM users WHERE id IN (:ids)", mapOf("ids" to staff)).associateBy { (it["id"] as Number).toLong() }
        val actions = listOf(
            listOf("UPDATE", "sessions", "ویرایش سانس (شناسه %d)"), listOf("CREATE", "events", "ثبت مورد جدید در بخش رویدادها"),
            listOf("ACTION", "orders", "استرداد سفارش JT-1%05d"), listOf("UPDATE", "halls", "ویرایش در بخش سالن‌ها (شناسه %d)"),
            listOf("ACTION", "invoices", "تغییر وضعیت پیش‌فاکتور PF-1%04d به صادر شده"), listOf("CREATE", "groupReservations", "ثبت مورد جدید در بخش رزروهای گروهی"),
            listOf("DELETE", "discounts", "حذف از بخش تخفیف و کد معرف (شناسه %d)"), listOf("UPDATE", "settings", "ویرایش در بخش تنظیمات سامانه"),
            listOf("ACTION", "settlements", "تغییر وضعیت تسویه ST-1%04d به تأیید شده"), listOf("UPDATE", "pageBlocks", "ویرایش در بخش سربرگ‌ها و بنرهای صفحات (شناسه %d)"),
        )
        val rows = mutableListOf<Map<String, Any?>>()
        for (day in 13 downTo 0) {
            staff.forEachIndexed { s, userId ->
                val user = names[userId] ?: return@forEachIndexed
                val login = LocalDateTime.now().minusDays(day.toLong()).withHour(8 + s).withMinute(5 + s * 7)
                if (login.isAfter(LocalDateTime.now())) return@forEachIndexed
                val base = mapOf("user" to userId, "mobile" to user["mobile"], "name" to user["full_name"], "ip" to "185.12.${60 + s}.${20 + day}")
                rows += base + mapOf("action" to "LOGIN", "section" to null, "description" to "ورود به پنل مدیریت", "method" to "POST", "path" to "/api/v1/auth/admin/verify", "at" to Timestamp.valueOf(login))
                repeat(1 + random.nextInt(4)) { k ->
                    val (action, section, text) = actions[random.nextInt(actions.size)]
                    val at = login.plusMinutes(10L + k * 23 + random.nextInt(20))
                    if (at.isAfter(LocalDateTime.now())) return@repeat
                    rows += base + mapOf(
                        "action" to action, "section" to section, "description" to text.format(random.nextInt(1, 400)),
                        "method" to when (action) { "DELETE" -> "DELETE"; "UPDATE" -> "PUT"; else -> "POST" }, "path" to "/api/v1/admin/$section",
                        "at" to Timestamp.valueOf(at),
                    )
                }
            }
        }
        jdbc.batchUpdate(
            "INSERT INTO activity_logs (user_id, actor_mobile, actor_name, action, section, description, method, path, status_code, ip_address, user_agent, created_at) " +
                "VALUES (:user, :mobile, :name, :action, :section, :description, :method, :path, 200, :ip, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0', :at)",
            rows.toTypedArray(),
        )
    }

    private fun seedAlerts() {
        listOf(
            Triple("ظرفیت سالن حافظ", "ظرفیت سالن حافظ (شیراز) به بیش از ۹۰٪ رسیده است.", "DANGER") to 45L,
            Triple("پرداخت ناموفق", "پرداخت یک سفارش با شناسه #۱۰۴۳ ناموفق بود.", "WARNING") to 120L,
            Triple("پیش‌فاکتور مدارس", "۳ پیش‌فاکتور مدارس در انتظار تأیید است.", "INFO") to 180L,
            Triple("موجودی کیف پول", "موجودی کیف پول درگاه به زیر ۱۰,۰۰۰,۰۰۰ تومان رسیده است.", "DANGER") to 300L,
            Triple("بروزرسانی سامانه", "بروزرسانی سامانه در تاریخ ۲۰ اردیبهشت انجام خواهد شد.", "SUCCESS") to 1440L,
            Triple("رزرو گروهی جدید", "۵ درخواست رزرو گروهی جدید از مدارس مشهد ثبت شد.", "INFO") to 2000L,
            Triple("تکمیل ظرفیت", "سانس ساعت ۱۰:۰۰ نمایش بزرگ جوان در آستانه تکمیل ظرفیت است.", "WARNING") to 2600L,
            Triple("تسویه حساب", "تسویه حساب دوره اول با برگزارکنندگان انجام شد.", "SUCCESS") to 4000L,
        ).forEach { (a, minutes) ->
            crud.insert(
                "system_alerts",
                linkedMapOf(
                    "title" to a.first, "message" to a.second, "alert_type" to a.third, "active" to true,
                    "created_at" to Timestamp.valueOf(LocalDateTime.now().minusMinutes(minutes)),
                ),
            )
        }
    }

    // ---------------------------------------------------------------- site content

    private fun seedSiteContent(categories: Map<String, Long>) {
        jdbc.update(
            "UPDATE site_settings SET site_name = 'مرکز همایش و نمایش جوان', short_name = 'جوان', " +
                "tagline = 'تجربه‌های به یادماندنی، برای همه نسل‌ها', " +
                "meta_description = 'خرید آنلاین بلیت همایش‌ها، نمایشگاه‌ها، کنسرت‌ها و رویدادهای فرهنگی در سراسر ایران', " +
                "contact_phone = '021-12345678', contact_email = 'info@javanfair.ir', " +
                "address = 'تهران، خیابان آزادی، مرکز همایش و نمایش جوان', " +
                "instagram_url = 'https://instagram.com/javanfair', telegram_url = 'https://t.me/javanfair', " +
                "linkedin_url = 'https://linkedin.com/company/javanfair', aparat_url = 'https://aparat.com/javanfair', " +
                "newsletter_title = 'از رویدادهای جدید باخبر شوید', newsletter_text = 'ایمیل خود را وارد کنید تا از رویدادهای ویژه مطلع شوید.', " +
                "footer_text = 'پلتفرم رسمی فروش بلیت رویدادهای فرهنگی، هنری، علمی و نمایشگاهی در سراسر کشور.', updated_at = CURRENT_TIMESTAMP",
            emptyMap<String, Any>(),
        )

        listOf(
            listOf("HOME_HERO", "تجربه‌های بهتر، با هم", "همایش‌ها، نمایش‌ها و رویدادهای برتر", "خرید آنلاین بلیت، آسان، سریع و مطمئن", null, null, "/media/heroes/home-hero.jpg"),
            listOf("HOME_CTA", "همیشه و همه‌جا با شما", "خرید بلیت، فقط چند کلیک فاصله دارد", "به جمع هزاران نفر از علاقه‌مندان رویدادهای فرهنگی، هنری و علمی بپیوندید.", "همین حالا ثبت نام کنید", "/login", "/media/heroes/cta.jpg"),
            listOf("EVENTS_HERO", null, "رویدادهای دیدنی، تجربیات ماندگار", "خرید بلیت نمایشگاه‌ها، همایش‌ها، کنفرانس‌ها و رویدادهای فرهنگی و آموزشی در سراسر ایران", null, null, "/media/heroes/events-hero.jpg"),
            listOf("SEAT_HERO", null, "انتخاب صندلی", "صندلی‌های دلخواه خود را از روی نقشه سالن انتخاب کنید.", null, null, "/media/heroes/seat-hero.jpg"),
        ).forEach { b ->
            crud.insert(
                "page_blocks",
                linkedMapOf(
                    "block_key" to b[0], "kicker" to b[1], "title" to b[2], "subtitle" to b[3], "button_text" to b[4], "button_url" to b[5],
                    "image_url" to b[6], "active" to true,
                ),
            )
        }

        listOf(
            Triple("پرداخت امن", "با درگاه‌های معتبر بانکی", "shield-check"),
            Triple("دریافت آنی بلیت", "دریافت بلیت به صورت آنلاین", "ticket"),
            Triple("پشتیبانی ۲۴ ساعته", "همراه شما در تمام مراحل", "headset"),
            Triple("تنوع رویدادها", "از کنسرت تا نمایش و نمایشگاه", "calendar-simple"),
        ).forEachIndexed { i, (title, text, icon) ->
            crud.insert("site_features", linkedMapOf("title" to title, "description" to text, "icon_url" to "/media/icons/common/$icon.svg", "sort_order" to i + 1))
        }

        crud.insert("home_sections", linkedMapOf("title" to "رویدادهای پیشنهادی", "subtitle" to null, "section_type" to "FEATURED", "item_limit" to 8, "sort_order" to 1))
        crud.insert("home_sections", linkedMapOf("title" to "رویدادهای این هفته", "subtitle" to "بهترین رویدادها در سراسر ایران", "section_type" to "THIS_WEEK", "item_limit" to 8, "sort_order" to 2))
        crud.insert(
            "home_sections",
            linkedMapOf("title" to "نمایشگاه‌های پیش رو", "subtitle" to null, "section_type" to "CATEGORY", "category_id" to categories["exhibition"], "item_limit" to 8, "sort_order" to 3),
        )

        val pages = listOf(
            Triple("about", "درباره مرکز همایش و نمایش جوان", ABOUT_TEXT),
            Triple("contact", "تماس با ما", "تیم پشتیبانی مرکز همایش و نمایش جوان همه‌روزه از ساعت ۸ تا ۲۲ پاسخ‌گوی شماست.\n\nبرای پیگیری سفارش، شماره سفارش خود را همراه داشته باشید."),
            Triple("buy-guide", "راهنمای خرید بلیت", BUY_GUIDE_TEXT),
            Triple("faq", "سوالات متداول", FAQ_TEXT),
            Triple("terms", "قوانین و مقررات", TERMS_TEXT),
            Triple("privacy", "حریم خصوصی", PRIVACY_TEXT),
        )
        pages.forEach { (slug, title, content) -> crud.insert("pages", linkedMapOf("slug" to slug, "title" to title, "content" to content, "active" to true)) }

        val header = crud.insert("link_groups", linkedMapOf("title" to "منوی اصلی", "placement" to "HEADER", "sort_order" to 1))
        val guide = crud.insert("link_groups", linkedMapOf("title" to "راهنمای کاربران", "placement" to "FOOTER", "sort_order" to 2))
        val quick = crud.insert("link_groups", linkedMapOf("title" to "دسترسی سریع", "placement" to "FOOTER", "sort_order" to 3))
        listOf(
            Triple(header, "صفحه اصلی", "/"), Triple(header, "رویدادها", "/events"), Triple(header, "درباره ما", "/about"),
            Triple(header, "راهنمای خرید", "/buy-guide"), Triple(header, "تماس با ما", "/contact"),
            Triple(guide, "راهنمای خرید بلیت", "/buy-guide"), Triple(guide, "سوالات متداول", "/faq"), Triple(guide, "قوانین و مقررات", "/terms"),
            Triple(guide, "حریم خصوصی", "/privacy"),
            Triple(quick, "صفحه اصلی", "/"), Triple(quick, "رویدادها", "/events"), Triple(quick, "نمایشگاه‌ها", "/events?category=exhibition"),
            Triple(quick, "همایش‌ها", "/events?category=conference"), Triple(quick, "تماس با ما", "/contact"),
        ).forEachIndexed { i, (group, title, url) ->
            crud.insert("links", linkedMapOf("group_id" to group, "title" to title, "url" to url, "sort_order" to i))
        }

        listOf(
            listOf("JAVAN20", "۲۰٪ تخفیف همه رویدادها", "PERCENT", 20, 500, -10, 30),
            listOf("WELCOME50", "۵۰ هزار تومان تخفیف اولین خرید", "AMOUNT", 50_000, 1000, -30, 60),
            listOf("STUDENT15", "تخفیف ویژه دانشجویان", "PERCENT", 15, null, -60, 120),
            listOf("EXPO10", "تخفیف نمایشگاه‌ها", "PERCENT", 10, 300, -5, 25),
            listOf("NOROOZ30", "جشنواره نوروزی (منقضی)", "PERCENT", 30, 200, -200, -150),
        ).forEach { d ->
            crud.insert(
                "discount_codes",
                linkedMapOf(
                    "code" to d[0], "title" to d[1], "discount_type" to d[2], "value" to BigDecimal((d[3] as Int).toLong()), "max_uses" to d[4],
                    "used_count" to random.nextInt(0, 40), "valid_from" to Timestamp.valueOf(today.plusDays((d[5] as Int).toLong()).atStartOfDay()),
                    "valid_to" to Timestamp.valueOf(today.plusDays((d[6] as Int).toLong()).atTime(23, 59)), "active" to true,
                ),
            )
        }

        listOf("sara.karimi", "ali.rezaei", "mina.ahmadi", "reza.hosseini", "neda.mousavi", "hamid.jafari", "parisa.sadeghi", "omid.kazemi")
            .forEachIndexed { i, e ->
                crud.insert(
                    "newsletter_subscribers",
                    linkedMapOf("email" to "$e@gmail.com", "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(i * 3L + 1))),
                )
            }

        // Homepage slider (after the HOME_HERO block). Each banner is tied to its event, so the link follows the event's slug.
        listOf(
            listOf("hamid-hirad-concert", "کنسرت بزرگ حمید هیراد", "تهران - سالن اصلی نمایشگاه بین‌المللی | اجرای زنده با ارکستر کامل", "/media/events/home5-1.jpg", "انتخاب سانس و خرید بلیت"),
            listOf("iran-tech-expo", "نمایشگاه بین‌المللی فناوری و نوآوری ایران", "بزرگ‌ترین رویداد فناوری کشور با حضور بیش از ۲۵۰ شرکت و استارتاپ", "/media/events/tech-expo-hero.png", "مشاهده و ثبت‌نام"),
            listOf("business-innovation", "همایش ملی نوآوری در کسب‌وکار", "از ایده تا بازار؛ انتخاب صندلی از روی نقشه سالن", "/media/events/poster-a1.jpg", "انتخاب صندلی"),
            listOf("hamlet", "نمایش هملت", "گروه تئاتر شهر - سالن فرعی مرکز همایش و نمایش جوان", "/media/events/home7-2.jpg", "خرید بلیت"),
        ).forEachIndexed { i, b ->
            val eventId = jdbc.queryForList("SELECT id FROM events WHERE slug = :s", mapOf("s" to b[0]), Long::class.java).firstOrNull()
            crud.insert(
                "banners",
                linkedMapOf(
                    "title" to b[1], "subtitle" to b[2], "image_url" to b[3], "link_url" to "/events/${b[0]}", "event_id" to eventId,
                    "button_text" to b[4], "sort_order" to i + 1, "active" to true,
                ),
            )
        }
    }

    // ---------------------------------------------------------------- demo customer

    /**
     * A customer account to try the user site with (sign in with [DEMO_CUSTOMER_MOBILE]; without an SMS key the code
     * is sms.dev-code): upcoming seat and general-admission tickets, used tickets, an abandoned checkout, a refunded
     * order and favorites.
     */
    private fun seedDemoCustomer(cities: Map<String, Long>, events: List<Ev>, sessions: List<SessionRef>) {
        val userId = crud.insert(
            "users",
            linkedMapOf(
                "mobile" to DEMO_CUSTOMER_MOBILE, "full_name" to "سارا رضایی", "first_name" to "سارا", "last_name" to "رضایی",
                "email" to "sara.rezaei@example.com", "city_id" to cities["تهران"], "status" to "ACTIVE", "user_type" to "USER",
                "created_at" to Timestamp.valueOf(LocalDateTime.now().minusDays(120)),
            ),
        )
        fun session(slug: String, index: Int = 0) = sessions.filter { it.event.def.slug == slug }[index]
        var n = 1
        fun order(s: SessionRef, status: String, createdAt: LocalDateTime, seats: List<Map<String, Any?>> = emptyList(), quantity: Int = seats.size): Long {
            val unit = BigDecimal(s.event.def.price)
            val total = if (seats.isEmpty()) unit.multiply(BigDecimal(quantity)) else seats.sumOf { it["price"] as BigDecimal }
            val number = "JT-D%04d".format(n++)
            val orderId = crud.insert(
                "orders",
                linkedMapOf(
                    "order_number" to number, "user_id" to userId, "session_id" to s.id, "quantity" to if (seats.isEmpty()) quantity else null,
                    "total_amount" to total, "status" to status, "payment_method" to "ONLINE",
                    "tracking_code" to if (status == "PENDING" || status == "CANCELLED") null else "%012d".format(random.nextLong(100_000_000_000L, 999_999_999_999L)),
                    "buyer_first_name" to "سارا", "buyer_last_name" to "رضایی", "buyer_mobile" to DEMO_CUSTOMER_MOBILE,
                    "buyer_email" to "sara.rezaei@example.com", "created_at" to Timestamp.valueOf(createdAt),
                    "paid_at" to if (status == "PENDING" || status == "CANCELLED") null else Timestamp.valueOf(createdAt.plusMinutes(3)),
                    "refunded_at" to if (status == "REFUNDED") Timestamp.valueOf(createdAt.plusDays(1)) else null,
                    "refund_reason" to if (status == "REFUNDED") "انصراف مشتری از حضور در رویداد" else null,
                ),
            )
            if (status == "PENDING" || status == "CANCELLED") return orderId
            val ticketStatus = when {
                status == "REFUNDED" -> "CANCELLED"
                s.start.isBefore(LocalDateTime.now()) -> "USED"
                else -> "VALID"
            }
            repeat(quantity) { i ->
                val seat = seats.getOrNull(i)
                seat?.let {
                    jdbc.update(
                        "INSERT INTO seat_reservations (session_id, seat_id, status, order_id) VALUES (:s, :seat, 'SOLD', :o) " +
                            "ON CONFLICT (session_id, seat_id) DO UPDATE SET status = 'SOLD', order_id = :o",
                        mapOf("s" to s.id, "seat" to it["id"], "o" to orderId),
                    )
                }
                crud.insert(
                    "tickets",
                    linkedMapOf(
                        "ticket_code" to "$number-${i + 1}", "qr_code" to SecureCodes.ticketQr(), "order_id" to orderId, "user_id" to userId,
                        "session_id" to s.id, "seat_id" to seat?.get("id"),
                        "seat_label" to if (seat != null) "ردیف ${seat["row_label"]} - صندلی ${seat["seat_number"]}" else "ورود عمومی",
                        "price" to (seat?.get("price") ?: unit), "status" to ticketStatus,
                        "used_at" to if (ticketStatus == "USED") Timestamp.valueOf(s.start.minusMinutes(25)) else null,
                        "created_at" to Timestamp.valueOf(createdAt.plusMinutes(3)),
                    ),
                )
            }
            return orderId
        }

        // Two VIP seats in the middle of the front rows of a seat-mapped session (freed if the random fill took them).
        val seatSession = session("business-innovation")
        val seats = jdbc.queryForList(
            "SELECT st.id, st.row_label, st.seat_number, COALESCE(sp.price, s.price) AS price FROM seats st " +
                "JOIN sessions s ON s.id = :s LEFT JOIN session_prices sp ON sp.session_id = s.id AND sp.tier_code = st.tier_code " +
                "WHERE st.hall_id = s.hall_id AND st.disabled = FALSE AND st.tier_code = 'VIP' ORDER BY st.row_index, ABS(st.seat_number - 7) LIMIT 2",
            mapOf("s" to seatSession.id),
        )
        order(seatSession, "PAID", LocalDateTime.now().minusDays(3), seats = seats)
        order(session("hamid-hirad-concert"), "PAID", LocalDateTime.now().minusDays(6), quantity = 3)
        order(session("iran-tech-expo", 1), "PAID", LocalDateTime.now().minusDays(1).withHour(21), quantity = 1)
        order(session("contemporary-art-expo"), "PAID", LocalDateTime.now().minusDays(12), quantity = 2)
        order(session("hamlet"), "REFUNDED", LocalDateTime.now().minusDays(9), quantity = 2)
        // Unpaid orders expire after checkout.hold-minutes, so the abandoned checkout is seeded as cancelled.
        order(session("alireza-ghorbani"), "CANCELLED", LocalDateTime.now().minusDays(2), quantity = 2)

        listOf("alireza-ghorbani", "iran-tech-expo", "hamlet", "city-of-colors", "ux-workshop", "book-media-expo").forEachIndexed { i, slug ->
            val event = events.first { it.def.slug == slug }
            jdbc.update(
                "INSERT INTO user_favorites (user_id, event_id, created_at) VALUES (:u, :e, :at) ON CONFLICT DO NOTHING",
                mapOf("u" to userId, "e" to event.id, "at" to Timestamp.valueOf(LocalDateTime.now().minusDays(i * 4L + 1))),
            )
        }
    }

    /** One gateway payment per order: verified for paid / refunded orders, failed or still open for the others. */
    private fun seedPayments() {
        jdbc.update(
            "INSERT INTO payments (order_id, gateway, amount, status, authority, reference_id, tracking_code, card_pan, created_at, verified_at) " +
                "SELECT o.id, 'dev', o.total_amount, 'SUCCESS', 'DEMO-' || o.id || '-' || md5(o.order_number), " +
                "  LPAD(((o.id * 7919) % 1000000000)::text, 12, '0'), o.tracking_code, " +
                "  '6037-99**-****-' || LPAD(((o.id * 37) % 10000)::text, 4, '0'), o.created_at, COALESCE(o.paid_at, o.created_at) " +
                "FROM orders o WHERE o.status IN ('PAID', 'REFUNDED')",
            emptyMap<String, Any>(),
        )
        jdbc.update(
            "INSERT INTO payments (order_id, gateway, amount, status, authority, failure_reason, created_at, verified_at) " +
                "SELECT o.id, 'dev', o.total_amount, CASE WHEN o.status = 'CANCELLED' THEN 'FAILED' ELSE 'INITIATED' END, " +
                "  'DEMO-' || o.id || '-' || md5(o.order_number), " +
                "  CASE WHEN o.status = 'CANCELLED' THEN 'انصراف کاربر در صفحه درگاه' END, o.created_at, " +
                "  CASE WHEN o.status = 'CANCELLED' THEN o.created_at + INTERVAL '4 minutes' END " +
                "FROM orders o WHERE o.status IN ('PENDING', 'CANCELLED')",
            emptyMap<String, Any>(),
        )
    }

    private fun defaultDescription(e: EventDef): String =
        "${e.title} با حضور برترین هنرمندان، متخصصان و فعالان این حوزه برگزار می‌شود. این رویداد فرصتی ارزشمند برای " +
            "آشنایی با جدیدترین دستاوردها، گفت‌وگو با صاحب‌نظران و تجربه‌ای به‌یادماندنی برای همه علاقه‌مندان است.\n\n" +
            "برگزارکننده: ${e.organizer}"

    // ---------------------------------------------------------------- data definitions

    private data class Cat(val slug: String, val name: String, val tagline: String, val icon: String, val color: String, val cover: String)

    private data class H(
        val key: String, val city: String, val name: String, val venue: String, val type: String, val capacity: Int, val gates: Int,
        val status: String, val image: Int, val address: String, val seatMap: Boolean = false,
    )

    private data class HallRef(val id: Long, val cityId: Long, val capacity: Int, val seatMap: Boolean)

    private data class Sec(val name: String, val firstRow: Int, val rows: Int, val perRow: Int, val x: Double, val y: Double, val curve: Double, val tier: String)

    private data class S(
        val day: Int, val time: LocalTime, val fill: Double, val minutes: Int = 120, val hall: String? = null, val capacity: Int? = null,
        val title: String? = null,
    )

    private data class Page(
        val stats: List<List<String>> = emptyList(),
        val topics: List<Triple<String, String, String>> = emptyList(),
        val speakers: List<List<String>> = emptyList(),
        val gallery: List<Pair<String, String>> = emptyList(),
        val faqs: List<Pair<String, String>> = emptyList(),
    )

    private data class EventDef(
        val slug: String, val title: String, val category: String, val hall: String, val image: String, val price: Int,
        val sessions: List<S>, val status: String = "PUBLISHED", val featured: Boolean = false, val popular: Boolean = false,
        val subtitle: String? = null, val organizer: String = "مرکز همایش و نمایش جوان", val dateRange: Pair<Int, Int>? = null,
        val website: String? = null, val notice: String? = null, val description: String? = null, val page: Page? = null,
        val tierPrices: Map<String, Int>? = null, val createdDaysAgo: Int = 20,
    )

    private data class Ev(val id: Long, val def: EventDef, val hall: HallRef)

    private data class SessionRef(val id: Long, val event: Ev, val start: LocalDateTime, val capacity: Int)

    private companion object {
        const val SEED_VERSION = "2026-10-demo-v5"

        /** Customer account of the demo (orders, tickets and favorites on the user site). */
        const val DEMO_CUSTOMER_MOBILE = "09121234567"

        /** Events inserted by the V1 migration; on their own they do not count as the installation's data. */
        val V1_SAMPLE_EVENTS = listOf("circus-tehran", "kids-laugh-show", "ai-youth-conference", "iranian-concert")

        private fun t(h: Int, m: Int = 0): LocalTime = LocalTime.of(h, m)

        /** Day offset (from today) of a weekday in the current Saturday-first week, for the rotation calendar. */
        private fun wd(day: DayOfWeek): Int {
            val today = LocalDate.now()
            val saturday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.SATURDAY))
            return (saturday.with(TemporalAdjusters.nextOrSame(day)).toEpochDay() - today.toEpochDay()).toInt()
        }

        /** ~500 seats in three tiers of blocks, matching the seat map designs. */
        val THEATRE_LAYOUT = listOf(
            Sec("جناح راست - جلو", 1, 8, 7, 23.0, 0.0, 1.4, "SILVER"),
            Sec("مرکز - ردیف‌های VIP", 1, 3, 14, 8.5, 0.0, 1.4, "VIP"),
            Sec("مرکز - جلو", 4, 5, 14, 8.5, 3.0, 1.4, "GOLD"),
            Sec("جناح چپ - جلو", 1, 8, 7, 0.0, 0.0, 1.4, "SILVER"),
            Sec("جناح راست - میانه", 9, 6, 7, 23.0, 9.4, 1.4, "NORMAL"),
            Sec("مرکز - میانه", 9, 6, 14, 8.5, 9.4, 1.4, "GOLD"),
            Sec("جناح چپ - میانه", 9, 6, 7, 0.0, 9.4, 1.4, "NORMAL"),
            Sec("جناح راست - عقب", 15, 4, 6, 23.5, 16.8, 1.4, "NORMAL"),
            Sec("مرکز - عقب", 15, 4, 14, 8.5, 16.8, 1.4, "NORMAL"),
            Sec("جناح چپ - عقب", 15, 4, 6, 0.5, 16.8, 1.4, "NORMAL"),
        )

        val TECH_EXPO_PAGE = Page(
            stats = listOf(
                listOf("+۱۵,۰۰۰", "بازدیدکننده پیش‌بینی‌شده", "/media/icons/common/ticket.svg", "#EF476F"),
                listOf("+۲۰", "نشست و کارگاه", "/media/icons/common/profile.svg", "#F5A524"),
                listOf("+۴۰", "سخنران تخصصی", "/media/icons/admin/crm.svg", "#2F80F5"),
                listOf("+۲۵۰", "شرکت‌کننده و برند", "/media/icons/admin/organizations.svg", "#22C55E"),
            ),
            topics = listOf(
                Triple("شهر هوشمند و حکمرانی دیجیتال", "/media/icons/common/cities.svg", "#8B5CF6"),
                Triple("فناوری‌های صنعتی و تولید هوشمند", "/media/icons/common/settings.svg", "#22C55E"),
                Triple("استارتاپ‌ها و سرمایه‌گذاری", "/media/icons/categories/business.svg", "#F5A524"),
                Triple("فناوری‌های ابری و زیرساخت", "/media/icons/categories/technology.svg", "#2F80F5"),
                Triple("هوش مصنوعی و داده‌محور", "/media/icons/categories/education.svg", "#EF476F"),
            ),
            speakers = listOf(
                listOf("دکتر امیر حسینی", "استاد دانشگاه تهران", "متخصص هوش مصنوعی", "/media/speakers/speaker-1.jpg"),
                listOf("مهندس علی رضایی", "مدیرعامل", "صندوق نوآوری و شکوفایی", "/media/speakers/speaker-2.jpg"),
                listOf("دکتر سارا محمدی", "مدیر نوآوری", "شرکت دانش‌بنیان آریانا", "/media/speakers/speaker-3.jpg"),
                listOf("دکتر نیما کاظمی", "عضو هیئت علمی", "دانشگاه صنعتی شریف", null),
                listOf("مهندس الهام صادقی", "مدیر محصول", "شتاب‌دهنده فناوری پارسه", null),
            ).map { it.map { v -> v ?: "" } },
            gallery = listOf(
                "/media/events/tech-expo-hero.png" to "نمای کلی سالن نمایشگاه",
                "/media/events/card-3.jpg" to "غرفه‌های شرکت‌های دانش‌بنیان",
                "/media/events/card-4.jpg" to "نشست تخصصی هوش مصنوعی",
                "/media/events/card-7.jpg" to "بخش نمایشگاهی صنایع",
                "/media/events/poster-a8.jpg" to "پاویون فناوری‌های نوین",
                "/media/events/card-2.jpg" to "سالن همایش اصلی",
            ),
            faqs = listOf(
                "بازدید از نمایشگاه رایگان است؟" to "بازدید عمومی از نمایشگاه با تهیه بلیت ورودی امکان‌پذیر است؛ برخی کارگاه‌ها نیاز به ثبت‌نام جداگانه دارند.",
                "آیا امکان پارک خودرو وجود دارد؟" to "پارکینگ عمومی نمایشگاه بین‌المللی تهران در تمام روزهای برگزاری باز است.",
                "بلیت را چگونه دریافت می‌کنم؟" to "پس از پرداخت، بلیت الکترونیکی با کد QR در حساب کاربری شما صادر می‌شود و در ورودی اسکن می‌شود.",
                "آیا امکان استرداد بلیت وجود دارد؟" to "تا ۲۴ ساعت پیش از شروع هر نشست، امکان استرداد بلیت با کسر ۱۰٪ کارمزد وجود دارد.",
            ),
        )

        val EVENTS: List<EventDef> by lazy {
            listOf(
                // ---- Admin "events" screen
                EventDef("ai-digital-conference", "کنفرانس ملی هوش مصنوعی و تحول دیجیتال", "conference", "javan-main", "/media/events/poster-a1.jpg", 350_000,
                    listOf(S(6, t(10), 0.78, 360)), featured = true, subtitle = "آینده کسب‌وکارها در عصر داده", organizer = "انجمن هوش مصنوعی ایران"),
                EventDef("youth-music-festival", "جشنواره موسیقی جوانان", "music", "ferdowsi", "/media/events/poster-a2.jpg", 300_000,
                    listOf(S(19, t(20), 0.0, 180)), status = "DRAFT", organizer = "انجمن موسیقی خراسان"),
                EventDef("book-innovation-expo", "نمایشگاه بین‌المللی کتاب و نوآوری", "exhibition", "sepahan", "/media/events/poster-a3.jpg", 120_000,
                    listOf(S(26, t(10), 0.74, 600), S(27, t(10), 0.5, 600)), popular = true, organizer = "مؤسسه نمایشگاه‌های فرهنگی ایران"),
                EventDef("digital-economy-summit", "همایش توسعه کسب‌وکار در اقتصاد دیجیتال", "business", "hafez", "/media/events/poster-a4.jpg", 250_000,
                    listOf(S(1, t(9), 0.70, 480)), organizer = "اتاق بازرگانی شیراز"),
                EventDef("contemporary-art-expo", "نمایشگاه هنر معاصر ایران", "exhibition", "setaregan", "/media/events/poster-a5.jpg", 90_000,
                    listOf(S(-4, t(19), 1.0, 180)), organizer = "خانه هنرمندان تبریز", createdDaysAgo = 40),
                EventDef("city-of-colors", "نمایش کودک و نوجوان شهر رنگ‌ها", "kids", "javan-side", "/media/events/poster-a6.jpg", 150_000,
                    listOf(S(9, t(16), 0.62, 180), S(10, t(16), 0.4, 180)), featured = true),
                EventDef("startup-investment", "رویداد استارتاپ‌ها و سرمایه‌گذاری", "business", "intl-mashhad", "/media/events/poster-a7.jpg", 200_000,
                    listOf(S(30, t(9), 0.0, 540)), status = "DRAFT", organizer = "شتاب‌دهنده نوآوری شرق"),
                EventDef("creative-tech-expo", "نمایشگاه فناوری‌های نوین و صنایع خلاق", "exhibition", "main-tehran", "/media/events/poster-a8.jpg", 100_000,
                    listOf(S(36, t(20), 0.0, 120, capacity = 700)), status = "CANCELLED"),

                // ---- Admin "sessions" screen and dashboard "today's sessions"
                EventDef("javan-grand-show", "نمایش بزرگ جوان", "theater", "javan-main", "/media/events/poster-s1.jpg", 250_000,
                    listOf(S(0, t(10), 0.92), S(2, t(10), 0.55), S(5, t(18), 0.3)), popular = true, subtitle = "نمایش و تئاتر خانوادگی"),
                EventDef("zendegi-concert", "کنسرت زندگی", "music", "ferdowsi", "/media/events/poster-s2.jpg", 400_000,
                    listOf(S(0, t(14), 0.87), S(1, t(14), 0.69)), popular = true, organizer = "گروه موسیقی زندگی"),
                EventDef("kids-teens-show", "نمایش کودک و نوجوان", "kids", "sepahan", "/media/events/poster-s3.jpg", 180_000,
                    listOf(S(0, t(16, 30), 0.80), S(1, t(16, 30), 0.8))),
                EventDef("intl-circus", "سیرک بین‌المللی", "other", "hafez", "/media/events/poster-s4.jpg", 220_000,
                    listOf(S(0, t(18), 0.47), S(2, t(18), 0.47)), featured = true, subtitle = "سرگرمی و هیجان برای همه"),
                EventDef("science-show", "نمایش علمی - آموزشی", "workshop", "setaregan", "/media/events/poster-s5.jpg", 120_000,
                    listOf(S(0, t(20, 30), 0.18), S(3, t(20, 30), 0.18))),
                EventDef("youth-film-festival", "جشنواره فیلم جوان", "other", "javan-main", "/media/events/poster-s6.jpg", 150_000,
                    listOf(S(4, t(15), 0.53)), subtitle = "سینما"),
                EventDef("rainbow-puppets", "نمایش عروسکی رنگین‌کمان", "kids", "ferdowsi", "/media/events/poster-s7.jpg", 130_000,
                    listOf(S(5, t(11), 0.90))),
                EventDef("northern-nights", "کنسرت شب‌های شمال", "music", "sepahan", "/media/events/poster-s8.jpg", 350_000,
                    listOf(S(6, t(21), 0.40)), organizer = "گروه موسیقی شمال"),

                // ---- User home "recommended events"
                EventDef("intl-auto-show", "نمایشگاه بین‌المللی خودرو", "exhibition", "main-tehran", "/media/events/home7-1.jpg", 100_000,
                    listOf(S(30, t(10), 0.35, 480, capacity = 1200), S(31, t(10), 0.2, 480, capacity = 1200)), featured = true, dateRange = 30 to 34,
                    subtitle = "جدیدترین محصولات خودروسازان داخلی و خارجی", organizer = "شرکت نمایشگاه‌های بین‌المللی ایران"),
                EventDef("hamlet", "نمایش هملت", "theater", "javan-side", "/media/events/home7-2.jpg", 180_000,
                    listOf(S(3, t(19), 0.66), S(4, t(19), 0.4)), featured = true, popular = true, organizer = "گروه تئاتر شهر"),
                EventDef("next-gen-leadership", "همایش مدیریت نسل آینده", "conference", "javan-main", "/media/events/home7-3.jpg", 290_000,
                    listOf(S(12, t(9), 0.45, 480)), featured = true, organizer = "انجمن مدیریت ایران"),
                EventDef("alireza-ghorbani", "کنسرت علیرضا قربانی", "music", "main-tehran", "/media/events/home7-4.jpg", 450_000,
                    listOf(S(21, t(21), 0.81, 150, capacity = 2000)), featured = true, popular = true, organizer = "مؤسسه فرهنگی هنری آوای ایرانی"),

                // ---- User "events list" screen
                EventDef("green-festival", "جشنواره محیط زیست و توسعه پایدار", "other", "sepahan", "/media/events/card-1.jpg", 90_000,
                    listOf(S(15, t(10), 0.2, 480)), dateRange = 15 to 17, subtitle = "رویداد فرهنگی", featured = true),
                EventDef("digital-transformation-iran", "کنفرانس تحول دیجیتال در ایران", "conference", "ferdowsi", "/media/events/card-2.jpg", 350_000,
                    listOf(S(23, t(10), 0.3, 420)), featured = true),
                EventDef("building-industry-expo", "بیست و هفتمین نمایشگاه بین‌المللی صنعت ساختمان", "exhibition", "main-tehran", "/media/events/card-3.jpg", 120_000,
                    listOf(S(33, t(9), 0.1, 540, capacity = 2500)), dateRange = 33 to 36, organizer = "شرکت نمایشگاه‌های بین‌المللی ایران"),
                EventDef("ai-business-future", "همایش ملی هوش مصنوعی و آینده کسب‌وکارها", "conference", "javan-main", "/media/events/card-4.jpg", 750_000,
                    listOf(S(18, t(9), 0.52, 480)), featured = true, popular = true, organizer = "انجمن هوش مصنوعی ایران"),
                EventDef("book-media-expo", "نمایشگاه بین‌المللی کتاب و رسانه", "exhibition", "main-tehran", "/media/events/card-5.jpg", 70_000,
                    listOf(S(8, t(10), 0.35, 600, capacity = 2500), S(9, t(10), 0.3, 600, capacity = 2500)), dateRange = 8 to 12, popular = true),
                EventDef("health-innovation", "همایش نوآوری در صنعت سلامت", "conference", "javan-main", "/media/events/card-6.jpg", 280_000,
                    listOf(S(28, t(9, 30), 0.25, 450))),
                EventDef("auto-parts-expo", "نمایشگاه بین‌المللی خودرو و صنایع وابسته", "exhibition", "ferdowsi-tabriz", "/media/events/card-7.jpg", 100_000,
                    listOf(S(24, t(10), 0.15, 480)), dateRange = 24 to 27),
                EventDef("ux-workshop", "کارگاه طراحی تجربه کاربری (UX)", "workshop", "hafez", "/media/events/card-8.jpg", 450_000,
                    listOf(S(14, t(14), 0.6, 240)), popular = true, organizer = "آکادمی طراحی پارس"),

                // ---- User "event detail" screen
                EventDef("iran-tech-expo", "نمایشگاه بین‌المللی فناوری و نوآوری ایران", "exhibition", "main-tehran", "/media/events/tech-expo-hero.png", 150_000,
                    listOf(
                        S(17, t(9), 0.3, 540, capacity = 2500, title = "روز اول: افتتاحیه و بازدید عمومی"),
                        S(18, t(10), 0.2, 180, hall = "javan-main", title = "کارگاه هوش مصنوعی مولد"),
                        S(19, t(14), 0.15, 180, hall = "javan-main", title = "پنل سرمایه‌گذاری در استارتاپ‌ها"),
                        S(20, t(9), 0.1, 540, capacity = 2500, title = "روز چهارم: بازدید عمومی و اختتامیه"),
                    ),
                    featured = true, popular = true, dateRange = 17 to 21, subtitle = "فرصتی برای ارتباط، سرمایه‌گذاری و توسعه کسب‌وکارهای نوآورانه",
                    organizer = "شرکت نمایشگاه‌های بین‌المللی ایران", website = "https://www.irantechexpo.ir",
                    notice = "بازدید از نمایشگاه برای علاقه‌مندان با ثبت‌نام و انتخاب بلیت امکان‌پذیر است. برخی از نشست‌ها و کارگاه‌ها ظرفیت محدود دارند، بنابراین پیشنهاد می‌کنیم از همین حالا نشست موردنظر خود را انتخاب و ثبت‌نام کنید.",
                    description = "نمایشگاه بین‌المللی فناوری و نوآوری ایران (Iran Tech Expo) بزرگ‌ترین رویداد فناوری کشور است که با هدف ایجاد بستری برای معرفی دستاوردهای نوآورانه، توسعه همکاری‌های تجاری و سرمایه‌گذاری، و تقویت زیست‌بوم فناوری و استارتاپی برگزار می‌شود. این رویداد میزبان شرکت‌های دانش‌بنیان، استارتاپ‌ها، سرمایه‌گذاران، سازمان‌های دولتی و علاقه‌مندان به فناوری از سراسر ایران و منطقه خواهد بود.",
                    page = TECH_EXPO_PAGE),

                // ---- User "seat selection" screen
                EventDef("business-innovation", "همایش ملی نوآوری در کسب‌وکار", "conference", "javan-main", "/media/events/poster-a1.jpg", 500_000,
                    listOf(S(11, t(10), 0.35, 300), S(13, t(16), 0.2, 300)), featured = true, subtitle = "از ایده تا بازار",
                    tierPrices = mapOf("VIP" to 1_500_000, "GOLD" to 1_260_000, "SILVER" to 800_000, "NORMAL" to 500_000)),

                // ---- Previous homepage design
                EventDef("hamid-hirad-concert", "کنسرت بزرگ حمید هیراد", "music", "main-tehran", "/media/events/home5-1.jpg", 450_000,
                    listOf(S(16, t(21), 0.7, 150, capacity = 2000)), popular = true, organizer = "مؤسسه فرهنگی هنری آوا"),
                EventDef("red-hat-puppets", "نمایش عروسکی کلاه قرمزی", "kids", "ferdowsi", "/media/events/home5-2.jpg", 160_000,
                    listOf(S(7, t(17), 0.55), S(8, t(17), 0.3)), popular = true),
                EventDef("iran-circus", "سیرک بین‌المللی ایران", "other", "sepahan", "/media/events/home5-3.jpg", 200_000,
                    listOf(S(9, t(19), 0.4)), featured = true),
                EventDef("story-city-musical", "نمایش موزیکال شهر قصه", "theater", "hafez", "/media/events/home5-4.jpg", 170_000,
                    listOf(S(10, t(18), 0.45))),
                EventDef("tech-innovation-expo", "نمایشگاه تکنولوژی و نوآوری", "exhibition", "main-tehran", "/media/events/home5-5.jpg", 80_000,
                    listOf(S(40, t(10), 0.05, 480, capacity = 2500)), dateRange = 40 to 43),

                // ---- Rotation calendar week (one session each, Saturday-first week of today)
                EventDef("javan-expo-opening", "افتتاحیه نمایشگاه جوان", "exhibition", "main-tehran", "/media/events/card-3.jpg", 50_000,
                    listOf(S(wd(DayOfWeek.SATURDAY), t(9), 0.9, 120, capacity = 500))),
                EventDef("industry-future-expo", "نمایشگاه صنعت و آینده", "exhibition", "javan-main", "/media/events/card-7.jpg", 90_000,
                    listOf(S(wd(DayOfWeek.MONDAY), t(9), 0.8, 180))),
                EventDef("ai-training-summit", "همایش آموزشی هوش مصنوعی", "conference", "ferdowsi", "/media/events/card-4.jpg", 200_000,
                    listOf(S(wd(DayOfWeek.SUNDAY), t(10), 0.7))),
                EventDef("tourism-panel", "نشست تخصصی صنعت گردشگری", "workshop", "hafez", "/media/events/card-1.jpg", 120_000,
                    listOf(S(wd(DayOfWeek.SATURDAY), t(13), 0.66))),
                EventDef("entrepreneur-panel", "پنل گفتگو کارآفرینی", "conference", "sepahan", "/media/events/poster-a7.jpg", 100_000,
                    listOf(S(wd(DayOfWeek.MONDAY), t(15), 0.73))),
                EventDef("roshan-days", "نمایش تئاتر روزهای روشن", "theater", "javan-side", "/media/events/theater.webp", 150_000,
                    listOf(S(wd(DayOfWeek.SUNDAY), t(16), 0.72))),
                EventDef("short-film-festival", "جشنواره فیلم کوتاه", "theater", "setaregan", "/media/events/poster-s6.jpg", 80_000,
                    listOf(S(wd(DayOfWeek.MONDAY), t(19), 0.76))),
                EventDef("youth-pop-concert", "کنسرت موسیقی پاپ جوان", "music", "ferdowsi", "/media/events/concert.webp", 300_000,
                    listOf(S(wd(DayOfWeek.SATURDAY), t(19), 0.89))),
                EventDef("youth-startup-day", "رویداد استارتاپی نوآوری جوان", "workshop", "hafez", "/media/events/poster-a4.jpg", 60_000,
                    listOf(S(wd(DayOfWeek.TUESDAY), t(11), 0.75))),
                EventDef("wonder-science", "نمایش علمی دنیای شگفت‌انگیز", "theater", "javan-main", "/media/events/poster-s5.jpg", 110_000,
                    listOf(S(wd(DayOfWeek.WEDNESDAY), t(9, 30), 0.8))),
                EventDef("kids-painting", "کارگاه نقاشی کودکان", "workshop", "sepahan", "/media/events/poster-a6.jpg", 90_000,
                    listOf(S(wd(DayOfWeek.WEDNESDAY), t(13), 0.75))),
                EventDef("kids-cinema", "سینمای ویژه کودکان", "kids", "ferdowsi", "/media/events/poster-s7.jpg", 70_000,
                    listOf(S(wd(DayOfWeek.WEDNESDAY), t(18), 0.5))),
                EventDef("new-tech-summit", "همایش فناوری‌های نوین", "conference", "ferdowsi", "/media/events/card-2.jpg", 180_000,
                    listOf(S(wd(DayOfWeek.THURSDAY), t(10), 1.0))),
                EventDef("modern-art-show", "نمایش بین‌المللی هنر مدرن", "theater", "hafez", "/media/events/poster-a5.jpg", 140_000,
                    listOf(S(wd(DayOfWeek.THURSDAY), t(17), 0.85))),
                EventDef("story-city-puppets", "نمایش عروسکی شهر قصه‌ها", "kids", "setaregan", "/media/events/home5-2.jpg", 100_000,
                    listOf(S(wd(DayOfWeek.TUESDAY), t(15), 0.8, 90))),
                EventDef("teen-robotics", "کارگاه رباتیک نوجوانان", "workshop", "sepahan", "/media/events/technology.webp", 160_000,
                    listOf(S(wd(DayOfWeek.SUNDAY), t(13), 0.75))),
                EventDef("traditional-concert", "کنسرت موسیقی سنتی", "music", "javan-main", "/media/events/home7-4.jpg", 260_000,
                    listOf(S(wd(DayOfWeek.TUESDAY), t(19), 0.93))),
            ).also { list -> check(list.map { it.slug }.toSet().size == list.size) { "duplicate event slug" } }
        }

        const val ABOUT_TEXT =
            "مرکز همایش و نمایش جوان، پلتفرم رسمی فروش بلیت رویدادهای فرهنگی، هنری، علمی و نمایشگاهی در سراسر کشور است.\n\n" +
                "ما با همکاری بیش از ۲۰۰ برگزارکننده، هر سال میزبان صدها همایش، نمایشگاه، کنسرت و نمایش در شهرهای تهران، مشهد، اصفهان، شیراز و تبریز هستیم.\n\n" +
                "هدف ما فراهم کردن تجربه‌ای آسان، سریع و مطمئن برای خرید بلیت و حضور در رویدادهای به‌یادماندنی است."

        const val BUY_GUIDE_TEXT =
            "۱. رویداد موردنظر خود را از صفحه رویدادها پیدا کنید؛ می‌توانید بر اساس شهر، دسته‌بندی و زمان جستجو کنید.\n\n" +
                "۲. در صفحه رویداد، سانس یا نشست موردنظر را انتخاب کنید.\n\n" +
                "۳. صندلی‌های دلخواه را از روی نقشه سالن انتخاب کنید. صندلی‌های انتخاب‌شده تا ۱۵ دقیقه برای شما نگه داشته می‌شوند.\n\n" +
                "۴. اگر کد تخفیف دارید، آن را وارد کنید و سپس پرداخت را از طریق درگاه امن بانکی انجام دهید.\n\n" +
                "۵. بلیت الکترونیکی شما بلافاصله صادر می‌شود و در ورودی سالن با کد QR اسکن می‌شود."

        const val FAQ_TEXT =
            "چگونه بلیت خود را دریافت کنم؟\nپس از پرداخت موفق، بلیت الکترونیکی در حساب کاربری شما صادر می‌شود.\n\n" +
                "آیا امکان لغو و استرداد بلیت وجود دارد؟\nتا ۲۴ ساعت پیش از شروع سانس، امکان استرداد با کسر ۱۰٪ کارمزد وجود دارد.\n\n" +
                "رزرو گروهی برای مدارس چگونه است؟\nمدارس و سازمان‌ها می‌توانند از طریق تماس با پشتیبانی، درخواست رزرو گروهی و پیش‌فاکتور ثبت کنند."

        const val TERMS_TEXT =
            "استفاده از خدمات سامانه به معنای پذیرش این قوانین است.\n\n" +
                "بلیت صادرشده تنها برای سانس و صندلی درج‌شده معتبر است و قابل انتقال به سانس دیگر نیست.\n\n" +
                "مسئولیت برگزاری رویداد بر عهده برگزارکننده است؛ در صورت لغو رویداد، مبلغ بلیت به‌طور کامل بازگردانده می‌شود."

        const val PRIVACY_TEXT =
            "اطلاعات شخصی شما تنها برای صدور بلیت، اطلاع‌رسانی رویدادها و پشتیبانی استفاده می‌شود.\n\n" +
                "اطلاعات پرداخت مستقیماً در درگاه بانکی وارد می‌شود و در سامانه ذخیره نمی‌شود.\n\n" +
                "شما می‌توانید در هر زمان از خبرنامه انصراف دهید یا حذف حساب کاربری خود را درخواست کنید."
    }
}
