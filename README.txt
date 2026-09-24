سامانه حضور و غیاب آنلاین — نسخه نهایی آماده اتصال
================================================

این نسخه برای کار بین چند گوشی طراحی شده و از Firebase Realtime Database استفاده می‌کند.
Firebase داده‌ها را به‌صورت همگام و بلادرنگ بین کلاینت‌ها منتقل می‌کند.

مراحل راه‌اندازی:
1) در Firebase یک Project بسازید.
2) یک Web App به پروژه اضافه کنید و firebaseConfig را بگیرید.
3) Realtime Database را بسازید.
4) فایل firebase-config.js را باز کنید و مقادیر FIREBASE_CONFIG را با config پروژه عوض کنید.
5) برای تست اولیه می‌توانید موقتاً Database Rules را باز کنید؛ برای استفاده واقعی باید احراز هویت و Security Rules تنظیم شود.
6) فایل‌ها را روی GitHub Pages قرار دهید. GitHub Pages فایل‌های HTML/CSS/JS را مستقیماً منتشر می‌کند.

نکته مهم امنیتی:
رمز 19121912 داخل کد فرانت‌اند است و به‌تنهایی امنیت واقعی ایجاد نمی‌کند. برای استفاده رسمی مدرسه‌ای، بهتر است مرحله بعد Firebase Authentication + Security Rules اضافه شود تا فقط معلم بتواند تنظیمات را تغییر دهد.

ویژگی‌ها:
- 29 دانش‌آموز
- تغییر نام دانش‌آموزان توسط معلم
- تعیین ساعت شروع و پایان
- باز/بسته کردن پنجره حضور
- ثبت حضور در لحظه
- نمایش تأخیر به دقیقه
- گزارش زنده روی گوشی معلم
- نگهداری گزارش هر روز
- لینک مستقیم صفحه دانش‌آموز

ساختار:
index.html
student.html
teacher.html
style.css
firebase-config.js
student.js
teacher.js
README.txt

مستندات رسمی:
Firebase Web setup:
https://firebase.google.com/docs/web/setup
Realtime Database:
https://firebase.google.com/docs/database/web/start
GitHub Pages:
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
