require('dotenv').config();

const mongoose = require('mongoose');

const Artist = require('./models/Artist');
const ScheduleItem = require('./models/ScheduleItem');
const Ticket = require('./models/Ticket');
const GalleryImage = require('./models/GalleryImage');
const Sponsor = require('./models/Sponsor');
const Settings = require('./models/Settings');
const MenuItem = require('./models/MenuItem');

const artistNames = ['DJ Neurogenic', 'DJ Phenomenic', 'DJ Fritz'];
const dayDates = [
  '20 Aralık 2026',
  '21 Aralık 2026',
  '22 Aralık 2026',
  '23 Aralık 2026',
  '24 Aralık 2026',
];
const startTimes = ['18:00', '19:30', '21:00', '22:30', '00:00'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const models = [Artist, ScheduleItem, Ticket, GalleryImage, Sponsor, Settings, MenuItem];
  await Promise.all(models.map((model) => model.deleteMany({}).catch(() => {})));

  await Settings.create({
    festivalName: 'Electrofest',
    heroTitle1: 'Elektro Füzyon',
    heroTitle2: 'Ritmi Hisset',
    heroSubtitle: 'Enerjiyi Hisset',
    eventDate: '20-24 Aralık 2026',
    venue: 'Festival Alanı',
    venueCity: 'Ölüdeniz, Muğla',
    countdownDate: '2026-12-20',
    countdownTime: '20:00',
    contactEmail: 'info@electrofest.com',
    footerText: 'Eşsiz bir elektro müzik deneyimi.',
    metaDescription: 'Electrofest — Ölüdeniz elektro müzik festivali',
  });

  await Artist.insertMany([
    { name: 'DJ Neurogenic', role: 'DJ', featured: true, order: 1 },
    { name: 'DJ Phenomenic', role: 'DJ', featured: true, order: 2 },
    { name: 'DJ Fritz', role: 'Canlı Performans', featured: true, order: 3 },
  ]);

  const scheduleItems = [];
  for (let day = 1; day <= 5; day++) {
    for (let i = 0; i < 5; i++) {
      scheduleItems.push({
        day,
        date: dayDates[day - 1],
        artistName: artistNames[i % artistNames.length],
        startTime: startTimes[i],
        stage: i % 2 === 0 ? 'Ana Sahne' : 'Neon Sahne',
        order: i + 1,
      });
    }
  }
  await ScheduleItem.insertMany(scheduleItems);

  await Ticket.create({
    name: 'Festival Bileti',
    price: 89.89,
    order: 1,
    buyUrl: '#',
    highlighted: true,
    features: [
      { text: 'Tüm festivale erişim', included: true },
      { text: 'Tüm sahne performansları', included: true },
      { text: 'Yeme-içme alanı erişimi', included: true },
      { text: 'VIP lounge', included: true },
      { text: 'Kulis geçişi', included: true },
    ],
  });

  await Sponsor.create({
    name: 'ElectroSound',
    url: 'https://example.com',
    order: 1,
  });

  await MenuItem.insertMany([
    { label: 'Sanatçılar', href: '#section-artists', order: 1, isCta: false },
    { label: 'Program', href: '#section-schedule', order: 2, isCta: false },
    { label: 'Biletler', href: '#section-tickets', order: 3, isCta: false },
    { label: 'Galeri', href: '#section-gallery', order: 4, isCta: false },
    { label: 'Sponsorlar', href: '#section-sponsors', order: 5, isCta: false },
    { label: 'Bilet Al', href: '#section-tickets', order: 6, isCta: true },
  ]);

  console.log('Örnek veriler yüklendi');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
