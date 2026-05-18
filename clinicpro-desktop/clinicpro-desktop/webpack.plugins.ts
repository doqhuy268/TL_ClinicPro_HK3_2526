// import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

import { DefinePlugin } from 'webpack';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(__dirname, '.env') });

export const plugins = [
  // Tạm thời vô hiệu hóa ForkTsCheckerWebpackPlugin để tránh lỗi EPIPE
  // new ForkTsCheckerWebpackPlugin({
  //   logger: 'webpack-infrastructure',
  //   typescript: {
  //     configFile: 'tsconfig.json',
  //   },
  //   async: true,
  //   formatter: 'basic',
  // }),
  new DefinePlugin({
    'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'http://localhost:3000'),
    'process.env.WEBSOCKET_URL': JSON.stringify(process.env.WEBSOCKET_URL || 'ws://localhost:3000/counters'),
    'process.env.PASSWORD': JSON.stringify(process.env.PASSWORD || '123456789'),
  }),
];
