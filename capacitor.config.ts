import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dk.hverdag.app',
  appName: 'Hverdag',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#f2f1ed',
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
