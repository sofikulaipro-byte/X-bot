// src/api/supabase.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function fingerprint(id, url, title){
  return id || (url ? url : (title||'')).slice(0,200);
}

async function isDuplicate({ source_id, url, title }){
  if(!supabase) return false;
  try {
    const fp = fingerprint(source_id, url, title);
    const { data } = await supabase.from('tweets').select('id').eq('news_id', fp).limit(1);
    return Array.isArray(data) && data.length > 0;
  } catch (e) {
    console.error('supabase isDuplicate err', e.message);
    return false;
  }
}

async function saveTweet({ source_id, url, title, tweet_text, posted_at }){
  if(!supabase) return false;
  try {
    const fp = fingerprint(source_id, url, title);
    const payload = { news_id: fp, tweet_text, link: url, title, posted_at: posted_at || new Date().toISOString() };
    const { error } = await supabase.from('tweets').upsert(payload, { onConflict: 'news_id' });
    if(error) throw error;
    return true;
  } catch(e){
    console.error('supabase saveTweet err', e.message);
    return false;
  }
}

module.exports = { isDuplicate, saveTweet };
