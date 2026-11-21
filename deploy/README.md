# deploy/

راهنمای کامل استقرار Production: [../DEPLOYMENT.md](../DEPLOYMENT.md)

| فایل | کجا اجرا می‌شود | کار |
|---|---|---|
| `package-release.sh` | سیستم توسعه | ساخت jar بک‌اند و بسته `dist/sakooticket-release.tar.gz` |
| `setup-nginx.sh` | سرور (root) | نصب nginx و certbot، گرفتن گواهی SAN هر چهار دامنه، نصب کانفیگ‌ها، آزمایش تمدید |
| `verify.sh` | سرور یا هر سیستم دیگر | تست خودکار DNS، HTTPS، گواهی، API، CORS، هدرها، پورت‌ها و کانتینرها (فقط خواندنی) |
| `backup.sh` | سرور (root، روزانه با cron) | Backup دیتابیس، آپلودها، `.env`، nginx و گواهی‌ها |
| `nginx/sites/*.conf` | `/etc/nginx/sites-available/` | یک فایل برای هر دامنه + `00-sakooticket-common.conf` |
| `nginx/snippets/*.conf` | `/etc/nginx/snippets/` | تنظیمات مشترک SSL، Proxy و Security Headers |

| آدرس | چه چیزی نشان می‌دهد |
|---|---|
| `https://sakooticket.ir` | سایت کاربر و API (`/api`، `/uploads`، `/media`) |
| `https://www.sakooticket.ir` | انتقال به `sakooticket.ir` |
| `https://panel.sakooticket.ir` | پنل کاربران: انتقال به حساب کاربری در `sakooticket.ir/profile` |
| `https://adm.sakooticket.ir` | پنل مدیریت (`/admin`) |
