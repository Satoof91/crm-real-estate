import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propmanager.crm',
  appName: 'PropManager',
  webDir: 'dist/public',
  server: {
    // For production: the Android/iOS WebView uses https scheme
    androidScheme: 'https',
    iosScheme: 'https',
    // Uncomment below for live reload during development:
    // url: 'http://192.168.x.x:5000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      backgroundColor: '#0f172a',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
  },
};

export default config;
