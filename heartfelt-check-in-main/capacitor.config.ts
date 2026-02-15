import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.knightleeron.state',
  appName: 'STATE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
