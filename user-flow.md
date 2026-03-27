# Kullanıcı Akışı (User Flow) - Factify

## Aktör
- Kullanıcı: Şüpheli bir haber/iddia metninin güvenilirliğini kontrol etmek isteyen kişi.

## Ana Senaryo (MVP)
1. Kullanıcı ana sayfayı açar.
2. Kullanıcı büyük metin kutusuna analiz edilmesini istediği haber/iddia metnini yapıştırır.
3. Kullanıcı `Analiz Başlat` butonuna tıklar.
4. Sistem analiz devam ederken yükleme animasyonu/ilerleme göstergesi gösterir.
5. Sistem Gemini üzerinden metin analizini tamamlar.
6. Kullanıcı sonuç ekranına yönlendirilir ya da sonuç alanında sonuçlar görünür.
7. Kullanıcı ekranda:
   - `Güven Skoru` (%0-100) değerini görür.
   - Güven skorunun nedenlerini açıklayan detay kartları okur (dil, mantık ve bağlamsal değerlendirme).
8. Kullanıcı istenirse metni güncelleyip tekrar analiz başlatır.

## Durumlar ve Hata Akışları
- Boş/çok kısa metin:
  - Kullanıcıya geçerli bir metin girmesi için uyarı gösterilir.
  - Analiz başlatılmaz.
- API/hizmet hatası:
  - Sistem kullanıcıya hata mesajı gösterir.
  - Kullanıcı tekrar denemek için `Analiz Başlat` akışına döner.
- Süre aşımı:
  - Sistem analiz isteğinin zaman aşımına uğradığını belirtir.
  - Kullanıcı tekrar denemek için yönlendirilir.

## Çıktılar (Kullanıcıya Gösterilecekler)
- %0-100 `Güven Skoru`
- Güven skorunu destekleyen açıklama kartları:
  - Dil analizi (clickbait/manipülatif dil vb.)
  - Mantık kontrolü (safsata vb.)
  - Bağlamsal doğrulama (genel güvenilirlik uyumu)

