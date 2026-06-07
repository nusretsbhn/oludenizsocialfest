const express = require('express');

const Artist = require('../models/Artist');
const ScheduleItem = require('../models/ScheduleItem');
const Ticket = require('../models/Ticket');
const GalleryImage = require('../models/GalleryImage');
const Sponsor = require('../models/Sponsor');
const Settings = require('../models/Settings');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

const defaultSettings = {
  festivalName: 'Electrofest',
  heroTitle1: 'Elektro Füzyon',
  heroTitle2: 'Ritmi Hisset',
  heroSubtitle: 'Enerjiyi Hisset',
  eventDate: '20-24 Aralık 2026',
  venue: 'Festival Alanı',
  venueCity: 'Ölüdeniz, Muğla',
  countdownDate: '2026-12-20',
  countdownTime: '20:00',
  footerText: 'Eşsiz bir elektro müzik deneyimi.',
  metaDescription: 'Electrofest — elektro müzik festivali',
};

router.get('/', async (req, res) => {
  try {
    const [settings, menuItems, artists, scheduleItems, tickets, gallery, sponsors] =
      await Promise.all([
        Settings.findOne(),
        MenuItem.find().sort({ order: 1 }),
        Artist.find().sort({ order: 1 }),
        ScheduleItem.find().sort({ day: 1, order: 1 }),
        Ticket.find().sort({ order: 1 }),
        GalleryImage.find().sort({ order: 1 }),
        Sponsor.find().sort({ order: 1 }),
      ]);

    const scheduleByDay = scheduleItems.reduce((acc, item) => {
      if (!acc[item.day]) acc[item.day] = [];
      acc[item.day].push(item);
      return acc;
    }, {});

    res.render('index', {
      settings: settings
        ? { ...defaultSettings, ...settings.toObject() }
        : defaultSettings,
      menuItems,
      artists,
      scheduleByDay,
      tickets,
      gallery,
      sponsors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
