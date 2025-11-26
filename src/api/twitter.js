// src/api/twitter.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');

let client;
function getClient(){
  if(client) return client;
  client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
  });
  return client;
}

async function downloadTemp(url){
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    const ext = path.extname(url.split('?')[0]) || '.jpg';
    const tmp = path.join(os.tmpdir(), `img_${Date.now()}${ext}`);
    fs.writeFileSync(tmp, Buffer.from(res.data));
    return tmp;
  } catch(e) {
    console.log('downloadTemp error', e.message);
    return null;
  }
}

async function uploadImage(url){
  const tmp = await downloadTemp(url);
  if(!tmp) return null;
  try {
    const v1 = getClient().v1;
    const mediaId = await v1.uploadMedia(tmp);
    try{ fs.unlinkSync(tmp); } catch(e){}
    return mediaId;
  } catch(e){
    console.log('uploadImage error', e.message);
    try{ fs.unlinkSync(tmp); } catch(e){}
    return null;
  }
}

async function tweet(text, imageUrl){
  const v2 = getClient().v2;
  let media_ids = [];
  if(imageUrl){
    const id = await uploadImage(imageUrl);
    if(id) media_ids.push(id);
  }
  const params = {};
  if(media_ids.length) params.media = { media_ids };
  return v2.tweet(text, params);
}

module.exports = { tweet };
