# Ölüdeniz Social Fest (Electrofest)

Elektro müzik festivali için tek sayfalık tanıtım sitesi ve Node.js admin paneli.

## Kurulum

```bash
npm install
cp .env.example .env   # veya .env dosyasını kendin oluştur
npm run seed           # isteğe bağlı — mevcut veriyi siler
npm run dev
```

## Ortam Değişkenleri

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/electrofest
SESSION_SECRET=guclu-bir-anahtar
ADMIN_USER=admin
ADMIN_PASS=admin123
```

## Adresler

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin
