const fs = require('fs');
const path = require('path');

const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.trim().match(/^\s*([^#=]+?)\s*=\s*(.+)\s*$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (key === 'NEWS_API_KEY') {
        appJson.expo.extra = appJson.expo.extra || {};
        appJson.expo.extra.newsApiKey = val;
      }
    }
  }
}

module.exports = appJson;
