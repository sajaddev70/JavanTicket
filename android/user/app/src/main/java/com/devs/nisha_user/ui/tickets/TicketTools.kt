package com.devs.nisha_user.ui.tickets

import com.devs.nisha_user.core.format.ltr
import android.graphics.Typeface
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.pdf.PdfDocument
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
import android.provider.CalendarContract
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.core.content.res.ResourcesCompat
import com.devs.nisha_user.R
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.groupCode
import com.devs.nisha_user.domain.model.TicketDetail
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import java.io.FileOutputStream

/** QR modules of [payload]: error correction M and a one-module quiet zone, like the site's QRCodeSVG. */
fun qrMatrix(payload: String): BitMatrix =
    QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, 0, 0, mapOf(EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M, EncodeHintType.MARGIN to 1))

/** The ticket's QR code (dark modules on white, also in dark mode, so every scanner reads it). */
@Composable
fun QrCode(payload: String, modifier: Modifier = Modifier, foreground: Color = Color(0xFF0F1B33)) {
    val matrix = remember(payload) { qrMatrix(payload) }
    Canvas(modifier.semantics { contentDescription = "کد QR بلیت" }) {
        drawRect(Color.White)
        val cell = size.width / matrix.width
        for (y in 0 until matrix.height) for (x in 0 until matrix.width) {
            if (matrix[x, y]) drawRect(foreground, Offset(x * cell, y * cell), Size(cell + 0.5f, cell + 0.5f))
        }
    }
}

fun qrBitmap(payload: String, sizePx: Int): Bitmap {
    val m = qrMatrix(payload)
    val bmp = Bitmap.createBitmap(m.width, m.height, Bitmap.Config.ARGB_8888)
    for (y in 0 until m.height) for (x in 0 until m.width) bmp.setPixel(x, y, if (m[x, y]) 0xFF0F1B33.toInt() else 0xFFFFFFFF.toInt())
    return Bitmap.createScaledBitmap(bmp, sizePx, sizePx, false)
}

/** Adds the ticket's session to the phone's calendar app (the web downloads an .ics file instead). */
fun addToCalendar(context: Context, t: TicketDetail): Boolean {
    val location = listOfNotNull(t.hallName, t.venueName, t.hallAddress ?: t.cityName).joinToString("، ")
    val intent = Intent(Intent.ACTION_INSERT, CalendarContract.Events.CONTENT_URI)
        .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, Fa.instant(t.startTime).toEpochMilli())
        .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, Fa.instant(t.endTime).toEpochMilli())
        .putExtra(CalendarContract.Events.TITLE, t.eventTitle)
        .putExtra(CalendarContract.Events.EVENT_LOCATION, location)
        .putExtra(CalendarContract.Events.DESCRIPTION, "بلیت ${t.ticketCode}${t.seatLabel?.let { " - $it" } ?: ""}")
    return try {
        context.startActivity(intent)
        true
    } catch (e: ActivityNotFoundException) {
        false
    }
}

/** Print dialog with the e-ticket as a one-page A5 document; "Save as PDF" there gives the PDF the web offers. */
fun printTicket(context: Context, t: TicketDetail) {
    val manager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
    val attributes = PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A5).setMinMargins(PrintAttributes.Margins.NO_MARGINS).build()
    manager.print("ticket-${t.ticketCode}", TicketPrintAdapter(context, t), attributes)
}

private class TicketPrintAdapter(private val context: Context, private val t: TicketDetail) : PrintDocumentAdapter() {
    override fun onLayout(old: PrintAttributes?, new: PrintAttributes, cancel: CancellationSignal, callback: LayoutResultCallback, extras: Bundle?) {
        if (cancel.isCanceled) return callback.onLayoutCancelled()
        callback.onLayoutFinished(PrintDocumentInfo.Builder("ticket-${t.ticketCode}.pdf").setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(1).build(), true)
    }

