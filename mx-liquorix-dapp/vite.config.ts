import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgrPlugin from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
    host: true,
    https: true,
    proxy: {
      '/api-xoxno': {
        target: 'https://devnet-api.xoxno.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-xoxno/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Origin', 'https://devnet.xoxno.com');
            proxyReq.setHeader('Referer', 'https://devnet.xoxno.com/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          });
        }
      },
      '/api-xoxno-mainnet': {
        target: 'https://api.xoxno.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-xoxno-mainnet/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Origin', 'https://xoxno.com');
            proxyReq.setHeader('Referer', 'https://xoxno.com/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Cache-Control', 'max-age=0');
            proxyReq.setHeader('Sec-Ch-Ua', '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"');
            proxyReq.setHeader('Sec-Ch-Ua-Mobile', '?0');
            proxyReq.setHeader('Sec-Ch-Ua-Platform', '"macOS"');
            proxyReq.setHeader('Sec-Fetch-Dest', 'document');
            proxyReq.setHeader('Sec-Fetch-Mode', 'navigate');
            proxyReq.setHeader('Sec-Fetch-Site', 'none');
            proxyReq.setHeader('Sec-Fetch-User', '?1');
            proxyReq.setHeader('Upgrade-Insecure-Requests', '1');
          });
        }
      },
      // Keep existing proxy if any, but there is none in file view
    },
    watch: {
      usePolling: false,
      useFsEvents: false,
      ignored: ['**/.cache/**']
    },
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    basicSsl(),
    tsconfigPaths(),
    svgrPlugin({
      svgrOptions: {
        exportType: 'named',
        ref: true,
        titleProp: true,
        svgo: false
      },
      include: '**/*.svg'
    }),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true }
    })
  ],
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    outDir: 'build'
  },
  preview: {
    port: 3002,
    https: true,
    host: 'localhost',
    strictPort: true
  }
});
