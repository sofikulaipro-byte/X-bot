// index.js
require('dotenv').config();
const express = require('express');
const { startWorker } = require('./src/worker');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => res.send({ status: 'ok', ts: Date.now() }));

app.get('/', (req, res) => res.send('Crypto News Bot - running'));

app.listen(PORT, () => {
  console.log(`Health server listening on ${PORT}`);
  // start the worker after server up
  startWorker();
});
