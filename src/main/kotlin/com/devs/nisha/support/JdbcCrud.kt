package com.devs.nisha.support

import com.devs.nisha.exception.BusinessException
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import java.sql.Timestamp
import java.time.Instant

/**
 * Small helper for the admin CRUD endpoints. Table and column names always come from code
 * (never from the request), values are bound as named parameters.
 */
@Component
class JdbcCrud(val jdbc: NamedParameterJdbcTemplate) {

    fun list(sql: String, params: Map<String, Any?> = emptyMap()): List<Map<String, Any?>> =
        jdbc.queryForList(sql, params).withIsoDates()

    fun insert(table: String, values: Map<String, Any?>): Long {
        val columns = values.keys
        val sql = "INSERT INTO $table (${columns.joinToString()}) VALUES (${columns.joinToString { ":$it" }}) RETURNING id"
        return jdbc.queryForObject(sql, values.toSqlParams(), Long::class.java)!!
    }

    fun update(table: String, id: Long, values: Map<String, Any?>) {
        val sql = "UPDATE $table SET ${values.keys.joinToString { "$it = :$it" }} WHERE id = :id"
        if (jdbc.update(sql, values.toSqlParams() + ("id" to id)) == 0) throw notFound()
    }

    fun delete(table: String, id: Long) {
        if (jdbc.update("DELETE FROM $table WHERE id = :id", mapOf("id" to id)) == 0) throw notFound()
    }

    fun exists(sql: String, params: Map<String, Any?>): Boolean =
        jdbc.queryForObject("SELECT EXISTS($sql)", params, Boolean::class.java) == true

    private fun Map<String, Any?>.toSqlParams(): Map<String, Any?> =
        mapValues { (_, v) -> if (v is Instant) Timestamp.from(v) else v }

    companion object {
        fun notFound() = BusinessException("مورد درخواستی پیدا نشد.", HttpStatus.NOT_FOUND)

        /** JDBC timestamps are rendered as ISO-8601 instants, which every client parses the same way. */
        fun List<Map<String, Any?>>.withIsoDates(): List<Map<String, Any?>> = map { it.withIsoDates() }

        fun Map<String, Any?>.withIsoDates(): Map<String, Any?> =
            mapValues { (_, v) -> (v as? Timestamp)?.toInstant()?.toString() ?: v }
    }
}
