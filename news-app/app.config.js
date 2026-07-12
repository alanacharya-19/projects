const fs = require('fs');
const path = require('path');

let newsApiKey = '';
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.trim().match(/^\s*([^#=]+?)\s*=\s*(.+)\s*$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (key === 'NEWS_API_KEY') {
        newsApiKey = val;
      }
    }
  }
}

module.exports = {
  expo: {
    name: 'news-app',
    slug: 'news-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icons/news.png',
    scheme: 'newsapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        UILaunchStoryboardName: 'SplashScreen',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/icons/news.png',
        backgroundImage: './assets/icons/news.png',
        monochromeImage: './assets/icons/news.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/icons/news.png',
    },
    plugins: [
      [
        'expo-router',
        {
          root: 'src/app',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/icons/news.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    extra: {
      newsApiKey,
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
