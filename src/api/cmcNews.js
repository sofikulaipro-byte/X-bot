// src/api/cmcNews.js
const axios = require('axios');

async function getLatestCMC(limit = 20) {
  const key = process.env.CMC_API_KEY;
  if (!key) {
    console.warn('CMC_API_KEY not set');
    return [];
  }
  try {
    const res = await axios.get('https://pro-api.coinmarketcap.com/v1/content/latest', {
      headers: { 'X-CMC_PRO_API_KEY': key, Accept: 'application/json' },
      params: { limit, start: 1 }
    });
    // res.data.data is array of items depending on plan
    const items = res.data?.data || [];
    return items.map(it => ({
      source: 'coinmarketcap',
      source_id: it.id || it.url,
      title: it.title || it.name,
      url: it.url || null,
      thumbnail: it.thumb_2x || it.thumb || it.featured_image || null,
      content: (it.body || it.description || '').toString()
    }));
  } catch (err) {
    console.error('getLatestCMC error:', err?.response?.data || err?.message);
    return [];
  }
}

module.exports = { getLatestCMC };
