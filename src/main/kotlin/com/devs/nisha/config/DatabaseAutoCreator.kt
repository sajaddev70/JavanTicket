package com.devs.nisha.config

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.config.BeanPostProcessor
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component
import java.sql.DriverManager
import javax.sql.DataSource

/**
 * Local development convenience: creates the PostgreSQL database named in `spring.datasource.url`
 * if it does not exist yet, before Flyway / Hibernate open their first connection.
 * Never active with the `prod` profile; disable with `app.database.create-if-missing=false`.
 */
@Component
@Profile("!prod")
@ConditionalOnProperty(name = ["app.database.create-if-missing"], havingValue = "true", matchIfMissing = true)
class DatabaseAutoCreator(private val environment: Environment) : BeanPostProcessor {

    private val log = LoggerFactory.getLogger(javaClass)
    private var checked = false

    override fun postProcessBeforeInitialization(bean: Any, beanName: String): Any {
        if (bean is DataSource && !checked) {
            checked = true
            ensureDatabaseExists()
        }
        return bean
    }

    private fun ensureDatabaseExists() {
        val url = environment.getProperty("spring.datasource.url") ?: return
        val match = POSTGRES_URL.matchEntire(url) ?: return
        val (serverPart, database, query) = match.destructured
        if (!SAFE_NAME.matches(database)) {
            log.warn("[DatabaseAutoCreator] Skipping auto-create: unexpected database name [{}]", database)
            return
        }

        val username = environment.getProperty("spring.datasource.username")
        val password = environment.getProperty("spring.datasource.password")
        // Connect to the always-present maintenance database to check for / create the target one.
        val maintenanceUrl = "$serverPart/postgres$query"

        runCatching {
            DriverManager.getConnection(maintenanceUrl, username, password).use { connection ->
                val exists = connection.prepareStatement("SELECT 1 FROM pg_database WHERE datname = ?").use { stmt ->
                    stmt.setString(1, database)
                    stmt.executeQuery().use { it.next() }
                }
                if (!exists) {
                    connection.createStatement().use { it.execute("CREATE DATABASE \"$database\"") }
                    log.info("[DatabaseAutoCreator] Created missing database [{}]", database)
                }
            }
        }.onFailure {
            // Leave the original connection error to surface from the DataSource with its full context.
            log.warn("[DatabaseAutoCreator] Could not verify/create database [{}]: {}", database, it.message)
        }
    }

    private companion object {
        /** jdbc:postgresql://host:port/dbname?params -> (jdbc:postgresql://host:port, dbname, ?params) */
        val POSTGRES_URL = Regex("^(jdbc:postgresql://[^/]+)/([^?]+)(\\?.*)?$")
        val SAFE_NAME = Regex("^[A-Za-z0-9_]+$")
    }
}
