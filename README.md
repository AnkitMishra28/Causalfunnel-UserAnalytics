# CausalAnalytics Platform

A production-ready full-stack user analytics platform built with **Next.js 16/15**, **TypeScript**, **MongoDB**, **Tailwind CSS (v4)**, **Shadcn UI**, **Framer Motion**, and **Socket.io**. It tracks user behavior (page views and clicks with coordinates) in real time and renders them on an interactive dashboard, including custom session tracking timelines and a visual heatmap overlay page.

---

## Key Features

*   **Standalone SDK (`public/tracker.js`):** Auto-manages unique session IDs in `localStorage` and hooks document click coordinates, page views, mutations (for SPAs), user agents, and screen resolutions.
*   **Real-time Event Engine:** Integrates Socket.io into the Next.js request pipeline to instantly push client events to the dashboard.
*   **Visual Heatmap Visualizer:** Loads `heatmap.js` dynamically, overlaying density grids and marker dots on top of the live website frame (with synchronized scrolling).
*   **User Journey Timelines:** Groups events chronologically in a detailed modal, tracking precise user paths.
*   **Modern Premium UX:** Dark/light mode, Framer Motion transitions, responsive grids, loading skeleton states, and empty states.

---

## Technology Stack

*   **Frontend Framework:** Next.js (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** Tailwind CSS (v4)
*   **UI Components:** Shadcn UI + Lucide Icons
*   **Database:** MongoDB via Mongoose ORM
*   **Real-Time Sync:** Socket.io (Client & Server)
*   **Charts:** Recharts (Responsive Area and Pie Charts)
*   **Heatmap Rendering:** Heatmap.js
*   **Animations:** Framer Motion

---

## Folder Structure

The application strictly enforces a modular and scalable Next.js src layout:

```text
src/
├── app/
│   ├── api/
│   │   ├── events/       # POST - Event record endpoint
│   │   ├── heatmap/      # GET - Fetch heatmap data
│   │   ├── overview/     # GET - Fetch overview aggregates
│   │   ├── sessions/     # GET - Fetch session list & session details
│   │   └── route.ts
│   ├── demo/             # Interactive site to generate test tracking clicks
│   ├── heatmap/          # Page - Page Click Heatmap rendering
│   ├── sessions/         # Page - Session list & timelines
│   ├── globals.css       # Tailwind v4 globals and shadcn variables
│   ├── layout.tsx        # Shell wrapping Theme, Socket, and Dashboard Layouts
│   └── page.tsx          # Page - Dashboard Overview
├── components/
│   ├── ui/               # Reusable Shadcn component primitives
│   ├── DashboardLayout.ts# Shared Desktop & Mobile sidebar wrapper
│   ├── SocketProvider.tsx# Shared client Websocket context
│   └── ThemeProvider.tsx # Client-side LocalStorage theme toggle context
├── lib/
│   ├── mongodb.ts        # Database connection pool manager
│   └── utils.ts          # Tailwind merge & styling utilities
├── models/
│   └── Event.ts          # Mongoose Schema & Indexes (sessionId, pageUrl, timestamp)
├── types/
│   ├── heatmap.d.ts      # Custom heatmap.js module declaration
│   └── index.ts          # TypeScript type definitions
```

---

## Environment Variables

Create a `.env.local` file in the root directory. Copy the structure from `.env.example`:

```bash
# MongoDB Connection URI
# For local running:
MONGODB_URI=mongodb://localhost:27017/user-analytics
# For production (MongoDB Atlas):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/user-analytics?retryWrites=true&w=majority

# Application Base URL (Required for tracker script requests & socket origin)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Getting Started

### 1. Prerequisite: Run MongoDB
Ensure you have MongoDB running locally, or use a MongoDB Atlas connection.
*   **Local installation:** Ensure the service is running at `mongodb://localhost:27017`.
*   **Docker Container option:** Run:
    ```bash
    docker run -d -p 27017:27017 --name mongodb mongo:latest
    ```

### 2. Install Dependencies
Run the package installation:
```bash
npm install
```

### 3. Start Development Server
Next.js API routes and Socket.io run concurrently via the custom `server.js`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Overview Dashboard.

### 4. Build and Production Run
```bash
npm run build
npm run start
```

---

## API Documentation

### `POST /api/events`
Stores a new event tracking payload in MongoDB and triggers a real-time WebSocket broadcast.
*   **Request Headers:** `Content-Type: application/json`
*   **Payload Validation (Zod):**
    ```json
    {
      "sessionId": "sess_f3290...",
      "eventType": "click",
      "pageUrl": "http://localhost:3000/demo",
      "timestamp": "2026-06-23T20:51:00.000Z",
      "clickX": 450,
      "clickY": 182,
      "userAgent": "Mozilla/5.0...",
      "screenWidth": 1440,
      "screenHeight": 900
    }
    ```

### `GET /api/sessions`
Returns a summary list of all tracked user sessions.
*   **Response Format:**
    ```json
    [
      {
        "sessionId": "sess_f3290...",
        "eventCount": 14,
        "firstSeen": "2026-06-23T20:51:00.000Z",
        "lastSeen": "2026-06-23T21:12:00.000Z"
      }
    ]
    ```

### `GET /api/sessions/[id]`
Returns all tracking events recorded for a specific session ID, sorted chronologically.
*   **Response Format:** `Array<Event>` (raw event schemas)

### `GET /api/heatmap?pageUrl=<url>`
Fetches all recorded click coordinate events matching the specified page URL.
*   **Query Parameters:**
    *   `pageUrl`: Fully qualified URL (e.g., `http://localhost:3000/demo`)
*   **Response Format:**
    ```json
    [
      { "x": 150, "y": 420, "value": 1 },
      { "x": 380, "y": 210, "value": 1 }
    ]
    ```

### `GET /api/heatmap?distinct=true`
Returns a distinct list of all page URLs that have tracked events, useful for populating filter controls.
*   **Response Format:** `["http://localhost:3000/demo", "http://localhost:3000/pricing"]`

---

## Deployment Guidelines

### Vercel Deployment
To deploy this application on Vercel:
1.  **Configure environment variables:** Add `MONGODB_URI` and `NEXT_PUBLIC_APP_URL` (your deployment URL) in the Vercel dashboard.
2.  *Note on Serverless WebSockets:* Standard serverless environments on Vercel do not maintain persistent WebSockets. The Socket.io integration degrades gracefully, and the application switches to polling or periodic refreshes automatically. For full live WebSocket support in production, host on an instance-based cloud provider (Heroku, AWS ECS, DigitalOcean App Platform) using `npm start`.

---

## Design Tradeoffs & Assumptions

1.  **Shared Next.js + Socket.io Server:** Instead of forcing developers to manage two separate processes (one for Next.js and one for WebSockets), we boot Next.js programmatically inside a custom `server.js` wrapper. This mounts Socket.io on the same port, resolving CORS hurdles and easing local deployment.
2.  **Client-Side Filtering & Sorting:** For ease of initial navigation, sessions list filter, pagination, and sorting are executed in-memory on the client. For platforms hosting millions of rows, this should be refactored to server-side query-based pagination (`limit`, `skip`, index filters).
3.  **Heatmap Preview Resolution:** Click coordinates are relative to document page width (`pageX` / `pageY`). To ensure heat points overlay perfectly on top of elements, we render the target page inside a fixed-width `1200px` container overlay.
