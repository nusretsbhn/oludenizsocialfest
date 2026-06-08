const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    festivalName: String,
    siteTitle: String,
    logo: String,
    favicon: String,
    heroImage: String,
    countdownDate: String,
    countdownTime: String,
    heroTitle1: String,
    heroTitle2: String,
    heroSubtitle: String,
    eventDate: String,
    venue: String,
    venueCity: String,
    contactAddress: String,
    contactPhone: String,
    contactEmail: String,
    footerText: String,
    socialFacebook: String,
    socialInstagram: String,
    socialTwitter: String,
    socialYoutube: String,
    metaDescription: String,
  },
  { timestamps: true }
);

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function (data) {
  return this.findOneAndUpdate({}, data, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
};

module.exports = mongoose.model('Settings', settingsSchema);
