
import express from 'express';
import dotenv from 'dotenv';
import initDb from './db/init.js';
import authRouter from './routes/auth.js';
import clientsRouter from './routes/clients.js';
import alertsRouter from './routes/alerts.js';
import iocsRouter from './routes/iocs.js';
import profileRouter from './routes/profile.js';
import threatsRouter from './routes/threats.js';
import requireAuth from './middleware/requireAuth.js';
import policyViolationsRouter from './routes/policyViolations.js';
import securityPoliciesRouter from './routes/securityPolicies.js';
import networkChangesRouter from './routes/networkChanges.js';
import { fileURLToPath } from 'url';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

// Build an express Router that implements the API without the `/api` prefix.
// This router can be mounted by the Vite dev server at `/api` or used
// by a standalone express app which mounts it at `/api`.
async function createApiRouter() {
  await initDb();
  const api = express.Router();
  api.use(express.json());

  // Basic health
  api.get('/health', (req, res) => res.json({ ok: true }));

  // Auth routes (no auth required)
  api.use('/auth', authRouter);

  // Protected API routes
  api.use('/clients', requireAuth, clientsRouter);
  api.use('/alerts', requireAuth, alertsRouter);
  api.use('/iocs', requireAuth, iocsRouter);
  api.use('/profile', requireAuth, profileRouter);
  api.use('/threats', requireAuth, threatsRouter);
 
  api.use('/violations',requireAuth, policyViolationsRouter); 
  api.use('/policies', requireAuth,securityPoliciesRouter);
  api.use('/network-changes',requireAuth, networkChangesRouter);

  return api;
}

// If run directly (node server/index.js), start a standalone express server.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      const api = await createApiRouter();
      const app = express();
      app.use('/api', api);

      // If a built frontend exists in ../dist, serve it so API + client are on same port.
      const { existsSync } = await import('fs');
      const distPath = fileURLToPath(new URL('../dist', import.meta.url));
      if (existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(fileURLToPath(new URL('../dist/index.html', import.meta.url)));
        });
        console.log('Serving built frontend from', distPath);
      }

      app.listen(port, () => {
        console.log(`API server listening at http://localhost:${port}`);
      });
    } catch (err) {
      console.error('Failed to initialize DB. Server not started.', err);
      process.exit(1);
    }
  })();
}

export { createApiRouter };
