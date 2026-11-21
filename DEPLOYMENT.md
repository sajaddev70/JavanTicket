# راهنمای استقرار Production — SakooTicket

راهنمای کامل انتقال و راه‌اندازی روی سرور `87.107.164.153`. همه دستورها کامل‌اند و به همین شکل قابل اجرا هستند.
بخش‌هایی که با «💻 سیستم توسعه» مشخص شده‌اند روی سیستم خودتان و بقیه با «🖥 سرور» روی سرور (کاربر root) اجرا می‌شوند.

## فهرست

0. [معماری](#0-معماری)
1. [پیش‌نیازهای خارج از سرور (DNS، رمز root)](#1-پیشنیازهای-خارج-از-سرور)
2. [ساخت بسته انتشار](#2--سیستم-توسعه-ساخت-بسته-انتشار)
3. [انتقال به سرور](#3--سیستم-توسعه-انتقال-به-سرور)
4. [ثبت وضعیت فعلی سرور](#4--سرور-ثبت-وضعیت-فعلی)
5. [نصب Docker](#5--سرور-نصب-docker)
6. [باز کردن بسته و تنظیم `.env`](#6--سرور-باز-کردن-بسته-و-تنظیم-env)
7. [(اختیاری) انتقال داده از سرور قدیمی](#7--اختیاری-انتقال-داده-از-سرور-قدیمی)
8. [بالا آوردن سرویس‌ها](#8--سرور-بالا-آوردن-سرویسها)
9. [nginx و SSL](#9--سرور-nginx-و-ssl)
10. [تست نهایی](#10-تست-نهایی)
11. [امنیت سرور: فایروال و SSH](#11--سرور-امنیت-فایروال-و-ssh)
12. [Backup و بازگردانی](#12-backup-و-بازگردانی)
13. [نگهداری: لاگ، ری‌استارت، به‌روزرسانی، Rollback](#13-نگهداری)
14. [فعال کردن CDN ابرآروان (بعداً)](#14-فعال-کردن-cdn-ابرآروان-بعداً)
15. [عیب‌یابی](#15-عیبیابی)

---

## 0. معماری

```
                     اینترنت  (فقط 80 و 443)
                          │
                 nginx روی میزبان  (/etc/nginx)
   ┌──────────────┬───────┴────────┬─────────────────────┐
sakooticket.ir   www.*          panel.*              adm.sakooticket.ir
   │             301 → apex     302 → apex/profile        │
   ├─ /api/  /uploads/  /media/ ─► 127.0.0.1:8080  sakooticket-backend (Spring Boot)
   └─ /                          ─► 127.0.0.1:3001  sakooticket-user    (Next.js سایت + حساب کاربری)
                                    127.0.0.1:3000  sakooticket-admin   (Next.js پنل مدیریت /admin) ◄─┘
                                    sakooticket-db  (PostgreSQL 17، بدون پورت؛ فقط شبکه sakooticket-internal)
```

| دامنه | چه چیزی سرو می‌کند |
|---|---|
| `https://sakooticket.ir` | وب‌سایت اصلی + API (`/api/v1`)، فایل‌های آپلودی (`/uploads`) و تصاویر داخلی (`/media`) |
| `https://www.sakooticket.ir` | انتقال دائمی (301) به `sakooticket.ir` |
| `https://panel.sakooticket.ir` | **پنل کاربران**: انتقال (302) به صفحات حساب کاربری `sakooticket.ir/profile` |
| `https://adm.sakooticket.ir` | **پنل مدیریت** (`/admin`) |

**چرا پنل کاربران Redirect است و اپ جدا نیست:** پنل کاربران (ورود، پروفایل، بلیت‌ها، سفارش‌ها) بخشی از سایت کاربر است (`frontend/user`). نشست ورود در حافظه مرورگرِ هر Origin جداگانه ذخیره می‌شود و درگاه پرداخت خریدار را به `PUBLIC_USER_SITE_URL` برمی‌گرداند. اگر پنل روی Origin جدا اجرا شود، کاربر دو بار باید وارد شود و بعد از پرداخت خارج‌شده دیده می‌شود. پنل مدیریت اپ کاملاً جداگانه است.

| Container | پورت داخلی | پورت روی میزبان | Healthcheck |
|---|---|---|---|
| `sakooticket-db` | 5432 | ندارد | `pg_isready` |
| `sakooticket-backend` | 8080 | `127.0.0.1:8080` | باز شدن پورت 8080 (بعد از Flyway) |
| `sakooticket-admin` | 3000 | `127.0.0.1:3000` | `GET /admin/login` |
| `sakooticket-user` | 3001 | `127.0.0.1:3001` | `GET /` |

| مسیر روی سرور | محتوا |
|---|---|
| `/opt/sakooticket` | پروژه (`docker-compose.yml`، `.env`، `deploy/`) |
| `/opt/sakooticket/.env` | Secretها (مجوز 600) |
| `/etc/nginx/sites-available/00-sakooticket-common.conf` | upstreamها، کش استاتیک، تنظیم اختیاری CDN |
| `/etc/nginx/sites-available/sakooticket.ir.conf` | سایت اصلی + API |
| `/etc/nginx/sites-available/www.sakooticket.ir.conf` | www → apex |
| `/etc/nginx/sites-available/panel.sakooticket.ir.conf` | پنل کاربران |
| `/etc/nginx/sites-available/adm.sakooticket.ir.conf` | پنل مدیریت |
| `/etc/nginx/snippets/sakooticket-{ssl,proxy,security-headers}.conf` | تنظیمات مشترک |
| `/etc/letsencrypt/live/sakooticket.ir/` | گواهی SAN هر چهار دامنه |
| `/root/sakooticket-backups/` | Backupها |
| Volume `sakooticket_db-data` | داده PostgreSQL |
| Volume `sakooticket_uploads` | تصاویر آپلودشده |

---

## 1. پیش‌نیازهای خارج از سرور

### 1.1 رمز root را عوض کنید (فوری)

رمز root این سرور در فایل `file/server.txt` داخل Git commit شده است. **قبل از هر کار دیگری** آن را عوض کنید (بعد از ورود به سرور):

```bash
passwd root
```

و فایل را از مخزن خارج کنید (روی سیستم توسعه؛ commit را خودتان انجام دهید):

```bash
git rm --cached file/server.txt
echo "file/server.txt" >> .gitignore
```

> رمز قبلی در تاریخچه Git و احتمالاً GitHub باقی می‌ماند؛ پس تعویض رمز الزامی است، نه اختیاری.

### 1.2 DNS در پنل ابرآروان

در بخش DNS دامنه `sakooticket.ir` چهار رکورد زیر را تنظیم کنید. اگر برای این نام‌ها رکورد CNAME یا A دیگری هست، اول آن را حذف یا ویرایش کنید.

| نام | نوع | مقدار | پروکسی ابرآروان (ابر نارنجی) |
|---|---|---|---|
| `@` | A | `87.107.164.153` | **خاموش** |
| `www` | A | `87.107.164.153` | **خاموش** |
| `panel` | A | `87.107.164.153` | **خاموش** |
| `adm` | A | `87.107.164.153` | **خاموش** |

TTL را ۱۲۰ ثانیه بگذارید. در زمان نوشتن این راهنما هر چهار رکورد هنوز به سرور قدیمی `45.156.186.169` اشاره می‌کنند.

بررسی از سیستم خودتان (هر چهار خط باید `87.107.164.153` باشند):

```bash
for h in sakooticket.ir www.sakooticket.ir panel.sakooticket.ir adm.sakooticket.ir; do echo "$h -> $(dig +short A $h @8.8.8.8)"; done
```

> تا وقتی DNS درست نشده، مراحل ۲ تا ۸ را می‌توانید انجام دهید، ولی مرحله ۹ (گرفتن گواهی) منتظر DNS می‌ماند.

### 1.3 دسترسی SSH

پورت `9011` باید از سیستمی که دستورها را از آن اجرا می‌کنید باز باشد:

```bash
ssh -p 9011 root@87.107.164.153 'hostname; uptime'
```

اگر `Operation timed out` گرفتید، فایروال دیتاسنتر (پنل پارس‌شبکه) فقط IPهای خاصی را راه می‌دهد؛ IP خود را آنجا مجاز کنید.

---

## 2. 💻 سیستم توسعه: ساخت بسته انتشار

نیازمند JDK 17 یا جدیدتر (Gradle خودش toolchain 17 را تهیه می‌کند). از ریشه پروژه:

```bash
cd /Volumes/developer/developer/IdeaProjects/JavanTicket
bash deploy/package-release.sh
```

خروجی: `dist/sakooticket-release.tar.gz` و `dist/sakooticket-release.tar.gz.sha256`.
بسته شامل `docker-compose.yml`، `Dockerfile`، `.env.example`، jar بک‌اند، `deploy/`، سورس دو فرانت‌اند و همین راهنماست. `node_modules`، `.next`، اندروید، فایل‌های طراحی، `file/` و هر فایل شبیه Secret عمداً حذف می‌شوند؛ اسکریپت اگر فایل مشکوکی ببیند متوقف می‌شود.

> فرانت‌اندها روی خود سرور داخل Docker build می‌شوند، چون آدرس API هنگام build در آن‌ها قرار می‌گیرد. jar بک‌اند روی سیستم توسعه ساخته می‌شود چون Maven Central از سرورهای ایران قابل اعتماد نیست.

---

## 3. 💻 سیستم توسعه: انتقال به سرور

```bash
cd /Volumes/developer/developer/IdeaProjects/JavanTicket
scp -P 9011 dist/sakooticket-release.tar.gz dist/sakooticket-release.tar.gz.sha256 root@87.107.164.153:/root/
ssh -p 9011 root@87.107.164.153
```

بقیه مراحل داخل همین نشست SSH است.

---

## 4. 🖥 سرور: ثبت وضعیت فعلی

قبل از هر تغییر، وضعیت سرور را در یک فایل ذخیره کنید (فقط خواندنی است و چیزی را تغییر نمی‌دهد):

```bash
mkdir -p /root/sakooticket-backups && chmod 700 /root/sakooticket-backups
{
  echo "### date";        date -Is
  echo "### os";          cat /etc/os-release
  echo "### kernel";      uname -a
  echo "### cpu/ram";     nproc; free -h
  echo "### disk";        df -h
  echo "### listening";   ss -ltnp
  echo "### services";    systemctl list-units --type=service --state=running --no-pager
  echo "### docker";      (docker ps -a && docker volume ls && docker network ls) 2>&1
  echo "### nginx";       (nginx -v && ls -l /etc/nginx/sites-enabled /etc/nginx/conf.d) 2>&1
  echo "### certs";       ls -l /etc/letsencrypt/live 2>&1
  echo "### firewall";    (ufw status verbose; iptables -S | head -50) 2>&1
} > /root/sakooticket-backups/preflight-$(date +%Y%m%d-%H%M%S).txt 2>&1
ls -l /root/sakooticket-backups/
```

فایل را بخوانید. **اگر سرویس دیگری روی پورت 80، 443، 3000، 3001 یا 8080 هست، ادامه ندهید** و اول مالک آن را مشخص کنید. این راهنما هیچ سرویس دیگری را متوقف نمی‌کند.

```bash
ss -ltnp | grep -E ':(80|443|3000|3001|8080|5432)\s' || echo "ports are free"
```

اگر فقط 3000/3001/8080 اشغال‌اند، می‌توانید در `.env` پورت دیگری بدهید (`BACKEND_PORT`، `ADMIN_PORT`، `USER_PORT`) و همان را در `/etc/nginx/sites-available/00-sakooticket-common.conf` هم عوض کنید.

---

## 5. 🖥 سرور: نصب Docker

اول ببینید نصب است یا نه:

```bash
docker --version && docker compose version
```

اگر هر دو نسخه چاپ شد، به مرحله ۶ بروید. اگر نه (Ubuntu 22.04 / 24.04):

```bash
apt-get update
apt-get install -y docker.io docker-compose-v2
systemctl enable --now docker
docker --version && docker compose version
```

در Debian به جای `docker-compose-v2` بسته `docker-compose-plugin` را از مخزن رسمی Docker نصب کنید. Imageها با آدرس کامل از میرور `docker.abrha.net` دریافت می‌شوند، پس تنظیم میرور برای Docker لازم نیست. بررسی دسترسی به میرور:

```bash
docker pull docker.abrha.net/postgres:17-alpine
```

---

## 6. 🖥 سرور: باز کردن بسته و تنظیم `.env`

```bash
cd /root
sha256sum -c sakooticket-release.tar.gz.sha256
mkdir -p /opt/sakooticket
tar -xzf /root/sakooticket-release.tar.gz -C /opt/sakooticket
cd /opt/sakooticket
ls -la
```

ساخت `.env` با Secretهای تصادفی (Secretها مستقیم داخل فایل نوشته می‌شوند و در خروجی یا تاریخچه shell نمی‌آیند):

```bash
cd /opt/sakooticket
[ -f .env ] && echo ".env already exists — NOT overwriting" || {
  cp .env.example .env
  chmod 600 .env
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 32)|" .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env
}
grep -c CHANGE_ME .env
```

خروجی آخر باید `0` باشد. سپس کلید کاوه‌نگار را وارد کنید:

```bash
nano /opt/sakooticket/.env
```

مقدارهایی که باید بررسی شوند:

| متغیر | مقدار |
|---|---|
| `KAVENEGAR_API_KEY` | **الزامی برای Production.** تا خالی است کد ورود همه شماره‌ها `1111` است و هر کسی با شماره مدیر ارشد وارد پنل مدیریت می‌شود. |
| `KAVENEGAR_OTP_TEMPLATE` | نام الگوی OTP در کاوه‌نگار |
| `PUBLIC_API_URL` | `https://sakooticket.ir/api/v1` |
| `PUBLIC_USER_SITE_URL` | `https://sakooticket.ir` |
| `CORS_ALLOWED_ORIGINS` | `https://sakooticket.ir,https://www.sakooticket.ir,https://panel.sakooticket.ir,https://adm.sakooticket.ir` |
| `DEMO_SEED_ENABLED` | `false` برای راه‌اندازی واقعی. با `true` فقط روی **دیتابیس خالی** داده نمایشی (رویداد، مشتری و …) پر می‌شود. |
| `PAYMENT_MODE` | `none` تا درگاه واقعی وصل شود |

> اگر از سرور قدیمی داده منتقل می‌کنید (مرحله ۷)، `JWT_SECRET` و `KAVENEGAR_*` را از `.env` سرور قدیمی بردارید. **`DB_PASSWORD` را هرگز بعد از اولین اجرا عوض نکنید**؛ رمز داخل Volume موجود تغییر نمی‌کند و بک‌اند وصل نمی‌شود.

بررسی نهایی تنظیمات (Secretها چاپ نمی‌شوند):

```bash
cd /opt/sakooticket
docker compose config --quiet && echo "compose config OK"
```

---

## 7. 🖥 (اختیاری) انتقال داده از سرور قدیمی

فقط اگر روی سرور قدیمی (`45.156.186.169`) داده واقعی هست. نام Containerها روی سرور قدیمی ممکن است متفاوت باشد؛ با `docker ps` پیدا کنید.

روی **سرور قدیمی**:

```bash
docker ps --format '{{.Names}}\t{{.Image}}'
docker volume ls
```

فرض کنید Container دیتابیس `javanticket-db-1` و Volume آپلودها `javanticket_uploads` است (اگر نام‌ها فرق دارند، فقط همین دو نام را در دستورهای زیر عوض کنید):

```bash
mkdir -p /root/migrate && chmod 700 /root/migrate
docker exec javanticket-db-1 sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > /root/migrate/db.dump
docker run --rm -v javanticket_uploads:/data:ro docker.abrha.net/postgres:17-alpine tar -czf - -C /data . > /root/migrate/uploads.tar.gz
ls -lh /root/migrate
```

فایل‌ها را به سرور جدید منتقل کنید (از سیستمی که به هر دو سرور دسترسی دارد):

```bash
scp -P 22 root@45.156.186.169:/root/migrate/db.dump root@45.156.186.169:/root/migrate/uploads.tar.gz /tmp/   # اگر پورت SSH سرور قدیمی 22 نیست، عدد بعد از -P را عوض کنید
scp -P 9011 /tmp/db.dump /tmp/uploads.tar.gz root@87.107.164.153:/root/
```

روی **سرور جدید**، قبل از مرحله ۸ (فقط دیتابیس بالا می‌آید، بک‌اند هنوز خاموش است):

```bash
cd /opt/sakooticket
docker compose up -d db
until docker inspect -f '{{.State.Health.Status}}' sakooticket-db | grep -q healthy; do sleep 2; done
docker exec -i sakooticket-db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --exit-on-error' < /root/db.dump
```

در این حالت `DEMO_SEED_ENABLED=false` بماند. حالا مرحله ۸ را اجرا کنید و **بعد از آن** تصاویر آپلودشده را بازگردانی کنید (Volume در مرحله ۸ ساخته می‌شود؛ مالک فایل‌ها کاربر غیر root کانتینر بک‌اند، با UID 10001، می‌شود):

```bash
cd /opt/sakooticket
docker run --rm -v sakooticket_uploads:/data -v /root:/in:ro docker.abrha.net/postgres:17-alpine sh -c 'tar -xzf /in/uploads.tar.gz -C /data && chown -R 10001:10001 /data'
docker compose restart backend
```

---

## 8. 🖥 سرور: بالا آوردن سرویس‌ها

```bash
cd /opt/sakooticket
docker compose up -d --build
```

اولین build چند دقیقه طول می‌کشد (`npm ci` و `next build` برای دو فرانت‌اند). سرویس‌ها به ترتیب db → backend → admin → user بالا می‌آیند. وضعیت:

```bash
docker compose ps
```

هر چهار سرویس باید `running (healthy)` باشند. اگر نبودند:

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=100 admin
docker compose logs --tail=100 user
```

تست داخلی (روی خود سرور):

```bash
curl -s -o /dev/null -w 'backend %{http_code}\n' http://127.0.0.1:8080/api/v1/public/site-settings
curl -s -o /dev/null -w 'admin   %{http_code}\n' http://127.0.0.1:3000/admin/login
curl -s -o /dev/null -w 'user    %{http_code}\n' http://127.0.0.1:3001/
ss -ltn | grep -E ':(3000|3001|8080|5432)\s'
```

سه کد `200` انتظار می‌رود و پورت‌ها فقط روی `127.0.0.1` باشند (5432 اصلاً نباید باشد).

سرویس‌ها با `restart: unless-stopped` بعد از Reboot خودکار بالا می‌آیند، به شرطی که Docker فعال باشد:

```bash
systemctl is-enabled docker
```

---

## 9. 🖥 سرور: nginx و SSL

پیش‌شرط: DNS مرحله ۱.۲ منتشر شده و پورت‌های 80 و 443 آزادند.

```bash
cd /opt/sakooticket
bash deploy/setup-nginx.sh admin@sakooticket.ir
```

(به جای `admin@sakooticket.ir` ایمیلی بگذارید که هشدار انقضای گواهی را دریافت کند.)

اسکریپت به ترتیب:

1. nginx و certbot را نصب می‌کند.
2. از کل `/etc/nginx` در `/root/sakooticket-backups/nginx/` Backup می‌گیرد.
3. اگر برنامه دیگری روی 80/443 باشد متوقف می‌شود (چیزی را نمی‌بندد).
4. بررسی می‌کند هر چهار دامنه به `87.107.164.153` اشاره کنند؛ اگر نه متوقف می‌شود.
5. snippetها را نصب می‌کند و در صورت نبود گواهی، یک کانفیگ موقت HTTP برای ACME challenge فعال می‌کند.
6. یک گواهی SAN برای `sakooticket.ir`، `www`، `panel` و `adm` می‌گیرد (اگر گواهی معتبر هست، همان را نگه می‌دارد).
7. پنج فایل کانفیگ را نصب و فعال می‌کند. اگر `nginx -t` رد شود، فقط سایت‌های sakooticket را غیرفعال می‌کند و nginx را reload نمی‌کند.
8. تمدید خودکار (`certbot.timer` + reload nginx) را تنظیم و با `--dry-run` آزمایش می‌کند.

اجرای دوباره اسکریپت (مثلاً بعد از تغییر کانفیگ) بی‌خطر است.

بررسی گواهی و تمدید:

```bash
certbot certificates --cert-name sakooticket.ir
systemctl list-timers certbot.timer --no-pager
```

---

## 10. تست نهایی

### 10.1 تست خودکار

```bash
bash /opt/sakooticket/deploy/verify.sh
```

این اسکریپت فقط درخواست می‌فرستد و چیزی را تغییر نمی‌دهد. موارد بررسی‌شده:

- DNS هر چهار دامنه
- Redirect 301 از HTTP به HTTPS
- اعتبار و زنجیره گواهی و تاریخ انقضا
- صفحات سایت، بارگذاری مستقیم مسیرهای داخلی، 404
- فایل‌های استاتیک و Cache آن‌ها، نبودن `localhost` در HTML
- API عمومی
- برگشت 401 برای APIهای کاربر و مدیر بدون توکن یا با توکن جعلی
- غیرفعال بودن Swagger
- CORS: پذیرش `adm` و رد Origin خارجی
- Redirect پنل کاربران
- ورود پنل مدیریت و noindex
- Security Headers
- بسته بودن پورت‌های داخلی
- سلامت و Restart Policy کانتینرها

در پایان تعداد موفق، ناموفق و هشدار را اعلام می‌کند.

اجرای همین اسکریپت از سیستم خودتان (بیرون از سرور) هم مفید است، چون بسته بودن واقعی پورت‌ها را از اینترنت می‌سنجد:

```bash
cd /Volumes/developer/developer/IdeaProjects/JavanTicket
bash deploy/verify.sh
```

### 10.2 تست دستی در مرورگر (حالت Incognito)

| # | تست | نتیجه مورد انتظار |
|---|---|---|
| 1 | `https://sakooticket.ir` | صفحه اصلی با CSS، تصاویر و قفل سبز؛ در Console خطای Mixed Content یا CORS نباشد |
| 2 | باز کردن یک رویداد و زدن F5 روی صفحه داخلی | همان صفحه دوباره بارگذاری شود (نه 404) |
| 3 | `https://panel.sakooticket.ir` | انتقال به صفحه ورود یا پروفایل در `sakooticket.ir` |
| 4 | ورود کاربر با شماره موبایل و کد پیامکی | پیامک واقعی برسد؛ ورود موفق و رفتن به پروفایل |
| 5 | رفرش صفحه پروفایل، بستن و باز کردن تب | نشست حفظ شود |
| 6 | خروج (Logout) | برگشت به حالت مهمان؛ صفحات حساب دوباره ورود بخواهند |
| 7 | `https://adm.sakooticket.ir` | صفحه ورود مدیریت |
| 8 | ورود با شماره مدیر ارشد | داشبورد و منوها بارگذاری شوند |
| 9 | آپلود یک تصویر (مثلاً بنر) در پنل مدیریت | آپلود موفق و نمایش تصویر از `https://sakooticket.ir/uploads/...` |
| 10 | ورود به پنل مدیریت با شماره یک کاربر عادی | ورود رد شود / به APIهای مدیریت 403 برگردد |
| 11 | ساخت نقش محدود در پنل و ورود با مدیر آن نقش | فقط منوهای مجاز دیده شوند |
| 12 | `docker compose restart` و تکرار تست 1 و 8 | بعد از healthy شدن کار کنند و نشست‌ها حفظ شوند |

---

## 11. 🖥 سرور: امنیت (فایروال و SSH)

### 11.1 فایروال (ufw)

> ⚠️ **ترتیب مهم است.** اگر ufw را بدون باز کردن پورت SSH (`9011`) فعال کنید، دسترسی SSH قطع می‌شود. قبل از ادامه، کنسول اضطراری (VNC) در پنل دیتاسنتر را در دسترس داشته باشید.

```bash
ufw status verbose
```

اگر `inactive` است:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 9011/tcp comment 'ssh'
ufw allow 80/tcp comment 'http'
ufw allow 443/tcp comment 'https'
ufw --force enable
ufw status verbose
```

اگر سرویس دیگری روی سرور پورت دیگری لازم دارد، قبل از `enable` آن را هم `allow` کنید (از فایل preflight مرحله ۴).

> Docker قوانین ufw را برای پورت‌های منتشرشده دور می‌زند. به همین دلیل همه پورت‌های این پروژه در `docker-compose.yml` فقط روی `127.0.0.1` منتشر شده‌اند و دیتابیس هیچ پورتی ندارد.

### 11.2 ورود فقط با کلید SSH

روی **سیستم خودتان** کلید را به سرور اضافه کنید:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 9011 root@87.107.164.153
ssh -p 9011 -o PasswordAuthentication=no root@87.107.164.153 'echo key login OK'
```

**فقط اگر خط آخر `key login OK` چاپ کرد**، روی سرور ورود با رمز را ببندید:

```bash
cat > /etc/ssh/sshd_config.d/90-sakooticket-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
sshd -t && systemctl reload ssh
```

نشست فعلی را نبندید و از یک ترمینال دیگر دوباره با کلید وارد شوید تا مطمئن شوید.

---

## 12. Backup و بازگردانی

### 12.1 Backup دستی

```bash
bash /opt/sakooticket/deploy/backup.sh
ls -l /root/sakooticket-backups/
```

هر Backup در `/root/sakooticket-backups/<تاریخ-ساعت>/` شامل این فایل‌هاست:

- `db.dump`
- `uploads.tar.gz`
- `env`
- `etc-nginx.tar.gz`
- `etc-letsencrypt.tar.gz`
- `SHA256SUMS`

Backupهای قدیمی‌تر از ۱۴ روز خودکار حذف می‌شوند.

### 12.2 Backup خودکار روزانه (ساعت ۳:۳۰)

```bash
chmod 700 /opt/sakooticket/deploy/backup.sh
( crontab -l 2>/dev/null | grep -v sakooticket/deploy/backup.sh; echo '30 3 * * * /opt/sakooticket/deploy/backup.sh >> /var/log/sakooticket-backup.log 2>&1' ) | crontab -
crontab -l
```

Backup را هر چند وقت یک بار به خارج از سرور منتقل کنید (از سیستم خودتان):

```bash
scp -P 9011 -r root@87.107.164.153:/root/sakooticket-backups ./sakooticket-backups-$(date +%Y%m%d)
```

### 12.3 بازگردانی دیتابیس

> بازگردانی داده فعلی را جایگزین می‌کند. **اول یک Backup تازه بگیرید.** در دستورهای زیر `20261121-033000` را با نام پوشه Backup موردنظر عوض کنید.

```bash
bash /opt/sakooticket/deploy/backup.sh
cd /opt/sakooticket
docker compose stop user admin backend
docker exec -i sakooticket-db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < /root/sakooticket-backups/20261121-033000/db.dump
docker run --rm -v sakooticket_uploads:/data -v /root/sakooticket-backups/20261121-033000:/in:ro --entrypoint tar sakooticket-backend -xzf /in/uploads.tar.gz -C /data
docker compose up -d
```

---

## 13. نگهداری

### لاگ‌ها

```bash
cd /opt/sakooticket
docker compose logs -f --tail=200 backend
docker compose logs -f --tail=200 admin
docker compose logs -f --tail=200 user
docker compose logs --tail=100 db
tail -f /var/log/nginx/sakooticket.ir.access.log /var/log/nginx/sakooticket.ir.error.log
tail -f /var/log/nginx/adm.sakooticket.ir.error.log
```

لاگ کانتینرها با `json-file` و حداکثر ۵ فایل ۲۰ مگابایتی محدود شده‌اند. لاگ nginx با `logrotate` پیش‌فرض Ubuntu (`/etc/logrotate.d/nginx`) چرخش می‌کند.

### منابع

```bash
docker stats --no-stream
free -h
df -h
docker system df
```

### ری‌استارت

```bash
cd /opt/sakooticket
docker compose restart backend
docker compose restart
nginx -t && systemctl reload nginx
```

### به‌روزرسانی به نسخه جدید

💻 روی سیستم توسعه بسته جدید را بسازید و منتقل کنید (مراحل ۲ و ۳). سپس 🖥 روی سرور:

```bash
bash /opt/sakooticket/deploy/backup.sh
for s in backend admin user; do docker tag sakooticket-$s:latest sakooticket-$s:previous; done
cp /opt/sakooticket/docker-compose.yml /root/sakooticket-backups/docker-compose.yml.previous
cd /root
sha256sum -c sakooticket-release.tar.gz.sha256
tar -xzf /root/sakooticket-release.tar.gz -C /opt/sakooticket
cd /opt/sakooticket
docker compose up -d --build
docker compose ps
bash deploy/verify.sh
```

`.env` و Volumeها دست نمی‌خورند، چون داخل بسته نیستند. اگر کانفیگ nginx تغییر کرده، `bash deploy/setup-nginx.sh admin@sakooticket.ir` را دوباره اجرا کنید.

### Rollback

```bash
cd /opt/sakooticket
for s in backend admin user; do docker tag sakooticket-$s:previous sakooticket-$s:latest; done
cp /root/sakooticket-backups/docker-compose.yml.previous /opt/sakooticket/docker-compose.yml
docker compose up -d --no-build
docker compose ps
```

> Migrationهای دیتابیس (Flyway) فقط رو به جلو هستند. اگر نسخه جدید Migration داشته و نسخه قبلی با دیتابیس جدید بالا نمی‌آید، دیتابیس را از Backupی که قبل از به‌روزرسانی گرفته شده بازگردانی کنید (بخش ۱۲.۳).

---

## 14. فعال کردن CDN ابرآروان (بعداً)

گواهی و کانفیگ فعلی برای اتصال مستقیم (پروکسی خاموش) تنظیم شده‌اند. اگر بعداً پروکسی ابرآروان را روشن کردید:

1. در ابرآروان، بخش HTTPS، پروتکل اتصال به مبدأ را **HTTPS** بگذارید؛ HTTP نگذارید. گواهی Let's Encrypt روی مبدأ معتبر است.
2. در `/etc/nginx/sites-available/00-sakooticket-common.conf` خطوط `set_real_ip_from` را با رنج‌های رسمی ابرآروان (`https://www.arvancloud.ir/fa/ips.txt`) فعال کنید. بعد این را اجرا کنید:
   ```bash
   nginx -t && systemctl reload nginx
   ```
   بدون این کار، IP همه بازدیدکنندگان در لاگ‌ها IP ابرآروان دیده می‌شود.
3. Cache ابرآروان را برای `/api/*` غیرفعال (Bypass) کنید.
4. تمدید گواهی (`certbot renew --dry-run`) را دوباره آزمایش کنید. ابرآروان باید مسیر `/.well-known/acme-challenge/` را به مبدأ برساند.

---

## 15. عیب‌یابی

| مشکل | علت و راه‌حل |
|---|---|
| `502 Bad Gateway` | کانتینر بالا نیست یا هنوز healthy نشده: `docker compose ps` و `docker compose logs --tail=200 backend` |
| بک‌اند مدام Restart می‌شود با `password authentication failed` | `DB_PASSWORD` بعد از اولین اجرا تغییر کرده. مقدار اولیه را برگردانید |
| `set DB_PASSWORD in .env` یا پیام مشابه هنگام `docker compose` | متغیر الزامی در `.env` خالی است؛ مرحله ۶ |
| `setup-nginx.sh` با پیام `WRONG ... -> 45.156.186.169` متوقف می‌شود | DNS هنوز به سرور قدیمی اشاره می‌کند؛ مرحله ۱.۲ و صبر برای انتشار |
| certbot: `Timeout during connect` یا `unauthorized` | پورت 80 از اینترنت بسته است (فایروال دیتاسنتر/ufw) یا پروکسی ابرآروان روشن است |
| `Address already in use` در nginx | برنامه دیگری روی 80/443: `ss -ltnp \| grep -E ':(80\|443)\s'` |
| پنل مدیریت: خطای CORS در Console | `CORS_ALLOWED_ORIGINS` در `.env` باید `https://adm.sakooticket.ir` را داشته باشد. بعد از اصلاح: `docker compose up -d backend` |
| سایت یا پنل هنوز به آدرس قبلی/`localhost` وصل می‌شود | `PUBLIC_API_URL` اشتباه بوده. اصلاح در `.env` و `docker compose up -d --build admin user` |
| کد ورود همیشه `1111` است | `KAVENEGAR_API_KEY` خالی است |
| آپلود: `413 Request Entity Too Large` | فایل بزرگ‌تر از ۵۰ مگابایت (سقف بک‌اند) |
| آپلود: `AccessDeniedException` در لاگ بک‌اند | Volume آپلود از نسخه قدیمی با مالک root منتقل شده است. این را اجرا کنید: `docker run --rm -v sakooticket_uploads:/data docker.abrha.net/postgres:17-alpine chown -R 10001:10001 /data` |
| build فرانت روی سرور: `npm ci` با خطای شبکه | دسترسی به `mirror.abrha.net` را بررسی کنید: `curl -I https://mirror.abrha.net/repository/npm/` |
| اپ اندروید قدیمی به `IP:8080` وصل نمی‌شود | پورت 8080 عمداً بسته است؛ نسخه جدید اپ باید `https://sakooticket.ir/api/v1` را استفاده کند |
