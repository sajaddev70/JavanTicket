package com.devs.nisha.service.event

/** SQL fragments for event cards, shared by the public listings and the signed-in user's favorites. */
object EventQueries {
    const val NEXT_SESSION_JOIN =
        "LEFT JOIN LATERAL (SELECT MIN(s.start_time) AS next_session_at FROM sessions s " +
            "WHERE s.event_id = e.id AND s.status = 'ACTIVE' AND s.start_time >= LOCALTIMESTAMP) ns ON TRUE "

    const val EVENT_COLUMNS =
        "SELECT e.id, e.title, e.slug, e.subtitle, e.description, e.notice, e.banner_url, e.organizer_name, e.website_url, e.min_price, " +
            "e.featured, e.popular, e.status, e.start_date, e.end_date, c.name AS category_name, c.slug AS category_slug, " +
            "c.color AS category_color, c.icon_url AS category_icon_url, c.cover_url AS category_cover_url, ci.id AS city_id, " +
            "ci.name AS city_name, h.name AS hall_name, h.venue_name, h.address AS hall_address, ns.next_session_at"

    const val EVENT_FROM =
        " FROM events e " +
            "LEFT JOIN categories c ON e.category_id = c.id " +
            "LEFT JOIN cities ci ON e.city_id = ci.id " +
            "LEFT JOIN halls h ON e.hall_id = h.id " +
            NEXT_SESSION_JOIN

    const val LAST_SESSION_JOIN =
        "LEFT JOIN LATERAL (SELECT MAX(s.end_time) AS last_end FROM sessions s WHERE s.event_id = e.id AND s.status <> 'CANCELLED') ls ON TRUE "

    const val EVENT_SELECT = EVENT_COLUMNS + EVENT_FROM
}
