# FORGED — AI-Powered Fitness PWA

A full-stack mobile fitness Progressive Web App built with React + Vite + Express, powered by Claude AI.

---

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts + vite-plugin-pwa
- **Backend**: Express.js (proxies all Claude API calls)
- **AI**: Claude claude-sonnet-4-6 via Anthropic API
- **Deployment**: Railway (Nixpacks builder)

---

## Local Development

```bash
npm install

# Terminal 1 — Express server (Claude proxy)
node server.js

# Terminal 2 — Vite dev server
npm run dev
```

Create a `.env` file in the project root:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Open http://localhost:5173 in your browser.

---

## Deploy to Railway

### 1. Set Environment Variable

In the Railway dashboard for your service, go to **Variables** and add:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> The API key **never** reaches the client — it is only used server-side in `server.js`.

### 2. Connect GitHub Repo

1. Push this project to a GitHub repository
2. Go to [railway.app](https://railway.app) and create a new project
3. Select **Deploy from GitHub repo** and choose your repository
4. Railway auto-detects the `railway.json` and builds with Nixpacks
5. The `npm run build` step compiles the Vite frontend into `dist/`
6. The `node server.js` start command serves both the API and the static build

Railway will give you a public URL like `https://forged-production.up.railway.app`.

---

## Install as PWA on iPhone

1. Open your Railway app URL in **Safari**
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** — FORGED will appear on your home screen like a native app

---

## Install as PWA on Android

1. Open your Railway app URL in **Chrome**
2. Tap the **three-dot menu** (top right)
3. Tap **Add to Home Screen**
4. Tap **Add** — FORGED appears on your home screen

---

## Features

- **Multi-profile** with optional PIN protection
- **10-step onboarding** capturing goals, physique targets, sports, and personal descriptions
- **AI Workout Plans** — fully tailored to sport, physique goal, fitness level, gym access
- **Macro Tracker** — describe food in plain English, AI estimates macros
- **Progress Charts** — workout consistency, macro adherence, streaks
- **FORGE AI Assistant** — context-aware coach with full access to your profile, today's workout, and food log
- **PWA** — installable, offline-capable, full-screen mobile experience
