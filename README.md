# Factify

Factify, supheli haber veya iddia metinlerini analiz ederek kullaniciya bir guven skoru ve aciklayici bulgular sunan Next.js tabanli bir uygulamadir.

## Ozellikler

- Metin girisi ile hizli analiz baslatma
- 0-100 arasi guven skoru gosterimi
- Dil analizi, mantik kontrolu ve baglamsal dogrulama bolumleri
- Yukleme ve hata durumlarinda anlik geri bildirim

## Proje Yapisi

- `frontend/`: Next.js uygulamasi (UI + API route)
- `prd.md`: urun gereksinimleri
- `tasks.md`: gorev listesi
- `tech-stack.md`: teknoloji secimleri
- `user-flow.md`: kullanici akisi

## Gereksinimler

- Node.js `18+`
- npm

## Kurulum

```bash
cd frontend
npm install
```

## Gelistirme Ortami

```bash
cd frontend
npm run dev
```

Uygulama varsayilan olarak `http://localhost:3000` adresinde calisir.

## Production Build

```bash
cd frontend
npm run build
npm run start
```

## Ortam Degiskenleri

`frontend/.env.example` dosyasini referans alip `frontend/.env` olusturun.

## Lisans

Bu proje su an icin ozel/deneysel gelistirme kapsamindadir.
