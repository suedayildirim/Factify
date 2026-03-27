# Factify - Adim Adim Gelistirme Task Listesi

## MVP Kabul Kriterleri
- Analiz sureci 5 saniyenin altinda tamamlanir.
- Sonuc ekrani %0-100 arasi bir "Gueven Skoru" gosterir ve nedenlerini aciklayan detay kartlar icermelidir.
- UI mobil ve masaustu cihazlarda sorunsuz calisir.

## 1. Proje Kurulumu
1. Next.js (veya React) projesini olustur.
2. Tailwind CSS ile temel stil/tema (karanlik mod) altyapisini kur.
3. Temel dizin yapisini belirle (frontend componentleri, server/API mantigi).
4. API gecisleri icin ortam degiskenlerini tanimla (ornegin `GEMINI_API_KEY`).
5. Lint/format (ESLint + Prettier) ve basic quality kontrollerini ekle.

## 2. Frontend: Metin Giris ve Baslatma Akisi
1. Ana sayfada buyuk bir `textarea` bilepeni ekle (uzun metin girisini rahat destekleyecek sekilde).
2. "Analiz Baslat" butonu ekle.
3. Kullanici aksiyonunda asenkron durum yonetimi uygula (buton disable, hata/uyari UI).
4. Yukleme animasyonu/placeholder tasarla ve analiz tamamlanana kadar goster.
5. Metin inputu icin min/maks uzunluk ve bos metin validasyonu ekle.

## 3. Frontend: Sonuc Ekrani (Gorsel Raporlama)
1. Sonuc ekranini olustur: guven skor karti + detay kart alanlari.
2. "Gueven Metresi"ni uygulamak icin bir UI bileseni hazirla (progress bar veya gauge).
3. Sonuclar yuklenirken skeleton/placeholder goster.
4. Basit durumlar: basarili sonuc, API hata durumu, zaman asimi durumu.

## 4. Backend / API: Gemini ile Analiz Entegrasyonu
1. Server tarafinda bir API endpointi olustur (ornegin `POST /api/analyze`).
2. Endpoint gelen istegi parse et, metni normalize et (trim, bosluk duzeltme).
3. Rate limit veya basic guard (istek boyutu limiti, basit anti-abuse) ekle.
4. Gemini Pro API ile cagriyi uygula (server-side guvenlik icin API key sadece backendde kullanilsin).
5. Gemini'den donen yaniti parse et.
6. Sonuc formatini frontend'in kolay isleyebilecegi sekilde standardize et (ornegin structured JSON).

## 5. Analiz Kapsami: Dil, Mantik, Baglam
1. Gemini icin ayrintili prompt tasarla:
   - Dil analizi: duygu somurusu, clickbait/tiklayici dil, manipulatif dil tespiti
   - Mantik kontrolu: safsata (logical fallacies), tutarsiz onerme tespiti
   - Baglamsal dogrulama: genel guvenilirlik standartlarina uyum
2. Prompt cikisini zorunlu bir JSON schema'ya bagla (alan adlari sabit olsun).
3. Her bulgu icin: kisa bulgu + gerekce + metinden ornek/ifade (varsa) alanlarini ekle.
4. Bulgu yogunluguna gore kart sayisini makul tut (ornek: max N kart).

## 6. Gueven Skoru (0-100) Hesaplama
1. Skor hesaplama mantigini tanimla (ornegin dil/mantik/baglam bileşenlerine agirlik ver).
2. Gemini bulgularini skora map eden fonksiyonu uygula.
3. Skor ile kart aciklamalari arasinda tutarlilik sagla (skorun dayandigi gerekceler gorunsun).
4. Sinir durumlari: cok kisa metin, belirsiz metin, cikti parse edilemedi (fallback stratejisi).

## 7. Sonuc Kartlari: Egitici Geri Bildirim
1. Her kategori icin (Dil/Mantik/Baglam) detay kart komponenti olustur.
2. Kullaniciya "Neden guvenilmez?" tarzinda egitici metinler goster (bulgu temali).
3. Kartlarda guven skor etkisini aciklayan mini notlar goster (kisa, okumasu kolay).
4. UI okunabilirligi: tipografi, vurgular, uzun metinlerin duzenlenmesi (truncate/line clamp).

## 8. Performans ve Guvenilirlik
1. Analiz sureci icin hedef: < 5 sn.
2. Gemini cagrisini optimize et (prompt uzunlugu, cikti kismi, gereksiz alanlar).
3. Timeout ve retry politikasini uygula (ornegin tek retry, sonra hata).
4. Loglama: istemci tarafinda olay, backend tarafinda request/response gecis sureleri (PII olmadan).

## 9. Test ve Dogrulama
1. Skor hesaplama icin unit test yaz (farkli bulgu setlerinde skor araligi dogrulansin).
2. API endpoint icin integration testi yaz (mock Gemini yaniti ile).
3. UI icin temel e2e test (input -> analiz -> skor gosterimi akisi).

## 10. Deployment ve Ortam Ayarlari
1. Vercel veya Netlify icin deploy konfig (tercih ettigin platforma gore).
2. `GEMINI_API_KEY` ortam degiskenini deployment ortamina ekle.
3. README dokumani hazirla:
   - Calistirma adimlari
   - Ortam degiskenleri
   - API endpointleri

## 11. Sonraki Iterasyonlar (Opsiyonel)
1. Analiz cikis kalitesi icin prompt iterasyonu.
2. Kullaniciya sonuc kaydetme / gecmisi.
3. Rate limit ve maliyet optimizasyonu (token kullanimi takibi).
4. Daha gelismis grafikler (kategori bazli alt metrikler).

