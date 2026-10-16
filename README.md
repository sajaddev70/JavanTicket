# جوان تیکت — سامانه فروش آنلاین بلیت

سامانه کامل فروش بلیت همایش، نمایشگاه، کنسرت و نمایش: سایت کاربر، پنل مدیریت و بک‌اند.

📘 **راهنمای کامل پروژه:** [docs/HANDBOOK.md](docs/HANDBOOK.md) — معرفی سامانه، راه‌اندازی، داده نمایشی، راهنمای بخش‌به‌بخش پنل مدیریت و سایت کاربر.

## شروع سریع

```bash
./gradlew clean bootJar
cp .env.example .env        # JWT_SECRET، PUBLIC_API_URL و PUBLIC_USER_SITE_URL را پر کنید
docker compose up -d --build
```

| بخش | آدرس |
|---|---|
| سایت کاربر | `http://SERVER:3003` |
| پنل مدیریت | `http://SERVER:3002/admin` — مدیر ارشد `09101414285` |
| API | `http://SERVER:8081/api/v1` — مستندات: `/swagger-ui.html` |

بدون کلید پیامک، کد ورود `1111` است. در اولین اجرا روی پایگاه داده خالی، داده نمایشی کامل پر می‌شود (مشتری نمایشی: `09121234567`).

| بخش | فناوری |
|---|---|
| بک‌اند | Kotlin، Spring Boot 4، PostgreSQL، Flyway (`src/`) |
| سایت کاربر | Next.js 16 (`frontend/user`) |
| پنل مدیریت | Next.js 16 (`frontend/admin`) |
| اندروید | `android/user`، `android/admin` |
