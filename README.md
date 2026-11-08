# Our 10 Challenges — Oray & Gamze

Mobil uyumlu, iki kişilik challenge uygulaması. **Google Sheets veritabanı**, **Google Apps Script web uygulaması** ve isteğe bağlı **GitHub kaynak kodu arşivi** ile çalışır.

## Özellikler

- Oray ilk challenge'ı ekler; Gamze ile dönüşümlü olarak 10'a kadar devam ederler.
- Her kişi toplam 5 challenge ekler.
- 10. madde eklendiğinde ekleme kapanır ve tamamlanma ekranı açılır.
- Her challenge için Oray ve Gamze'nin ayrı checkbox'ı ve tamamlanma tarihi vardır.
- Her kişi yalnızca kendi checkbox'ını değiştirebilir.
- Veriler Google Sheet'te kalıcıdır. Diğer cihazlar açıkken her 30 saniyede bir senkronize olur; sayfaya geri gelince de yenilenir.
- Her kişi kendi PIN'iyle giriş yapar. PIN'ler **GitHub'a eklenmez**.

## İlk kurulum — yaklaşık 7 adım

1. **[Google Sheets](https://sheets.new)** adresinden boş bir Sheet aç, örneğin `Our 10 Challenges` olarak adlandır.
2. Sheet içindeyken **Extensions > Apps Script** seç.
3. Açılan `Code.gs` dosyasındaki başlangıç içeriğini tamamen sil ve bu repodaki **`Code.gs`** dosyasının içeriğini yapıştır.
4. Sol taraftaki **+ (Add a file) > HTML** seçip dosyaya **`Index`** adını ver. Oluşan `Index.html` dosyasını bu repodaki `Index.html` içeriğiyle değiştir. **Index adının büyük I ile yazılması gerekir.**
5. Apps Script içinde **Project Settings (dişli) > Script Properties > Add script property** bölümüne aşağıdaki iki özelliği ekle. Her birine farklı, 6–12 haneli sayısal PIN ver:

   | Property | Value (örnek değil, kendi PIN'ini gir) |
   |---|---|
   | `ORAY_PIN` | Oray'ın yalnızca kendisinin bildiği PIN |
   | `GAMZE_PIN` | Gamze'nin yalnızca kendisinin bildiği PIN |

   **PIN'leri GitHub'a veya sohbetlere yazma.**
6. Apps Script editörünün üstündeki fonksiyon seçiminden **`setup`** seç, **Run** düğmesine tıkla. Google yetki ekranı gelirse Sheet erişimi için izin ver. Bu adım `Challenges` sayfasını ve sütunlarını oluşturur. `setup` var olan challenge'ları silmez.
7. **Deploy > New deployment > Select type: Web app**. `Execute as: Me` ve `Who has access: Anyone` (hesabın destekliyorsa) seç. **Deploy** ve gerekiyorsa yetki onayından sonra sana verilen **Web app URL** bağlantısını Gamze'yle paylaş.

> Uygulama GitHub Pages'te değil, **Apps Script Web app URL** üzerinde çalışır. Bunun nedeni `google.script.run` işlevinin Apps Script'in HTML Service ortamına ihtiyaç duymasıdır. GitHub sadece kaynak kodları saklar.

## Sonraki kod güncellemeleri

Apps Script'teki dosyaları güncelledikten sonra **Deploy > Manage deployments > Edit > Version: New version > Deploy** seç. Eski canlı URL aynı kalabilir.

## Sheet veri şeması

`Challenges` sayfası şu sütunları tutar:

| Id | Challenge | AddedBy | CreatedAt | OrayDoneAt | GamzeDoneAt |
|---|---|---|---|---|---|

Tarih alanları boş olabilir. Tamamlanma tarihinde Script'in çalıştığı andaki zaman kaydedilir. Checkbox kaldırılırsa ilgili tarih temizlenir. Kullanıcı, 10/10 tamamlandıktan sonra yeniden işaretleyebilir.

## Güvenlik ve sınırlamalar

- Web app `Execute as: Me` şeklinde yayımlanınca Sheet erişimi uygulama sahibinin hesabı üzerinden gerçekleşir. `Code.gs` PIN ve oturum doğrulaması yapar ve yazma yetkisini sunucu tarafında denetler.
- Bu küçük, kişisel uygulama için PIN koruması bir kolaylıktır; yüksek güvenlik gerektiren veya hassas veriler için tam kullanıcı kimlik doğrulamasının yerini tutmaz.
- PIN giriş denemeleri temel olarak sınırlandırılmıştır. Başarılı giriş sonrası geçici oturum token'ı tarayıcının localStorage alanında tutulur ve sunucu önbelleğinde en fazla yaklaşık 6 saat geçerlidir. Oturum önbelleği daha önce de boşalabilir.
- HTML/JS kaynak kodunu GitHub'da tutmak güvenlidir **yalnızca PIN'leri veya başka gizli anahtarları repoya koymazsan**.
- Web app URL'sini bilen biri giriş ekranını görebilir, ancak iki PIN'den biri olmadan challenge'ları göremez veya düzenleyemez.
- App açık sekmelerde yaklaşık 30 saniyede bir otomatik kontrol yapar; bu **anlık push** senkronizasyon değil, periyodik yenilemedir.
- Google Apps Script/Sheets kota ve erişim kısıtları, Google hesabının türüne göre değişebilir.

## Test planı

1. Oray olarak giriş yap ve challenge #1 ekle.
2. Gamze olarak farklı tarayıcı/telefon üzerinden giriş yap. #1 görünsün, #2'yi ekleyebilsin.
3. Sırası olmayan kişi ekleme yapamasın.
4. 10. challenge eklendikten sonra ekleme alanı kapansın.
5. Oray kendi tamamlanma checkbox'ını değiştirsin; Gamze'nin kutusunu değiştiremesin.
6. Tamamlanma tarihi Google Sheet'e yazılsın ve yeniden açıldığında korunsun.

## Resmî dokümantasyon

- [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web)
- [HTML Service communication (`google.script.run`)](https://developers.google.com/apps-script/guides/html/communication)
- [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
