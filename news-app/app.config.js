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
      bundleIdentifier: 'com.alanacharya1.newsapp',
      supportsTablet: true,
      infoPlist: {
        UILaunchStoryboardName: 'SplashScreen',
      },
    },
    android: {
      package: 'com.alanacharya1.newsapp',
      adaptiveIcon: {
        backgroundColor: '#c62828',
        foregroundImage: './assets/icons/news.png',
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
          imageWidth: 150,
          resizeMode: 'contain',
          backgroundColor: '#c62828',
          dark: {
            image: './assets/icons/news.png',
            backgroundColor: '#b71c1c',
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '3982c3c8-19ea-4339-84ab-cb16f6f3ea02',
      },
      newsApiKey,
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
