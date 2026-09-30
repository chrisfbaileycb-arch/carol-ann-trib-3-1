import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve firebase-applet-config.json in workspace root
const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');

export interface FirebaseAppletConfig {
  projectId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
  recaptchaSiteKey?: string;
  [key: string]: unknown;
}

let loadedConfig: FirebaseAppletConfig = {};

try {
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    loadedConfig = JSON.parse(raw);
  }
} catch (err) {
  console.warn('[config] Could not read firebase-applet-config.json:', err);
}

export const firebaseConfig = loadedConfig;
export default firebaseConfig;
