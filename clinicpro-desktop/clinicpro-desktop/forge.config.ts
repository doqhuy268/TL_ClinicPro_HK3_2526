import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

// Load .env file
dotenvConfig({ path: resolve(__dirname, '.env') });

// Extract API URL from env for CSP
const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
const wsUrl = process.env.WEBSOCKET_URL || 'ws://localhost:3000/counters';

// Parse domain from URLs for CSP
const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
};

const apiDomain = getDomainFromUrl(apiUrl);
// Extract WebSocket domain (protocol + host only)
const getWsDomain = (url: string): string => {
  try {
    if (url.startsWith('wss://')) {
      const host = url.replace('wss://', '').split('/')[0];
      return `wss://${host}`;
    } else if (url.startsWith('ws://')) {
      const host = url.replace('ws://', '').split('/')[0];
      return `ws://${host}`;
    }
    return url;
  } catch {
    return url;
  }
};
const wsDomain = getWsDomain(wsUrl);

// Get port from environment variable, default to 9000
const webpackPort = parseInt(process.env.PORT || '9000', 10);
const loggerPort = webpackPort + 1;

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extendInfo: 'macos/Info.plist',
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      port: webpackPort,
      loggerPort: loggerPort,
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
      devContentSecurityPolicy:
        "default-src 'self' data:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // dev cần 'unsafe-eval' vì source maps
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "font-src 'self' data:; " +
        `connect-src 'self' ${apiDomain} ${wsDomain} http://localhost:3000 ws://localhost:3000 https://api.clinicpro.io.vn wss://api.clinicpro.io.vn`,
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;

