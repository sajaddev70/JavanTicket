package com.devs.nisha.support

import java.security.SecureRandom

/** Random codes that must not be guessable from other data (ticket QR payloads, payment references). */
object SecureCodes {
    private val random = SecureRandom()

    /** No 0/O or 1/I, so a code read off a printed ticket can be typed back without mistakes. */
    private const val ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    /** 16 characters from a 32-letter alphabet: 80 random bits. */
    fun ticketQr(): String = text(16)

    fun text(length: Int): String = buildString(length) { repeat(length) { append(ALPHABET[random.nextInt(ALPHABET.length)]) } }

    fun digits(length: Int): String = buildString(length) {
        append(1 + random.nextInt(9))
        repeat(length - 1) { append(random.nextInt(10)) }
    }

    fun hex(bytes: Int): String = ByteArray(bytes).also(random::nextBytes).joinToString("") { "%02x".format(it) }
}
