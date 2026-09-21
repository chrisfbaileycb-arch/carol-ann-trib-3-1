import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getAdminBackend } from './server/lib/firebaseAdmin.js';
import firebaseConfig from './firebase-applet-config.json';
import { registerCloudStateRoutes } from './server/routes/cloudState.js';
import { registerInferenceRoutes } from './server/routes/inference.js';
import { registerBrowserRoutes } from './server/routes/browser.js';
import { registerTtsRoutes } from './server/routes/tts.js';
import { registerConnectorRoutes } from './server/routes/connectors.js';
import { attachLiveVoice } from './server/routes/liveVoice.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  const backend = getAdminBackend();
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    firebaseConfigured: Boolean(firebaseConfig.projectId && firebaseConfig.apiKey),
    firebaseAdminConfigured: Boolean(backend),
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    backend: backend ? 'firebase_admin_firestore' : 'local_resilient_cache',
  });
});

registerCloudStateRoutes(app);
registerInferenceRoutes(app);
registerBrowserRoutes(app);
registerTtsRoutes(app);
registerConnectorRoutes(app);

// Create HTTP server and integrate WebSocket for Gemini Live API
async function bootstrap() {
  const server = http.createServer(app);

  attachLiveVoice(server);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Carol Ann server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
});
