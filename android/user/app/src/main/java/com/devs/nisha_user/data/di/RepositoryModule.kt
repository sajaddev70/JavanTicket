package com.devs.nisha_user.data.di

import com.devs.nisha_user.data.repository.AuthRepositoryImpl
import com.devs.nisha_user.data.repository.ContentRepositoryImpl
import com.devs.nisha_user.data.repository.EventRepositoryImpl
import com.devs.nisha_user.data.repository.FavoritesRepositoryImpl
import com.devs.nisha_user.data.repository.OrderRepositoryImpl
import com.devs.nisha_user.data.repository.PaymentRepositoryImpl
import com.devs.nisha_user.data.repository.ProfileRepositoryImpl
import com.devs.nisha_user.data.repository.SeatRepositoryImpl
import com.devs.nisha_user.data.repository.SettingsRepositoryImpl
import com.devs.nisha_user.data.repository.TicketRepositoryImpl
import com.devs.nisha_user.domain.repository.AuthRepository
import com.devs.nisha_user.domain.repository.ContentRepository
import com.devs.nisha_user.domain.repository.EventRepository
import com.devs.nisha_user.domain.repository.FavoritesRepository
import com.devs.nisha_user.domain.repository.OrderRepository
import com.devs.nisha_user.domain.repository.PaymentRepository
import com.devs.nisha_user.domain.repository.ProfileRepository
import com.devs.nisha_user.domain.repository.SeatRepository
import com.devs.nisha_user.domain.repository.SettingsRepository
import com.devs.nisha_user.domain.repository.TicketRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/** Domain contracts → data implementations. */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds abstract fun content(impl: ContentRepositoryImpl): ContentRepository
    @Binds abstract fun events(impl: EventRepositoryImpl): EventRepository
    @Binds abstract fun seats(impl: SeatRepositoryImpl): SeatRepository
    @Binds abstract fun auth(impl: AuthRepositoryImpl): AuthRepository
    @Binds abstract fun orders(impl: OrderRepositoryImpl): OrderRepository
    @Binds abstract fun payments(impl: PaymentRepositoryImpl): PaymentRepository
    @Binds abstract fun tickets(impl: TicketRepositoryImpl): TicketRepository
    @Binds abstract fun profile(impl: ProfileRepositoryImpl): ProfileRepository
    @Binds abstract fun favorites(impl: FavoritesRepositoryImpl): FavoritesRepository
    @Binds abstract fun settings(impl: SettingsRepositoryImpl): SettingsRepository
}
