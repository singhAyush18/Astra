# Astra Stride Wars

Astra Stride Wars is a gamified running and fitness application that transforms your daily runs into a battle for territory and glory. Choose a clan, track your real-world runs using GPS, and conquer territories on the map by out-running rival factions.

## Features

- **GPS Run Tracking:** Live route pathing and pace calculation using your phone's GPS.
- **Clan System:** Join one of three factions and contribute your miles to your clan's total.
- **Territory Control:** An interactive map where clans battle for dominance over different zones based on running activity.
- **Progressive Web App (PWA):** Installable on mobile devices directly from the browser for a native app experience.
- **Real-time Leaderboards:** See top runners globally and within your clan.

## Tech Stack

### Frontend
- **Framework:** React with Vite
- **Routing:** React Router
- **Maps:** Leaflet & React-Leaflet
- **Styling:** Custom CSS with modern, dark-themed UI
- **PWA:** Service Workers and Web Manifest

### Backend
- **Runtime:** Node.js with Express
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Tokens)
- **API:** RESTful architecture

## Local Development Setup

To run this project locally, you will need two terminals running simultaneously.

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the backend directory with your configuration:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --host
   ```

### Running on Mobile (Local Network)
Because browsers require secure contexts (HTTPS) for Geolocation (GPS) APIs, you cannot simply use your local IP address over HTTP to test GPS features on your phone.

We recommend using **Cloudflare Tunnels** to expose your local frontend to the internet with secure HTTPS:
```bash
npx cloudflared tunnel --url http://localhost:5173
```
Open the generated `*.trycloudflare.com` link on your mobile device to test GPS tracking and install the PWA.

## License

MIT License
