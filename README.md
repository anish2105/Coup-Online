# Coup Online 🃏

A real-time, multiplayer online implementation of the classic **Coup** board game built with **React**, **TypeScript**, and **Socket.io**. Features a premium cyberpunk glassmorphism UI, a real-time lobby system, animated card flips, sound logs, helper truth-indicators, and a built-in game rule book.

---

## 🏗️ Project Architecture

The project is structured as a monorepos workspace:
- **`backend/`**: A Node.js + Express WebSocket server powered by Socket.io, driving the state machine of the Coup board game.
- **`frontend/`**: A responsive Vite + React + TypeScript single page application styled with custom CSS glassmorphism, seating players in a circular coordinate arrangement.

---

## 🚀 Local Quickstart

Follow these steps to spin up the game locally:

### 1. Run the Backend WebSocket Server
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The server runs at `http://localhost:3001`.*

### 2. Run the Frontend Client
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite:
   ```bash
   npm run dev
   ```
   *The site runs locally at `http://localhost:5173`.*

Open multiple tabs or invite friends to join the same lobby and start playing!

---

## 📡 Production Deployment

The project is configured for easy production deployments:
- **Frontend**: Can be deployed to **Vercel** or Netlify.
- **Backend**: Can be deployed to **Render** or Railway.
- **Connection**: Set the `VITE_BACKEND_URL` environment variable on the frontend build settings to point to your live backend domain.

For detailed steps on setting up deployments without Git or using a private Git repository, refer to:
- **[deployment_guide.md](C:/Users/anish/.gemini/antigravity-ide/brain/1888f975-61c1-4e8c-9334-fb1991f0001a/deployment_guide.md)**
