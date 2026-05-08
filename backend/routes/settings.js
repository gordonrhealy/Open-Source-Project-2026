const express = require('express');
const router = express.Router();
const authRequired = require('../middleware_auth');
const User = require('../models/User');

router.use(authRequired);

const allowedThemes = ['light', 'dark', 'auto'];
const allowedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ar', 'bn'];
const allowedCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'];

function settingsPayload(user) {
  return {
    preferences: {
      theme: user.preferences?.theme || 'auto',
      language: user.preferences?.language || 'en',
      currency: user.preferences?.currency || 'EUR',
      dateFormat: user.preferences?.dateFormat || 'DD/MM/YYYY'
    },
    location: {
      country: user.profile?.location?.country || '',
      city: user.profile?.location?.city || '',
      timezone: user.profile?.location?.timezone || 'UTC'
    },
    options: {
      themes: allowedThemes,
      languages: allowedLanguages,
      currencies: allowedCurrencies
    }
  };
}

router.get('/', async (req, res) => {
  res.json(settingsPayload(req.user));
});

router.put('/', async (req, res) => {
  try {
    const { theme, language, currency, country, city, timezone, dateFormat } = req.body;
    const update = {};

    if (theme) {
      if (!allowedThemes.includes(theme)) return res.status(400).json({ error: 'Invalid theme option' });
      update['preferences.theme'] = theme;
    }
    if (language) {
      if (!allowedLanguages.includes(language)) return res.status(400).json({ error: 'Invalid language option' });
      update['preferences.language'] = language;
    }
    if (currency) {
      if (!allowedCurrencies.includes(currency)) return res.status(400).json({ error: 'Invalid currency option' });
      update['preferences.currency'] = currency;
    }
    if (dateFormat) update['preferences.dateFormat'] = dateFormat;
    if (country !== undefined) update['profile.location.country'] = country;
    if (city !== undefined) update['profile.location.city'] = city;
    if (timezone !== undefined) update['profile.location.timezone'] = timezone || 'UTC';

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password -security -oauthProviders');
    res.json({ message: 'Settings saved', ...settingsPayload(user) });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
