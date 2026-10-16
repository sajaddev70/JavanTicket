package com.devs.nisha.support

import java.math.BigDecimal
import java.math.RoundingMode

/** WHERE clauses collected from optional request filters; values are always bound as named parameters. */
class SqlFilters {
    private val clauses = mutableListOf<String>()
    val params = linkedMapOf<String, Any?>()

    fun add(clause: String, vararg values: Pair<String, Any?>): SqlFilters {
        clauses += clause
        params.putAll(values)
        return this
    }

    /** Adds the clause only when [value] is present (non-null, non-blank). */
    fun whenPresent(value: Any?, clause: String, name: String, transform: (Any) -> Any? = { it }): SqlFilters {
        if (value == null || (value is String && value.isBlank())) return this
        return add(clause, name to transform(value))
    }

    val sql: String get() = if (clauses.isEmpty()) "" else " WHERE " + clauses.joinToString(" AND ")
}

/** Value of a stat card with its change against the previous period (null when there is nothing to compare). */
fun metric(value: Double, previous: Double): Map<String, Double?> = linkedMapOf(
    "value" to value,
    "previous" to previous,
    "changePercent" to if (previous > 0) BigDecimal.valueOf((value - previous) * 100 / previous).setScale(1, RoundingMode.HALF_UP).toDouble() else null,
)

/** `%text%` for ILIKE searches, with the LIKE wildcards in the user's text escaped. */
fun likePattern(text: String): String = "%" + text.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
