require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');

const indexRouter = require('./routes/index');
const { router: adminRouter, initAdmin } = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: process.env.MONGODB_URI,
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24,
        },
      })
    );

    await initAdmin();
    app.use('/', indexRouter);
    app.use('/admin', adminRouter);

    app.use((req, res) => {
      res.status(404).send('Sayfa bulunamadı');
    });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    console.error(
      'MongoDB is not reachable. Start MongoDB or update MONGODB_URI in .env'
    );
    process.exit(1);
  }
}

start();
