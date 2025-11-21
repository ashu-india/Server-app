// @ts-nocheck
// 
import { defineConfig, loadEnv } from 'vite';
import type { ViteDevServer, Plugin, Connect } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const env = loadEnv(mode, process.cwd(), '');
  
  function expressApiPlugin(): Plugin {
    return {
      name: 'express-api-plugin',
      configureServer: async (server: ViteDevServer) => {
        try {
          const mod = await import('./server/index.js');
          const hasCreate = !!(mod?.createApiRouter && typeof mod.createApiRouter === 'function');
          const serverModule = hasCreate ? mod : mod?.default ?? mod;
          
          if (!serverModule?.createApiRouter) {
            console.warn('⚠️  express-api-plugin: server/index.js does not export createApiRouter');
            return;
          }
          
          const apiRouter = await serverModule.createApiRouter();
          const devApp = express();
          devApp.use(express.json());
          devApp.use('/api', apiRouter);
          
          // Type-safe middleware integration
          server.middlewares.use(
            (
              req: Connect.IncomingMessage,
              res: Connect.ServerResponse,
              next: Connect.NextFunction
            ) => {
              // Cast to Express types for the handler
              (devApp as any)(req, res, next);
            }
          );
          
          console.log('✅ Express API mounted at /api');
        } catch (err) {
          console.error('❌ Failed to mount API router:', err);
        }
      }
    };
  }

  const plugins: Plugin[] = [react()];
  
  if (isDev) {
    plugins.push(expressApiPlugin());
  }

  return {
    plugins,
    
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    
    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: parseInt(env.VITE_DEV_PORT) || 5173,
      strictPort: false,
      hmr: true,
      
      watch: env.VITE_USE_POLLING === 'true' ? {
        usePolling: true,
        interval: 1000,
      } : undefined,
    },
    
    build: {
      outDir: 'dist',
      sourcemap: isDev,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV || mode),
    },
  };
});