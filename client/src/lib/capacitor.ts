import { Capacitor } from '@capacitor/core';

/**
 * Initialize native Capacitor plugins when running inside a native app shell.
 * This is a no-op in the browser.
 */
export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Running in browser mode');
    return;
  }

  console.log('📱 Running in native mode:', Capacitor.getPlatform());

  try {
    // Dynamically import native plugins to avoid errors in browser
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { SplashScreen } = await import('@capacitor/splash-screen');

    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });

    // Hide splash screen after app is ready
    await SplashScreen.hide();

    console.log('✅ Native plugins initialized');
  } catch (error) {
    console.warn('⚠️ Native plugin initialization error:', error);
  }
}
