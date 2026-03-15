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

1. Clone/download repo ini ke komputer.
2. Buka Chrome lalu akses `chrome://extensions`.
3. Aktifkan `Developer mode` (pojok kanan atas).
4. Klik `Load unpacked`.
5. Pilih folder project ini: `c:\Users\Admin\Documents\GitHub\StackScope-Inspector`.
6. Buka website yang ingin dicek, lalu klik icon extension `StackScope Inspector`.
7. Lihat hasil deteksi frontend/backend beserta confidence score dan evidence.

## Icon

- File icon extension ada di folder `icons/`

## Catatan

- Frontend umumnya bisa dideteksi lebih akurat daripada backend.
- Backend sering tersembunyi di balik CDN, reverse proxy, atau header yang disamarkan.
- Hasil "indikatif" berarti heuristik, bukan kepastian mutlak.
