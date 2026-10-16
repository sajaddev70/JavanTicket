package com.devs.nisha.service.dashboard

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.math.RoundingMode
import java.sql.Date
import java.sql.Timestamp

/**
 * Aggregates for the admin dashboard. Every number is computed from the operational tables
 * (orders, tickets, sessions, group_reservations, system_alerts); nothing is stubbed.
 * An optional [cityId] narrows every metric to halls located in that city.
 */
@Service
class AdminDashboardService(private val jdbcTemplate: JdbcTemplate) {

    fun getStats(cityId: Long?): Map<String, Any?> {
        val salesToday = paidSales(0, 1, cityId)
        val salesYesterday = paidSales(-1, 0, cityId)

        val ticketsToday = ticketsSold(0, 1, cityId)
        val ticketsYesterday = ticketsSold(-1, 0, cityId)

        val occupancyNow = occupancy("s.status = 'ACTIVE'", cityId)
        val occupancyLastWeek = occupancy(
            "s.status <> 'CANCELLED' AND s.start_time >= CURRENT_DATE - 14 AND s.start_time < CURRENT_DATE - 7", cityId,
        )
        val occupancyDelta =
            if (occupancyNow != null && occupancyLastWeek != null) round(occupancyNow - occupancyLastWeek) else null

        val schoolsThisMonth = schoolReservations("gr.created_at >= DATE_TRUNC('month', CURRENT_DATE)", cityId)
        val schoolsLastMonth = schoolReservations(
            "gr.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' " +
                "AND gr.created_at < DATE_TRUNC('month', CURRENT_DATE)",
            cityId,
        )

        return linkedMapOf(
            "todaySales" to metric(salesToday, salesYesterday, relativeChange(salesToday, salesYesterday)),
            "ticketsSold" to metric(ticketsToday, ticketsYesterday, relativeChange(ticketsToday, ticketsYesterday)),
            "hallOccupancy" to metric(occupancyNow, occupancyLastWeek, occupancyDelta),
            "schoolReservations" to metric(schoolsThisMonth, schoolsLastMonth, relativeChange(schoolsThisMonth, schoolsLastMonth)),
        )
    }

    fun getSalesChart(days: Int, cityId: Long?): List<Map<String, Any?>> {
        // Fetch window-1 extra days so the first returned point already has a full 7-day average.
        val span = days + MOVING_AVERAGE_WINDOW - 1
        val rows = jdbcTemplate.queryForList(
            "WITH paid AS (" +
                "  SELECT DATE(o.created_at) AS day, o.total_amount FROM orders o " +
                "  LEFT JOIN sessions s ON s.id = o.session_id LEFT JOIN halls h ON h.id = s.hall_id " +
                "  WHERE o.status = 'PAID' AND o.created_at >= CURRENT_DATE - CAST(? AS INT)" + CITY_FILTER +
                ") " +
                "SELECT CAST(d AS DATE) AS day, COALESCE(SUM(p.total_amount), 0) AS amount " +
                "FROM generate_series(CAST(CURRENT_DATE - CAST(? AS INT) AS TIMESTAMP), CAST(CURRENT_DATE AS TIMESTAMP), INTERVAL '1 day') d " +
                "LEFT JOIN paid p ON p.day = CAST(d AS DATE) GROUP BY d ORDER BY d",
            span - 1, cityId, cityId, span - 1,
        )
        val amounts = rows.map { it["amount"].asDouble() }

        return rows.indices
            .filter { it >= MOVING_AVERAGE_WINDOW - 1 }
            .map { i ->
                val window = amounts.subList(i - MOVING_AVERAGE_WINDOW + 1, i + 1)
                linkedMapOf(
                    "date" to (rows[i]["day"] as Date).toLocalDate().toString(),
                    "amount" to amounts[i],
                    "movingAverage" to round(window.sum() / MOVING_AVERAGE_WINDOW),
                )
            }
    }

    fun getCityStatus(): List<Map<String, Any?>> =
        jdbcTemplate.queryForList(
            "SELECT c.id, c.name, c.province, c.latitude, c.longitude, " +
                "  (SELECT COUNT(*) FROM events e WHERE e.city_id = c.id AND e.status = 'PUBLISHED') AS active_events, " +
                "  COALESCE(SUM(s.capacity), 0) AS capacity, COALESCE(SUM(s.reserved_seats), 0) AS reserved " +
                "FROM cities c " +
                "LEFT JOIN halls h ON h.city_id = c.id AND h.active = TRUE " +
                "LEFT JOIN sessions s ON s.hall_id = h.id AND s.status = 'ACTIVE' " +
                "WHERE c.active = TRUE GROUP BY c.id ORDER BY active_events DESC, c.id",
        ).map { row ->
            val capacity = row["capacity"].asDouble()
            val reserved = row["reserved"].asDouble()
            linkedMapOf(
                "id" to row["id"],
                "name" to row["name"],
                "province" to row["province"],
                "latitude" to row["latitude"],
                "longitude" to row["longitude"],
                "activeEvents" to row["active_events"].asDouble(),
                "capacity" to capacity,
                "reserved" to reserved,
                "occupancyPercent" to if (capacity > 0) round(reserved * 100 / capacity) else null,
            )
        }

