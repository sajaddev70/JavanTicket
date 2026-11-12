# JavanTicket User Redesign — FINAL FULL SCREENS PACK

این نسخه دقیقاً برای تحویل به Claude/Developer آماده شده است.

## نکته بسیار مهم
- هیچ کدام از تصاویر داخل `screens/` Crop یا برش از کلاژ نیستند.
- هر فایل یک Screen کامل و مستقل از Redesign است.
- داخل این پکیج هیچ Event Image کراپ‌شده از Screenshot قرار نداده‌ام.
- اسکرین‌ها فقط مرجع طراحی هستند و نباید به عنوان Background UI استفاده شوند.

## ساختار

### screens/
ده صفحه کامل و شماره‌گذاری‌شده Redesign سمت User.

### assets/brand/
لوگوهای مستقل SVG برند.

### assets/icons/
آیکون‌ها به صورت مستقل و گروه‌بندی‌شده:
- navigation
- common
- categories
- payment
- seat
- status

### assets/illustrations/
Illustrationهای مستقل Vector مثل OTP و Payment Success.

### assets/pwa/
آیکون‌های موردنیاز PWA.

### assets/android/
دارایی‌های App Icon سمت Android.

### docs/
Design Tokenها و Prompt پیاده‌سازی برای Claude.

## صفحات
- `01_home.png` — صفحه اصلی / Home
- `02_events.png` — لیست رویدادها / Events
- `03_event_detail.png` — جزئیات رویداد / Event Detail
- `04_seat_selection.png` — انتخاب صندلی / Seat Selection
- `05_login.png` — ورود / Login
- `06_otp.png` — تأیید کد / OTP
- `07_checkout.png` — اطلاعات خریدار و Checkout
- `08_payment.png` — پرداخت / Payment
- `09_payment_success.png` — نتیجه پرداخت موفق
- `10_ticket.png` — بلیت الکترونیک / Ticket

## قانون پیاده‌سازی
Data رویداد، قیمت، شهر، سانس، Seat، Checkout، Payment و Ticket باید از API واقعی Backend بیاید.
هیچ Sample Data داخل Screenها نباید در Production Hardcode شود.
