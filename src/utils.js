// src/utils.js
function shortText(s, n=220){
  if(!s) return '';
  return s.length > n ? s.slice(0,n-1) + '…' : s;
}

module.exports = { shortText };
