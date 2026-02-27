# 🛒 FreshCart

Minimalist, hızlı ve akıllı market alışveriş uygulaması.  
PWA olarak çalışır — kurulum gerektirmez, telefona ana ekrana ekleyerek uygulama gibi kullanılır.

🔗 **[bilgenotlar.github.io/freshcart](https://bilgenotlar.github.io/freshcart)**

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

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

1. Telefonda Chrome veya Safari ile adresi aç
2. **"Ana Ekrana Ekle"** seçeneğine dokun
3. Uygulama ikonuyla direkt aç — uygulama mağazası gerekmez!

---

## 🔒 Gizlilik

Tüm veriler **yalnızca kendi cihazında** saklanır:
- Ürün listesi, geçmiş, market ayarları → `localStorage`
- Fiş fotoğrafları → `IndexedDB` (yüzlerce fotoğraf için yeterli alan)

Hiçbir veri sunucuya gönderilmez.

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
npm install
npm run dev
npm run build
```

---

## 📄 Lisans

Bu proje [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) lisansı ile korunmaktadır.  
Ticari amaçla kullanılamaz. Kaynak göstererek paylaşılabilir.

---

Geliştiren: [@bilgenotlar](https://github.com/bilgenotlar)
