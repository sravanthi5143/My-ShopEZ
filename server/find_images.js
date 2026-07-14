const https = require('https');

function searchImage(query) {
  return new Promise((resolve, reject) => {
    https.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' official product image')}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const match = data.match(/src="\/iu\/\?u=([^"&]+)/);
        if (match && match[1]) {
          resolve(decodeURIComponent(match[1]));
        } else {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

searchImage('iPhone 15 Pro Max Natural Titanium').then(console.log).catch(console.error);
