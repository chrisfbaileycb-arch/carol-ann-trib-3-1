# Carol Ann — A Women's Platform

Carol Ann is a personal AI companion and workspace, built for women. Chat, live voice, memories,
and everyday organization live together in one calm place.

## What it is

- **Conversation** — Chat with Carol Ann, powered by Google Gemini.
- **Live voice** — Talk hands-free with real-time voice sessions.
- **Memories** — Save what matters; your workspace remembers across devices.
- **Organization** — Errands, check-ins, and notes, kept in one place.

Some areas of the app are a **demo sandbox** (for example, the connector directory). Demo features
are simulated locally and clearly labeled — they don't connect to outside services.

## Getting started

```sh
npm install
npm run dev
```

The app runs locally at http://localhost:8080 by default.

### Environment

Key variables:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for chat, voice, and speech features |
| `GOOGLE_CLOUD_PROJECT` / `FIREBASE_*` | Firebase project config (Admin SDK on the server, client SDK in the app) |
| `VITE_FIREBASE_*` | Firebase web config for the client |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA Enterprise site key for Firebase App Check (optional until provisioned) |
| `APP_CHECK_ENFORCED` | Set to `true` to reject API calls without a valid App Check token |

## Running the server

```sh
npm run server   # Express API on :3001 (proxied by Vite in dev)
```

All API routes require a signed-in Firebase user. The client attaches the Firebase ID token
automatically; the server verifies it with the Firebase Admin SDK and scopes cloud state to the
token's UID. App Check tokens are verified when supplied and can be made mandatory via
`APP_CHECK_ENFORCED=true`.

## Tests

```sh
npm test
```

## Privacy & Terms

- [Privacy Policy](/privacy)
- [Terms of Service](/terms)
