# Sajak publik

Buka `/#/sajak`, atau pilih **Sajak untukmu** di laman login. Rute hash dapat
dibagikan dan dimuat ulang tanpa konfigurasi rewrite server tambahan.

- `poem.txt` adalah salinan persis `ref/sajak/isi_sajak,md`; edit berkas ini untuk
  mengganti isi yang ditampilkan. Baris kosong membatasi enam bagian sajak.
- `love-me.mp3` adalah salinan musik pilihan pengguna. Vite menyertakannya sebagai
  aset build. Audio baru dimuat saat pengguna memulai pembacaan.
- Setiap kalimat tampil selama 10 detik.
  Jeda mempertahankan progres kalimat; sebelumnya/berikutnya memulai durasi
  kalimat baru. Musik menjadi latar berulang, bukan sinkronisasi lirik.
- Berpindah tab menjeda pembacaan dan audio. Keluar dari halaman menghentikan
  audio. Tombol lanjut diperlukan untuk melanjutkan setelah kembali ke tab.
- Preferensi sistem `prefers-reduced-motion` menonaktifkan animasi dekoratif
  dan transisi teks. Isi tetap disajikan per kalimat.

Pemeriksaan: `npm run build` dan `npx eslint src/features/Sajak/SajakPage.jsx`.
