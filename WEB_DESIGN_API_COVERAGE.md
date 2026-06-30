# Yoremio Web Design API Coverage

Bu dosya web tasariminda API'nin karsilayamayacagi alanlar kalmasin diye tutulur. Ekran mockup'i hazirlanirken buradaki sinirlar esas alinmalidir.

## Public Ana Sayfa

Desteklenen alanlar:

- Kategori listesi: `GET /api/App/bootstrap` veya `GET /api/Kategori`
- Urun arama/liste/grid: `GET /api/Urun`
- Arama kutusu: `q`
- Kategori filtresi: `kategoriId`
- Lokasyon filtresi: `sehir`, `ilce`
- Fiyat filtresi: `minFiyat`, `maxFiyat`
- Stok filtresi: `sadeceStoktaOlanlar`
- Puan filtresi: `minOrtalamaPuan`
- Siralama: `sort`
- One cikan saticilar: `GET /api/Profil/saticilar/one-cikan`
- Urun karti gorseli: `urun.resimler[0].url`
- Satici rozetleri: `saticiDogrulanmis`, `saticiMagazaAdi`, `saticiSehir`, `saticiIlce`

Tasarim siniri:

- Ana sayfada canli kampanya, kupon, kargo takibi, odeme veya siparis durumu gosterilmemelidir; bu API'de yoktur.

## Urun Kesif Ve Detay

Desteklenen alanlar:

- Galeri: `resimler`, `videolar`
- Fiyat/stok/kategori/satici bilgisi: `UrunDto`
- Sosyal kanit: `ortalamaPuan`, `toplamPuan`, `toplamYorum`, `toplamFavori`
- Favoriye ekle/cikar: `POST /api/Urun/{urunId}/favori`, `DELETE /api/Urun/{urunId}/favori`
- Favoride mi bilgisi: alici login ise `GET /api/Urun/favorilerim` sonucu urun id ile eslestirilir.
- Talep olustur: `POST /api/Talep`
- Saticiya yaz: `POST /api/Chat/messages/{receiverId}` veya SignalR `SendMessage`
- Satici guven skoru: `GET /api/Profil/satici/{saticiId}/guven-skoru`

Tasarim siniri:

- Sepete ekle, hemen ode, kargo sec veya stok rezervasyonu ana aksiyon yapilmamalidir. Bu API su an talep/teklif pazarligi modelindedir.

## Alici Paneli

Desteklenen alanlar:

- Onerilen urunler: `GET /api/Urun/onerilen`
- Favoriler: `GET /api/Urun/favorilerim`
- Taleplerim: `GET /api/Talep/benim`
- Talep karti urun/satici gorseli: `urunResimUrl`, `urunAdi`, `urunFiyat`, `saticiMagazaAdi`, `saticiSehir`, `saticiIlce`
- Teklif kabul: `POST /api/Talep/teklif/{teklifId}/kabul`
- Mesajlar: `GET /api/Chat/conversations`, `GET /api/Chat/messages/{otherUserId}`
- Puan/yorum: sadece anlasilmis talep sonrasi `POST /api/Puan/puan-ekle`, `POST /api/Yorum`

Tasarim siniri:

- Alici profil detay duzenleme ekrani tasarlanmamalidir; API'de ayri alici profil controller'i yoktur.
- Siparis/fatura/odeme gecmisi tasarlanmamalidir; talep kabul edilince sadece `ANLASILDI` olur.

## Satici Paneli

Desteklenen alanlar:

- KPI kartlari: `GET /api/Dashboard/satici`
- Profil: `GET /api/Profil/satici`, `PUT /api/Profil/satici`
- Urunlerim: `GET /api/Urun/urunlerim`
- Urun ekle/guncelle: `POST /api/Urun/urun-ekle`, `PUT /api/Urun/{urunId}`
- Medya yukle: multipart `Resimler`, `Videolar`
- Medya sil: `DELETE /api/Urun/{urunId}/resimler/{resimId}`, `DELETE /api/Urun/{urunId}/videolar/{videoId}`
- Aktif/pasif: `PATCH /api/Urun/{urunId}/status`
- Gelen talepler: `GET /api/Talep/satici`
- Teklif ver/guncelle: `POST /api/Talep/{talepId}/teklif`
- Chat: Chat REST + SignalR endpointleri

Tasarim siniri:

- Satici panelinde kategori CRUD gosterilmemelidir; kategori yazma `ADMIN` rolundedir.
- Kargo, odeme veya kupon yonetimi gosterilmemelidir.

## Chat

Desteklenen alanlar:

- Konusma listesi: `GET /api/Chat/conversations`
- Mesaj gecmisi: `GET /api/Chat/messages/{otherUserId}`
- Mesaj gonderme: `POST /api/Chat/messages/{receiverId}` veya SignalR
- Okundu: `POST /api/Chat/messages/{otherUserId}/read`
- Unread badge: `unreadCount`

Tasarim siniri:

- Chat kaydi su an dogrudan urun veya talep entity'sine bagli degildir. Chat yaninda urun/talep context karti gosterilecekse bu kart acilan urun veya talep ekranindaki mevcut veriden beslenmelidir.


## Dosyalar

D:\PROJECTS\SERDAL(PRİVATE)\Yoremio Arayüz\web-design-mockups /

- 01-public-home.png: Public ana sayfa, kategori, arama, urun grid'i ve one cikan saticilar.
- 02-product-discovery-detail.png: Urun kesif, filtreler, urun grid'i ve urun detay paneli.
- 03-seller-dashboard.png: Satici panel dashboard, KPI, urunlerim, gelen talepler ve medya yonetimi.
- 04-buyer-dashboard-chat.png: Alici paneli, favoriler, talepler, teklifler ve chat.
- 05-login.png: Giris ekrani, alici/satici kayit linkleri ve dogrulama mesaji linki.
- 06-buyer-register.png: Alici kayit ekrani; API'ye uygun olarak email ve sifre odakli.
- 07-seller-register.png: Satici kayit ekrani; email, telefon, sifre, magaza, vergi no, adres, sehir, ilce.
- 08-verification.png: Email/telefon kod dogrulama ve tekrar gonderme akisi.
- 09-seller-product-form-media.png: Urun ekle/guncelle, kategori secimi, resim/video yukleme ve medya silme.
- 10-seller-profile-trust.png: Satici profil, dogrulama durumu, guven skoru ve API destekli seller metrikleri.
- 11-admin-dashboard-categories.png: Admin dashboard ve kategori CRUD; kategori formu sadece ad/aciklama icerir.
- 12-reviews-ratings.png: Urun yorum/puan bolumu, anlasilmis talep sonrasi yorum/puan akisi.
- 13-global-states.png: Bos durum, yetkisiz, rate limit, form validasyon ve traceId durumlari.

## API Siniri

Detayli kontrol listesi icin repo kokundeki WEB_DESIGN_API_COVERAGE.md dosyasini esas alin.    ul paı dokumanıda guncellednı resımelrde klsorde var zaten   hadı bakalım yap  buna gore tsarla