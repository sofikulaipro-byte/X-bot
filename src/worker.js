// src/worker.js
const { getLatestCMC } = require('./api/cmcNews');
const { summarizeForTweet } = require('./api/gemini');
const { tweet } = require('./api/twitter');
const { isDuplicate, saveTweet } = require('./api/supabase');
const { shortText } = require('./utils');

const POLL_INTERVAL = Number(process.env.POLL_INTERVAL_SECONDS || 300); // default 5m
const MAX_POSTS_PER_CYCLE = Number(process.env.MAX_POSTS_PER_CYCLE || 3);

let running = false;

async function processItem(item){
  const { source_id, title, url, thumbnail, content } = item;
  try {
    const dup = await isDuplicate({ source_id, url, title });
    if(dup){ console.log('duplicate skip:', title); return; }

    const { summary, hashtags } = await summarizeForTweet({ title, url, content });
    const tags = (hashtags || []).slice(0,3).map(h=>`#${h}`).join(' ');
    let text = `${shortText(summary, 200)}\n${tags}\n${url}`;
    if(text.length > Number(process.env.MAX_TWEET_LENGTH || 280)){
      text = `${shortText(summary, 140)}\n${tags}\n${url}`;
    }

    await tweet(text, thumbnail);
    await saveTweet({ source_id, url, title, tweet_text: text });
    console.log('posted:', title);
  } catch(e){
    console.error('processItem err', e.message || e);
  }
}

async function runOnce(){
  try {
    const items = await getLatestCMC(30);
    if(!Array.isArray(items) || items.length===0){ console.log('no news fetched'); return; }
    // prioritize items with thumbnail first
    items.sort((a,b) => (b.thumbnail ? 1:0) - (a.thumbnail ? 1:0));
    let count = 0;
    for(const it of items){
      if(count >= MAX_POSTS_PER_CYCLE) break;
      await processItem(it);
      count++;
      await new Promise(r=>setTimeout(r, 2000));
    }
  } catch(e){
    console.error('runOnce err', e.message || e);
  }
}

function startWorker(){
  if(running) return;
  running = true;
  console.log('Worker started. Poll interval seconds:', POLL_INTERVAL);
  // initial run
  runOnce();
  setInterval(runOnce, POLL_INTERVAL * 1000);
}

module.exports = { startWorker };