    override fun onWrite(pages: Array<out PageRange>, destination: ParcelFileDescriptor, cancel: CancellationSignal, callback: WriteResultCallback) {
        val pdf = PdfDocument()
        // A5 in PostScript points.
        val page = pdf.startPage(PdfDocument.PageInfo.Builder(420, 595, 1).create())
        drawTicket(page.canvas, 420f, 595f)
        pdf.finishPage(page)
        try {
            FileOutputStream(destination.fileDescriptor).use { pdf.writeTo(it) }
            callback.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
        } catch (e: Exception) {
            callback.onWriteFailed(e.message)
        } finally {
            pdf.close()
        }
    }

    private fun drawTicket(canvas: Canvas, w: Float, h: Float) {
        val regular = ResourcesCompat.getFont(context, R.font.iransans_regular)
        val bold = ResourcesCompat.getFont(context, R.font.iransans_bold)
        val navy = 0xFF0F1B33.toInt()
        val muted = 0xFF6B7890.toInt()
        val brand = 0xFF1463E6.toInt()
        val margin = 28f
        canvas.drawColor(0xFFFFFFFF.toInt())
        val frame = RectF(margin - 8, margin - 8, w - margin + 8, h - margin + 8)
        canvas.drawRoundRect(frame, 16f, 16f, Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; color = 0xFFD8E0EB.toInt(); strokeWidth = 1.5f })

        var y = margin + 4
        fun block(text: String, size: Float, color: Int, isBold: Boolean = false, center: Boolean = false, gap: Float = 5f, mono: Boolean = false) {
            val face = if (mono) Typeface.create(Typeface.MONOSPACE, if (isBold) Typeface.BOLD else Typeface.NORMAL) else if (isBold) bold else regular
            val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = size; this.color = color; typeface = face }
            // Persian text is laid out right to left; ALIGN_NORMAL follows the paragraph direction.
            val layout = StaticLayout.Builder.obtain(text, 0, text.length, paint, (w - margin * 2).toInt())
                .setAlignment(if (center) Layout.Alignment.ALIGN_CENTER else Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0f, 1.15f)
                .build()
            canvas.save()
            canvas.translate(margin, y)
            layout.draw(canvas)
            canvas.restore()
            y += layout.height + gap
        }

        block("بلیت الکترونیک", 11f, muted)
        block(t.eventTitle, 19f, navy, isBold = true)
        (t.sessionTitle ?: t.eventSubtitle)?.let { block(it, 11f, muted) }
        y += 4
        block("${Fa.fullDate(t.startTime)}  •  ساعت ${Fa.time(t.startTime)} الی ${Fa.time(t.endTime)}", 12f, navy, isBold = true)
        block(listOfNotNull(t.cityName, t.venueName, t.hallName, t.hallAddress).joinToString("، "), 11f, navy)
        val seat = if (t.seatNumber != null) "ردیف ${t.rowLabel} - صندلی ${Fa.number(t.seatNumber)}${t.tierName?.let { " ($it)" } ?: ""}" else t.seatLabel ?: "ورود عمومی"
        t.sectionName?.let { block("بخش $it", 11f, brand, isBold = true) }
        block(seat, 13f, brand, isBold = true, gap = 10f)

        val qrSize = 160
        canvas.drawBitmap(qrBitmap(t.qrCode, qrSize), (w - qrSize) / 2, y, null)
        y += qrSize + 8
        block(groupCode(t.qrCode), 13f, navy, isBold = true, center = true, mono = true)
        block("این کد را در زمان ورود به اسکنر مجموعه نشان دهید.", 10f, muted, center = true, gap = 10f)
        t.buyerName?.let { block("نام خریدار: $it", 11f, navy) }
        block("شماره سفارش: ${ltr(t.orderNumber)}   |   شماره بلیت: ${ltr(t.ticketCode)}", 10f, muted)
        block("تاریخ خرید: ${Fa.dateTime(t.paidAt ?: t.orderedAt)}", 10f, muted)
    }
}
