# راه‌اندازی دامنه sakooticket.ir روی سرور

| آدرس | چه چیزی نشان می‌دهد |
|---|---|
| `https://sakooticket.ir` | سایت کاربر و API (`/api`، `/uploads`، `/media`) |
| `https://www.sakooticket.ir` | انتقال به `sakooticket.ir` |
| `https://panel.sakooticket.ir` | انتقال به حساب کاربری در `sakooticket.ir/profile` |
| `https://adm.sakooticket.ir` | پنل مدیریت (`/admin`) |

## پیش از شروع

- رکوردهای A هر چهار آدرس بالا باید به IP سرور اشاره کنند.
- پورت‌های ۸۰ و ۴۴۳ سرور باید از اینترنت باز باشند و برنامه دیگری روی آن‌ها نباشد.
- برای صدور گواهی، حالت CDN ابرآروان را خاموش نگه دارید. اگر بعداً آن را روشن کردید، تنظیم IP واقعی بازدیدکننده در `nginx/sakooticket.conf` را هم انجام دهید.

## ۱) تنظیم `.env`

اگر روی سرور `.env` دارید، آن را جایگزین نکنید (`JWT_SECRET` و کلید پیامک داخل آن است) و فقط این سه خط را تغییر دهید. اگر ندارید، با `cp .env.example .env` بسازید و `JWT_SECRET` را هم با خروجی `openssl rand -hex 32` پر کنید.

```dotenv
PUBLIC_API_URL=https://sakooticket.ir/api/v1
PUBLIC_USER_SITE_URL=https://sakooticket.ir
BIND_ADDRESS=127.0.0.1
```

> **پیش از باز کردن سایت برای عموم:** تا وقتی `KAVENEGAR_API_KEY` خالی باشد، کد ورود برای همه شماره‌ها `1111` است و هر کسی می‌تواند با شماره مدیر ارشد وارد پنل شود. کلید کاوه‌نگار را حتماً تنظیم کنید. برای راه‌اندازی واقعی، `DEMO_SEED_ENABLED=false` را هم بگذارید.

> با `BIND_ADDRESS=127.0.0.1` پورت‌های `3002`، `3003` و `8081` دیگر از بیرون باز نیستند. نسخه‌های قبلی اپلیکیشن اندروید که به `IP:8081` وصل می‌شوند از کار می‌افتند و باید نسخه جدید نصب شود.

## ۲) بالا آوردن سرویس‌ها

```bash
./gradlew clean bootJar
docker compose up -d --build
docker compose ps
```

چون آدرس‌ها هنگام ساخت داخل فرانت‌ها قرار می‌گیرند، `--build` لازم است.

## ۳) nginx و SSL

```bash
sudo bash deploy/setup-nginx.sh you@example.com
```

این اسکریپت nginx و certbot را نصب می‌کند، یک گواهی Let's Encrypt برای هر چهار آدرس می‌گیرد، کانفیگ را فعال می‌کند و تمدید خودکار را آزمایش می‌کند. اجرای دوباره آن مشکلی ندارد.

## ۴) بررسی

```bash
curl -I https://sakooticket.ir
curl -I https://sakooticket.ir/api/v1/public/site-settings
curl -I https://adm.sakooticket.ir/admin/login
curl -I https://panel.sakooticket.ir        # 302 به sakooticket.ir/profile
curl -I http://sakooticket.ir               # 301 به https
```

## عیب‌یابی

| مشکل | علت و راه‌حل |
|---|---|
| خطای `502 Bad Gateway` | سرویس‌ها بالا نیستند: `docker compose ps` و `docker compose logs -f backend` |
| خطای certbot هنگام گرفتن گواهی | DNS یا پورت ۸۰ را بررسی کنید و ببینید حالت CDN خاموش باشد |
| پنل یا سایت هنوز به آدرس قبلی وصل می‌شود | `.env` را اصلاح کنید و `docker compose up -d --build` بزنید |
| خطای `Address already in use` در nginx | برنامه دیگری روی پورت ۸۰ یا ۴۴۳ است: `ss -ltnp \| grep -E ':(80\|443) '` |
| اپ روی اندروید ۷٫۰ به سرور وصل نمی‌شود | این نسخه ریشه Let's Encrypt را نمی‌شناسد؛ از اندروید ۷٫۱٫۱ به بعد مشکلی نیست |
