package com.devs.nisha_user

import com.devs.nisha_user.core.notification.NotificationHelper
import org.junit.Assert.assertEquals
import org.junit.Test

class NotificationHelperTest {

    @Test
    fun testNotificationConstants() {
        assertEquals("general_notifications", NotificationHelper.CHANNEL_ID)
        assertEquals(1001, NotificationHelper.TEST_NOTIFICATION_ID)
    }
}
