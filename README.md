# MyTask - Görev Yönetim Uygulaması

Windows için masaüstü görev yönetim uygulaması.

## Özellikler

- ✅ Aktif ve geçmiş görevler için tab yapısı
- ✅ Yeni görev oluşturma
- ✅ Görev detaylarını görüntüleme
- ✅ Görevleri tamamlama
- ✅ Öncelik seviyeleri (Düşük, Orta, Yüksek)
- ✅ Kategori sistemi
- ✅ Otomatik tarih ataması
- ✅ Modern ve kullanıcı dostu arayüz

## Kurulum ve Çalıştırma

### Gereksinimler

- Node.js (v16 veya üzeri)

### Adımlar

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Uygulamayı geliştirme modunda çalıştırın:

```bash
npm start
```

3. Tek exe dosyası olarak derleyin:

```bash
npm run build:win
```

Derlenen `.exe` dosyası `dist` klasöründe olacaktır.

## Kullanım

1. **Yeni Görev Oluşturma**: Sağ üst köşedeki "Yeni Görev" butonuna tıklayın
2. **Görev Detayları**: Herhangi bir görevin üzerine tıklayarak detaylarını görüntüleyin
3. **Görev Tamamlama**: Görev detay penceresindeki "Görevi Tamamla" butonuna tıklayın
4. **Tablar Arası Geçiş**: "Aktif Görevler" ve "Geçmiş Görevler" tabları arasında geçiş yapın

## Teknolojiler

- Electron - Masaüstü uygulama framework'ü
- Vanilla JavaScript - Frontend mantığı
- electron-store - Veri saklama
- HTML/CSS - Arayüz tasarımı

## Lisans

MIT
