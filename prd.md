# 📄 PRD: Factify (Yapay Zeka Destekli Bilgi Doğrulama Asistanı)

## 1. Ürün Özeti
Factify, internet üzerindeki bilgi kirliliğine karşı geliştirilmiş, hızlı ve eğitici bir analiz aracıdır. Kullanıcıların şüpheli bulduğu metinleri yapay zeka aracılığıyla dil, mantık ve kaynak tutarlılığı açısından süzgeçten geçirir.

## 2. Kullanıcı Deneyimi (User Journey)
1. **Giriş:** Kullanıcı ana sayfadaki geniş metin kutusuna analiz edilmesini istediği haber veya iddiayı yapıştırır.
2. **İşlem:** "Analiz Başlat" butonuna tıklar. Sistem o esnada kullanıcıya şık bir yükleme animasyonu sunar.
3. **Sonuç:** Kullanıcı, %0-100 arası bir "Güven Skoru" ve bu skorun nedenlerini açıklayan detaylı analiz kartlarını görür.

## 3. Fonksiyonel Gereksinimler (MVP)
* **Metin Giriş Modülü:** Büyük veri girişlerini destekleyen, kullanıcı dostu bir text-area.
* **AI Analiz Katmanı:** Gemini API entegrasyonu ile metnin şu açılardan incelenmesi:
    * **Dil Analizi:** Duygu sömürüsü, tıklama tuzağı (clickbait) veya manipülatif dil tespiti.
    * **Mantık Kontrolü:** Safsata (logical fallacies) ve tutarsız önerme tespiti.
    * **Bağlamsal Doğrulama:** Metnin genel güvenilirlik standartlarıyla uyumu.
* **Görsel Raporlama:** Analiz sonuçlarının grafiksel ve metinsel olarak (Güven Metresi) sunulması.
* **Eğitici Geri Bildirim:** Kullanıcının dijital okuryazarlığını artıracak "Neden güvenilmez?" açıklamaları.

## 4. Teknik Mimari
* **Frontend:** React.js / Next.js (Hızlı ve SEO dostu yapı).
* **Stil:** Tailwind CSS (Modern, karanlık tema ve profesyonel tipografi).
* **AI Entegrasyonu:** Google Gemini Pro API.
* **Dağıtım (Deployment):** Vercel veya Netlify üzerinden hızlı canlıya alım.

## 5. Başarı Metrikleri
* Analiz sürecinin 5 saniyenin altında tamamlanması.
* Kullanıcının sonuç ekranında en az 30 saniye kalarak analiz detaylarını okuması.
* Arayüzün mobil ve masaüstü cihazlarda kusursuz çalışması.