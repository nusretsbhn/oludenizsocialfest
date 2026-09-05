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
const PORT = Number(process.env.PORT) || 3000;

let ready = false;
let bootError = null;

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

app.get('/health', (req, res) => {
  if (ready) {
    return res.status(200).send('ok');
  }
  res.status(503).send(bootError || 'starting');
});

async function boot() {
  try {
    console.log('Starting server...');
    console.log(`Node ${process.version}, PORT=${PORT}`);
    console.log('Env keys:', Object.keys(process.env).filter((k) =>
      ['PORT', 'MONGODB_URI', 'SESSION_SECRET', 'ADMIN_USER', 'ADMIN_PASS'].includes(k)
    ).join(', ') || '(none of expected keys)');

    let mongoUri = normalizeMongoUri(requireEnv('MONGODB_URI'));
    console.log('Mongo host preview:', mongoUri.replace(/\/\/.*@/, '//***@').slice(0, 80));

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
      serverSelectionTimeoutMS: 20000,
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

    app.use('/', indexRouter);
    app.use('/admin', adminRouter);

    app.use((req, res) => {
      res.status(404).send('Sayfa bulunamadı');
    });

    ready = true;
    console.log('App ready');
  } catch (err) {
    bootError = err.message;
    console.error('Failed to boot app:', err.message);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP listening on http://0.0.0.0:${PORT}`);
  boot();
});
