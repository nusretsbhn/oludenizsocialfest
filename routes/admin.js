const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { requireAuth } = require('../middleware/auth');
const Artist = require('../models/Artist');
const ScheduleItem = require('../models/ScheduleItem');
const Ticket = require('../models/Ticket');
const GalleryImage = require('../models/GalleryImage');
const Sponsor = require('../models/Sponsor');
const Settings = require('../models/Settings');
const MenuItem = require('../models/MenuItem');
const FeedVideo = require('../models/FeedVideo');

const router = express.Router();

let adminPassHash;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece video dosyaları yüklenebilir'));
    }
  },
});

function zipFeatures(texts, included) {
  if (!texts) return [];

  const textArr = Array.isArray(texts) ? texts : [texts];
  const includedArr = Array.isArray(included)
    ? included
    : included
      ? [included]
      : [];

  return textArr
    .map((text, i) => ({
      text: String(text).trim(),
      included:
        includedArr[i] === 'on' ||
        includedArr[i] === 'true' ||
        includedArr[i] === true,
    }))
    .filter((f) => f.text);
}

function removeUpload(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;

  const filePath = path.join(__dirname, '../public', imagePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function initAdmin() {
  adminPassHash = await bcrypt.hash(process.env.ADMIN_PASS, 10);
}

router.get('/login', (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username === process.env.ADMIN_USER &&
      (await bcrypt.compare(password, adminPassHash))
    ) {
      req.session.isAdmin = true;
      return res.redirect('/admin');
    }

    res.render('admin/login', { error: 'Geçersiz kullanıcı adı veya şifre' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const [artists, schedule, tickets, gallery] = await Promise.all([
      Artist.countDocuments(),
      ScheduleItem.countDocuments(),
      Ticket.countDocuments(),
      GalleryImage.countDocuments(),
    ]);

    res.render('admin/dashboard', {
      stats: { artists, schedule, tickets, gallery },
      success: req.query.success,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/artists', requireAuth, async (req, res) => {
  try {
    const artists = await Artist.find().sort({ order: 1 });
    res.render('admin/artists', { artists, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post(
  '/artists',
  requireAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      await Artist.create({
        name: req.body.name,
        role: req.body.role,
        image: req.file ? `/uploads/${req.file.filename}` : '',
        featured: req.body.featured === 'on',
        order: Number(req.body.order) || 0,
      });
      res.redirect('/admin/artists?success=1');
    } catch (err) {
      console.error(err);
      res.status(500).send('Sunucu hatası');
    }
  }
);

router.post(
  '/artists/:id',
  requireAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      const artist = await Artist.findById(req.params.id);
      if (!artist) return res.status(404).send('Sayfa bulunamadı');

      if (req.file) {
        removeUpload(artist.image);
        artist.image = `/uploads/${req.file.filename}`;
      }

      artist.name = req.body.name;
      artist.role = req.body.role;
      artist.featured = req.body.featured === 'on';
      artist.order = Number(req.body.order) || 0;
      await artist.save();

      res.redirect('/admin/artists?success=1');
    } catch (err) {
      console.error(err);
      res.status(500).send('Sunucu hatası');
    }
  }
);

router.post('/artists/:id/delete', requireAuth, async (req, res) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (artist) removeUpload(artist.image);
    res.redirect('/admin/artists?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/schedule', requireAuth, async (req, res) => {
  try {
    const items = await ScheduleItem.find().sort({ day: 1, order: 1 });
    const scheduleByDay = items.reduce((acc, item) => {
      if (!acc[item.day]) acc[item.day] = [];
      acc[item.day].push(item);
      return acc;
    }, {});
    res.render('admin/schedule', {
      scheduleByDay,
      success: req.query.success,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/schedule', requireAuth, async (req, res) => {
  try {
    await ScheduleItem.create({
      day: Number(req.body.day),
      date: req.body.date,
      artistName: req.body.artistName,
      startTime: req.body.startTime,
      stage: req.body.stage,
      order: Number(req.body.order) || 0,
    });
    res.redirect('/admin/schedule?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/schedule/:id/delete', requireAuth, async (req, res) => {
  try {
    await ScheduleItem.findByIdAndDelete(req.params.id);
    res.redirect('/admin/schedule?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ order: 1 });
    res.render('admin/tickets', { tickets, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/tickets', requireAuth, async (req, res) => {
  try {
    await Ticket.create({
      name: req.body.name,
      price: Number(req.body.price),
      features: zipFeatures(req.body.featureTexts, req.body.featureIncluded),
      highlighted: req.body.highlighted === 'on',
      buyUrl: req.body.buyUrl,
      order: Number(req.body.order) || 0,
    });
    res.redirect('/admin/tickets?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/tickets/:id', requireAuth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Sayfa bulunamadı');

    ticket.name = req.body.name;
    ticket.price = Number(req.body.price);
    ticket.features = zipFeatures(
      req.body.featureTexts,
      req.body.featureIncluded
    );
    ticket.highlighted = req.body.highlighted === 'on';
    ticket.buyUrl = req.body.buyUrl;
    ticket.order = Number(req.body.order) || 0;
    await ticket.save();

    res.redirect('/admin/tickets?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/tickets/:id/delete', requireAuth, async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.redirect('/admin/tickets?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/gallery', requireAuth, async (req, res) => {
  try {
    const gallery = await GalleryImage.find().sort({ order: 1 });
    res.render('admin/gallery', { gallery, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post(
  '/gallery',
  requireAuth,
  upload.array('images', 50),
  async (req, res) => {
    try {
      const files = req.files || [];
      const baseOrder = Number(req.body.order) || 0;

      await Promise.all(
        files.map((file, i) =>
          GalleryImage.create({
            image: `/uploads/${file.filename}`,
            caption: req.body.caption || '',
            order: baseOrder + i,
          })
        )
      );

      res.redirect('/admin/gallery?success=1');
    } catch (err) {
      console.error(err);
      res.status(500).send('Sunucu hatası');
    }
  }
);

router.post('/gallery/:id/delete', requireAuth, async (req, res) => {
  try {
    const image = await GalleryImage.findByIdAndDelete(req.params.id);
    if (image) removeUpload(image.image);
    res.redirect('/admin/gallery?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/videos', requireAuth, async (req, res) => {
  try {
    const videos = await FeedVideo.find().sort({ order: 1 });
    res.render('admin/videos', { videos, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post(
  '/videos',
  requireAuth,
  videoUpload.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.redirect('/admin/videos?success=0');
      }
      await FeedVideo.create({
        video: `/uploads/${req.file.filename}`,
        caption: req.body.caption || '',
        order: Number(req.body.order) || 0,
      });
      res.redirect('/admin/videos?success=1');
    } catch (err) {
      console.error(err);
      res.status(500).send('Sunucu hatası');
    }
  }
);

router.post('/videos/:id/delete', requireAuth, async (req, res) => {
  try {
    const item = await FeedVideo.findByIdAndDelete(req.params.id);
    if (item) removeUpload(item.video);
    res.redirect('/admin/videos?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/sponsors', requireAuth, async (req, res) => {
  try {
    const sponsors = await Sponsor.find().sort({ order: 1 });
    res.render('admin/sponsors', { sponsors, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post(
  '/sponsors',
  requireAuth,
  upload.single('logo'),
  async (req, res) => {
    try {
      await Sponsor.create({
        name: req.body.name,
        logo: req.file ? `/uploads/${req.file.filename}` : '',
        url: req.body.url,
        order: Number(req.body.order) || 0,
      });
      res.redirect('/admin/sponsors?success=1');
    } catch (err) {
      console.error(err);
      res.status(500).send('Sunucu hatası');
    }
  }
);

router.post('/sponsors/:id/delete', requireAuth, async (req, res) => {
  try {
    const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
    if (sponsor) removeUpload(sponsor.logo);
    res.redirect('/admin/sponsors?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/banner', requireAuth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.render('admin/banner', { settings, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post(
  '/banner',
  requireAuth,
  upload.single('heroImage'),
  async (req, res) => {
    try {
      const current = await Settings.getSettings();
      const data = {
        heroTitle1: req.body.heroTitle1,
        heroTitle2: req.body.heroTitle2,
        heroSubtitle: req.body.heroSubtitle,
      };

      if (req.file) {
        removeUpload(current.heroImage);
        data.heroImage = `/uploads/${req.file.filename}`;
      }

      await Settings.updateSettings(data);
      res.redirect('/admin/banner?success=1');
    } catch (err) {
      console.error(err);
      res.status(500).send('Sunucu hatası');
    }
  }
);

router.get('/menu', requireAuth, async (req, res) => {
  try {
    const menuItems = await MenuItem.find().sort({ order: 1 });
    res.render('admin/menu', { menuItems, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/menu', requireAuth, async (req, res) => {
  try {
    await MenuItem.create({
      label: req.body.label,
      href: req.body.href,
      order: Number(req.body.order) || 0,
      isCta: req.body.isCta === 'on',
    });
    res.redirect('/admin/menu?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/menu/:id', requireAuth, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).send('Sayfa bulunamadı');

    item.label = req.body.label;
    item.href = req.body.href;
    item.order = Number(req.body.order) || 0;
    item.isCta = req.body.isCta === 'on';
    await item.save();

    res.redirect('/admin/menu?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post('/menu/:id/delete', requireAuth, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.redirect('/admin/menu?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.get('/settings', requireAuth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.render('admin/settings', { settings, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

router.post(
  '/settings',
  requireAuth,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const current = await Settings.getSettings();
      const data = { ...req.body };

      if (req.files?.logo?.[0]) {
        removeUpload(current.logo);
        data.logo = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files?.favicon?.[0]) {
        removeUpload(current.favicon);
        data.favicon = `/uploads/${req.files.favicon[0].filename}`;
      }
      await Settings.updateSettings(data);
      res.redirect('/admin/settings?success=1');
    } catch (err) {
      console.error(err);
      res.status(500).send('Sunucu hatası');
    }
  }
);

module.exports = { router, initAdmin };
