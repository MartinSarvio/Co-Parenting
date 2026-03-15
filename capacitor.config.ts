import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dk.huska.app',
  appName: 'Huska',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#f2f1ed',
    allowsLinkPreview: false,
  },
  server: {
    cleartext: true,
    allowNavigation: [
      'gyjfvhuukkhmunfeoshu.supabase.co',
      'api.anthropic.com',
      '*.etilbudsavis.dk',
      '*.coop.dk',
      '*.bilka.dk',
      '*.shopgun.com',
      '*.tjek.dk',
      '*.ipaper.io',
      '*.b-cdn.ipaper.io',
    ],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true, // Use native HTTP — bypasses CORS on native platforms
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'none',
      style: 'LIGHT',
    },
  },
};

export default config;