    fun getTodaySessions(limit: Int, cityId: Long?): Map<String, Any> {
        val from =
            " FROM sessions s JOIN events e ON e.id = s.event_id JOIN halls h ON h.id = s.hall_id JOIN cities c ON c.id = h.city_id " +
                " WHERE s.start_time >= CURRENT_DATE AND s.start_time < CURRENT_DATE + 1 AND s.status <> 'CANCELLED'" + CITY_FILTER

        val items = jdbcTemplate.queryForList(
            "SELECT s.id, e.title AS event_title, c.name AS city_name, h.name AS hall_name, s.start_time, " +
                "  s.capacity, s.reserved_seats, " +
                "  CASE " +
                "    WHEN s.status = 'COMPLETED' OR LOCALTIMESTAMP > s.end_time THEN 'FINISHED' " +
                "    WHEN LOCALTIMESTAMP >= s.start_time THEN 'RUNNING' " +
                "    WHEN s.reserved_seats >= s.capacity THEN 'SOLD_OUT' " +
                "    WHEN s.reserved_seats >= s.capacity * 0.9 THEN 'ALMOST_FULL' " +
                "    WHEN s.reserved_seats >= s.capacity * 0.7 THEN 'LIMITED' " +
                "    ELSE 'ON_SALE' END AS sale_status" +
                from + " ORDER BY s.start_time LIMIT ?",
            cityId, cityId, limit,
        ).map { row ->
            linkedMapOf(
                "id" to row["id"],
                "eventTitle" to row["event_title"],
                "cityName" to row["city_name"],
                "hallName" to row["hall_name"],
                "startTime" to row["start_time"].toIso(),
                "capacity" to row["capacity"],
                "soldTickets" to row["reserved_seats"],
                "status" to row["sale_status"],
            )
        }
        val total = jdbcTemplate.queryForObject("SELECT COUNT(*)$from", Int::class.javaObjectType, cityId, cityId) ?: 0
        return mapOf("items" to items, "total" to total)
    }

    fun getAlerts(limit: Int): Map<String, Any> {
        val items = jdbcTemplate.queryForList(
            "SELECT id, title, message, alert_type, created_at FROM system_alerts WHERE active = TRUE ORDER BY created_at DESC, id DESC LIMIT ?",
            limit,
        ).map { row ->
            linkedMapOf(
                "id" to row["id"],
                "title" to row["title"],
                "message" to row["message"],
                "type" to row["alert_type"],
                "createdAt" to row["created_at"].toIso(),
            )
        }
        val total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM system_alerts WHERE active = TRUE", Int::class.javaObjectType) ?: 0
        return mapOf("items" to items, "total" to total)
    }

    private fun paidSales(fromDayOffset: Int, toDayOffset: Int, cityId: Long?): Double = queryDouble(
        "SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o " +
            "LEFT JOIN sessions s ON s.id = o.session_id LEFT JOIN halls h ON h.id = s.hall_id " +
            "WHERE o.status = 'PAID' AND o.created_at >= CURRENT_DATE + CAST(? AS INT) AND o.created_at < CURRENT_DATE + CAST(? AS INT)" +
            CITY_FILTER,
        fromDayOffset, toDayOffset, cityId, cityId,
    )

    private fun ticketsSold(fromDayOffset: Int, toDayOffset: Int, cityId: Long?): Double = queryDouble(
        "SELECT COUNT(*) FROM tickets t JOIN sessions s ON s.id = t.session_id JOIN halls h ON h.id = s.hall_id " +
            "WHERE t.status <> 'CANCELLED' AND t.created_at >= CURRENT_DATE + CAST(? AS INT) AND t.created_at < CURRENT_DATE + CAST(? AS INT)" +
            CITY_FILTER,
        fromDayOffset, toDayOffset, cityId, cityId,
    )

    private fun occupancy(sessionCondition: String, cityId: Long?): Double? {
        val row = jdbcTemplate.queryForMap(
            "SELECT COALESCE(SUM(s.capacity), 0) AS capacity, COALESCE(SUM(s.reserved_seats), 0) AS reserved " +
                "FROM sessions s JOIN halls h ON h.id = s.hall_id WHERE " + sessionCondition + CITY_FILTER,
            cityId, cityId,
        )
        val capacity = row["capacity"].asDouble()
        return if (capacity > 0) round(row["reserved"].asDouble() * 100 / capacity) else null
    }

    private fun schoolReservations(condition: String, cityId: Long?): Double = queryDouble(
        "SELECT COUNT(*) FROM group_reservations gr JOIN organizations org ON org.id = gr.organization_id " +
            "WHERE org.org_type = 'SCHOOL' AND gr.status <> 'CANCELLED' AND " + condition +
            " AND (CAST(? AS BIGINT) IS NULL OR org.city_id = CAST(? AS BIGINT))",
        cityId, cityId,
    )

    private fun queryDouble(sql: String, vararg args: Any?): Double =
        jdbcTemplate.queryForObject(sql, Number::class.java, *args)?.toDouble() ?: 0.0

    private companion object {
        const val CITY_FILTER = " AND (CAST(? AS BIGINT) IS NULL OR h.city_id = CAST(? AS BIGINT)) "
        const val MOVING_AVERAGE_WINDOW = 7

        fun metric(value: Double?, previous: Double?, changePercent: Double?): Map<String, Double?> =
            linkedMapOf("value" to value, "previous" to previous, "changePercent" to changePercent)

        /** Percentage change, or null when there is no baseline to compare against. */
        fun relativeChange(current: Double, previous: Double): Double? =
            if (previous > 0) round((current - previous) * 100 / previous) else null

        fun round(value: Double): Double = BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).toDouble()

        fun Any?.asDouble(): Double = (this as? Number)?.toDouble() ?: 0.0

        fun Any?.toIso(): String? = (this as? Timestamp)?.toInstant()?.toString()
    }
}
