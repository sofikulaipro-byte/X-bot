// src/api/gemini.js
const axios = require('axios');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function summarizeForTweet({ title, url, content }) {
  const prompt = `
You are a friendly crypto news writer. Produce JSON exactly like:
{"summary":"...","hashtags":["tag1","tag2"]}

Title: ${title}
URL: ${url}
Content:
${(content||'').slice(0,1800)}
  `;
  try {
    const res = await axios.post(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // parse JSON substring
    let parsed;
    try { parsed = JSON.parse(text); }
    catch(e){
      const m = text.match(/(\{[\s\S]*\})/);
      parsed = m ? JSON.parse(m[1]) : { summary: text.slice(0,220), hashtags: [] };
    }
    return {
      summary: (parsed.summary || parsed.text || '').slice(0, 220),
      hashtags: (parsed.hashtags || []).slice(0,3).map(h => h.replace(/^#/, '').replace(/\s+/g,'')) 
    };
  } catch (err) {
    console.error('Gemini error:', err?.response?.data || err?.message);
    return { summary: (title + ' ' + (content||'')).slice(0,220), hashtags: [] };
  }
}

module.exports = { summarizeForTweet };
