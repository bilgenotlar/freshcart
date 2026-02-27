# 🛒 FreshCart

Minimalist, hızlı ve akıllı market alışveriş uygulaması.  
PWA olarak çalışır — kurulum gerektirmez, telefona ana ekrana ekleyerek uygulama gibi kullanılır.

🔗 **[bilgenotlar.github.io/freshcart](https://bilgenotlar.github.io/freshcart)**

---

## ✨ Özellikler

### 🛍️ Alışveriş Listesi
- Ürün ekle, market seç, listeye düş
- Market seçilince otomatik ekleme — tek el, hızlı kullanım
- **Market bazlı gruplama** — Migros ürünleri bir arada, BİM ürünleri bir arada
- Ürüne tıkla → sepete al (üstü çizili)
- Alışverişi bitir → geçmişe kaydet

### 🧾 Fiş Arşivi
- Anlık fotoğraf çek, fişi arşivle
- Her fişe market ve tutar gir
- Fişin gerçek tarihini ayarla (geçmiş fişler için)
- **Tarihe göre gruplama** — gün gün görüntüle
- Her günün toplam harcaması otomatik hesaplanır
- Fişe tıkla → tam ekran görüntüle

### 📊 Harcama Özeti
- Toplam harcama ve fiş başı ortalama
- **Aylık harcama grafiği** — çubuk grafikle karşılaştırmalı
- **Markete göre harcama** — en çok nereye para gidiyor

### 📤 WhatsApp Paylaşımı
- Listeyi tek tuşla WhatsApp'a gönder
- Market bazlı gruplandırılmış, okunması kolay format
- Tamamlanan ürünler ✅ işaretiyle görünür

### ⚙️ Diğer
- 🌙 Karanlık / açık mod
- Market listesi özelleştirme (ekle / çıkar)
- Alışveriş geçmişi arşivi
- Tamamen Türkçe arayüz

---

## 📱 Kurulum (PWA)

1. Telefonda Chrome veya Safari ile [bilgenotlar.github.io/freshcart](https://bilgenotlar.github.io/freshcart) adresini aç
2. **"Ana Ekrana Ekle"** seçeneğine dokun
3. Uygulama ikonuyla direkt aç — uygulama mağazası gerekmez!

---

## 🔒 Gizlilik

Tüm veriler **yalnızca kendi cihazında** saklanır:
- Ürün listesi, geçmiş, market ayarları → `localStorage`
- Fiş fotoğrafları → `IndexedDB` (yüzlerce fotoğraf için yeterli alan)

Hiçbir veri sunucuya gönderilmez. İnternet bağlantısı sadece uygulamayı ilk yüklerken gereklidir.

---

## 🛠️ Teknik Detaylar

| | |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite |
| **Stil** | Tailwind CSS |
| **Animasyon** | Framer Motion |
| **İkonlar** | Lucide React |
| **Depolama** | localStorage + IndexedDB |
| **Yayın** | GitHub Pages |

---

## 🚀 Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build al
npm run build
```

---

## 🗺️ Yol Haritası

- [ ] Aile paylaşımı — gerçek zamanlı liste senkronizasyonu (Firebase)
- [ ] Play Store yayını (Capacitor)
- [ ] Alışveriş hatırlatıcısı bildirimi

---

## 📸 Ekran Görüntüleri

> *(Eklenecek)*

---

Geliştiren: [@bilgenotlar](https://github.com/bilgenotlar)
