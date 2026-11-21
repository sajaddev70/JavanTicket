package com.devs.nisha_user.core.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.devs.nisha_user.R

object NotificationHelper {

    const val CHANNEL_ID = "general_notifications"
    private const val CHANNEL_NAME = "اعلان‌های عمومی"
    private const val CHANNEL_DESC = "اعلان‌های مربوط به تغییر وضعیت سفارش‌ها و رویدادهای جوان تیکت"
    const val TEST_NOTIFICATION_ID = 1001

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESC
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun sendTestNotification(context: Context): Boolean {
        createNotificationChannel(context)

        val managerCompat = NotificationManagerCompat.from(context)
        if (!managerCompat.areNotificationsEnabled()) {
            return false
        }

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("اعلان‌ها فعال شدند")
            .setContentText("تنظیمات اعلان برنامه با موفقیت انجام شد.")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)

        return try {
            managerCompat.notify(TEST_NOTIFICATION_ID, builder.build())
            true
        } catch (e: SecurityException) {
            false
        }
    }
}
