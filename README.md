# StackScope Inspector

Chrome Extension Manifest V3 untuk mendeteksi:

- bahasa frontend yang tampak di halaman
- framework frontend
- UI library dan CMS/platform
- petunjuk server serta kemungkinan backend

## Fitur

- Deteksi frontend dari DOM, script, stylesheet, dan pola asset
- Deteksi React, Vue, Angular, Next.js, Nuxt, Svelte, Gatsby, Astro, jQuery, Bootstrap, Tailwind, dan lainnya
- Analisis header response untuk indikasi backend seperti PHP, ASP.NET, Express, Django, Rails, serta server seperti Nginx, Apache, IIS, dan Cloudflare
- Confidence score dan evidence untuk setiap hasil

## Cara pakai

1. Buka `chrome://extensions`
2. Aktifkan `Developer mode`
3. Klik `Load unpacked`
4. Pilih folder ini: `c:\Users\Admin\Documents\GitHub\CWEB`

## Icon

- File icon extension ada di folder `icons/`
- Untuk generate ulang icon PNG, jalankan: `python scripts/generate_icons.py`

## Catatan

- Frontend umumnya bisa dideteksi lebih akurat daripada backend.
- Backend sering tersembunyi di balik CDN, reverse proxy, atau header yang disamarkan.
- Hasil "indikatif" berarti heuristik, bukan kepastian mutlak.
