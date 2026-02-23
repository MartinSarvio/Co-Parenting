import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dk.hverdag.app',
  appName: 'Hverdag',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#fef8f0',
    allowsLinkPreview: false,
  },
  server: {
    allowNavigation: ['sa.up.railway.app'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true, // Use native HTTP — bypasses CORS on native platforms
    },
  },
};

export default config;
