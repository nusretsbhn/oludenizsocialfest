const nodeCrypto = require('crypto');
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = nodeCrypto.webcrypto;
}

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');

const indexRouter = require('./routes/index');
const { router: adminRouter, initAdmin } = require('./routes/admin');

const app = express();

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    const mongoUri = requireEnv('MONGODB_URI');

    if (
      !mongoUri.startsWith('mongodb://') &&
      !mongoUri.startsWith('mongodb+srv://')
    ) {
      throw new Error(
        `MONGODB_URI geçersiz. "mongodb://" ile başlamalı. Şu an: "${mongoUri.slice(0, 30)}..."`
      );
    }

    requireEnv('SESSION_SECRET');
    requireEnv('ADMIN_USER');
    requireEnv('ADMIN_PASS');

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    app.use(
      session({
        secret: process.env.SESSION_SECRET.trim(),
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          client: mongoose.connection.getClient(),
          dbName: 'electrofest',
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24,
        },
      })
    );

    await initAdmin();

    app.get('/health', (req, res) => {
      res.status(200).send('ok');
    });

    app.use('/', indexRouter);
    app.use('/admin', adminRouter);

    app.use((req, res) => {
      res.status(404).send('Sayfa bulunamadı');
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
