package com.devs.nisha_user.core.common

/**
 * State of data a screen loads: loading (optionally keeping the previous value while refreshing), loaded, or failed
 * (optionally keeping the previous value, so a failed refresh does not blank the screen).
 */
sealed interface Async<out T> {
    val valueOrNull: T?

    data class Loading<T>(val previous: T? = null) : Async<T> {
        override val valueOrNull: T? get() = previous
    }

    data class Success<T>(val value: T) : Async<T> {
        override val valueOrNull: T get() = value
    }

    data class Failure<T>(val error: AppError, val previous: T? = null) : Async<T> {
        override val valueOrNull: T? get() = previous
    }

    companion object {
        fun <T> of(result: Result<T>, previous: T? = null): Async<T> =
            result.fold(onSuccess = { Success(it) }, onFailure = { Failure(it.appError, previous) })
    }
}

val Async<*>.isLoading: Boolean get() = this is Async.Loading
