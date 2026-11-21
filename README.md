# جوان تیکت — سامانه فروش آنلاین بلیت

سامانه کامل فروش بلیت همایش، نمایشگاه، کنسرت و نمایش: سایت کاربر، پنل مدیریت و بک‌اند.

📘 **راهنمای کامل پروژه:** [docs/HANDBOOK.md](docs/HANDBOOK.md) — معرفی سامانه، راه‌اندازی، داده نمایشی، راهنمای بخش‌به‌بخش پنل مدیریت و سایت کاربر.

## شروع سریع

```bash
./gradlew clean bootJar
cp .env.example .env        # DB_PASSWORD، JWT_SECRET و کلید کاوه‌نگار را پر کنید
docker compose up -d --build
```

| بخش | آدرس Production | روی سرور (فقط 127.0.0.1) |
|---|---|---|
| سایت کاربر | `https://sakooticket.ir` | `127.0.0.1:3001` |
| پنل کاربران | `https://panel.sakooticket.ir` → `sakooticket.ir/profile` | — |
| پنل مدیریت | `https://adm.sakooticket.ir/admin` — مدیر ارشد `09101414285` | `127.0.0.1:3000` |
| API | `https://sakooticket.ir/api/v1` | `127.0.0.1:8080` |

راهنمای کامل استقرار Production (nginx، SSL، Backup، Rollback): [DEPLOYMENT.md](DEPLOYMENT.md)

Swagger (`/swagger-ui.html`) فقط در اجرای محلی (بدون پروفایل `prod`) فعال است.

بدون کلید پیامک، کد ورود `1111` است. در اولین اجرا روی پایگاه داده خالی، داده نمایشی کامل پر می‌شود (مشتری نمایشی: `09121234567`).

| بخش | فناوری |
|---|---|
| بک‌اند | Kotlin، Spring Boot 4، PostgreSQL، Flyway (`src/`) |
| سایت کاربر | Next.js 16 (`frontend/user`) |
| پنل مدیریت | Next.js 16 (`frontend/admin`) |
| اندروید | `android/user`، `android/admin` |
