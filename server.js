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
  let value = process.env[name];
  if (typeof value === 'string') {
    value = value.trim().replace(/^['"]|['"]$/g, '');
  }
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

function normalizeMongoUri(uri) {
  let value = uri.trim().replace(/^['"]|['"]$/g, '');
  // Fix common paste mistake: MONGODB_URI=mongodb://...
  if (value.startsWith('MONGODB_URI=')) {
    value = value.slice('MONGODB_URI='.length);
  }
  return value;
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    console.log('Starting server...');
    console.log(`Node ${process.version}, PORT=${PORT}`);

    let mongoUri = normalizeMongoUri(requireEnv('MONGODB_URI'));

    if (
      !mongoUri.startsWith('mongodb://') &&
      !mongoUri.startsWith('mongodb+srv://')
    ) {
      throw new Error(
        `MONGODB_URI geçersiz. "mongodb://" ile başlamalı. Şu an: "${mongoUri.slice(0, 40)}"`
      );
    }

    requireEnv('SESSION_SECRET');
    requireEnv('ADMIN_USER');
    requireEnv('ADMIN_PASS');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
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
    console.log('Admin ready');

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
