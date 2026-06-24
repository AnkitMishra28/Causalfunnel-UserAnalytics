# CausalAnalytics Platform

A production-ready full-stack user analytics platform built with **Next.js 15**, **TypeScript**, **MongoDB**, **Tailwind CSS (v4)**, **Shadcn UI**, **Framer Motion**, and **Recharts**. It tracks user behavior (page views and clicks with coordinates) and renders them on an interactive dashboard, including custom session tracking timelines and a visual heatmap overlay page, using background polling to stay updated.

---

## Key Features

*   **Standalone SDK (`public/tracker.js`):** Auto-manages unique session IDs in `localStorage` and hooks document click coordinates, page views, mutations (for SPAs), user agents, and screen resolutions.
*   **Background Data Sync:** Queries dashboard stats, session lists, and coordinate points automatically every 5 seconds to keep dashboard views up-to-date.
*   **Visual Heatmap Visualizer:** Loads `heatmap.js` dynamically, overlaying density grids and marker dots on top of the site frame (with synchronized scrolling).
*   **User Journey Timelines:** Groups events chronologically in a detailed modal, tracking precise user paths.
*   **Modern Premium UX:** Dark/light mode, Framer Motion transitions, responsive grids, loading skeleton states, and empty states.

---

## Technology Stack

### Frontend
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** Tailwind CSS (v4)
*   **UI Components:** Shadcn UI + Lucide Icons
*   **Charts:** Recharts (Responsive Area and Pie Charts)
*   **Heatmap Rendering:** Heatmap.js
*   **Animations:** Framer Motion

### Backend
*   **Framework:** Next.js API Routes (Serverless-ready)
*   **Database:** MongoDB Atlas via Mongoose ORM
*   **Validation:** Zod schemas

### Tracking
*   **Type:** Standalone JavaScript Client SDK
*   **Capabilities:** Session tracking, Click tracking, Page view tracking, User Agent and Resolution detection

### Data Refresh Strategy
*   **Strategy:** Background polling every 5 seconds
*   **WebSockets:** None (No WebSocket dependency for maximum serverless compatibility)

---

## Folder Structure

The application strictly enforces a modular and scalable Next.js src layout:

```text
src/
├── app/
│   ├── api/
│   │   ├── events/       # POST - Event record endpoint (CORS-enabled)
│   │   ├── heatmap/      # GET - Fetch heatmap data
│   │   ├── overview/     # GET - Fetch overview aggregates
│   │   ├── sessions/     # GET - Fetch session list & session details
│   │   └── route.ts
│   ├── demo/             # Interactive site to generate test tracking clicks
│   ├── heatmap/          # Page - Page Click Heatmap rendering
│   ├── sessions/         # Page - Session list & timelines
│   ├── globals.css       # Tailwind v4 globals and shadcn variables
│   ├── layout.tsx        # Shell wrapping Theme and Dashboard Layouts
│   └── page.tsx          # Page - Dashboard Overview
├── components/
│   ├── ui/               # Reusable Shadcn component primitives
│   ├── DashboardLayout.tsx# Shared Desktop & Mobile sidebar wrapper
│   └── ThemeProvider.tsx # Client-side LocalStorage theme toggle context
├── lib/
│   ├── mongodb.ts        # Database connection pool manager
│   └── utils.ts          # Tailwind merge & styling utilities
├── models/
│   └── Event.ts          # Mongoose Schema & Indexes (sessionId, pageUrl, timestamp, eventType)
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

# Application Base URL (Required for tracker script requests)
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
Run the standard Next.js development script:
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

## Why Polling Instead of WebSockets

The platform implements polling every 5 seconds rather than WebSockets (Socket.io) for several key reasons:

*   **Serverless-First Design:** Vercel Serverless Functions do not support persistent WebSockets out of the box because serverless execution contexts are ephemeral and spin down after requests finish.
*   **Simplified Infrastructure:** Eliminates the need to maintain, scale, and pay for persistent running server instances (like Heroku or AWS EC2) purely to manage Socket.io connections.
*   **Reliability & Fallbacks:** HTTP polling is extremely reliable, behaves correctly under standard CDN caching policies, and does not trigger connection dropouts or socket timeouts.
*   **Reduced Code Complexity:** Removing WebSockets reduces client-side connection states, state handlers, and socket wrappers, improving the project's maintainability.
*   **Assignment Constraints:** The core requirements focus on behavior tracking accuracy, dashboard aggregations, session grouping, and visual heatmaps—which are fully served via 5s polling.

---

## API Documentation

### `POST /api/events`
Stores a new event tracking payload in MongoDB. Supports cross-origin requests (CORS enabled) so that the tracker can be embedded on external domains.
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
2.  **Serverless Support:** Since there are no WebSockets or custom servers, standard Next.js App Router compilation is fully serverless ready and deploys natively to Vercel without adjustments.

---

## Design Tradeoffs & Assumptions

1.  **Indexed Compound Operations:** To keep aggregation speeds fast, the database model incorporates composite indexes (`{ eventType: 1, pageUrl: 1 }`).
2.  **Client-Side Filtering & Sorting:** For ease of initial navigation, sessions list filter, pagination, and sorting are executed in-memory on the client. For platforms hosting millions of rows, this should be refactored to server-side query-based pagination (`limit`, `skip`, index filters).
3.  **Heatmap Preview Resolution:** Click coordinates are relative to document page width (`pageX` / `pageY`). To ensure heat points overlay perfectly on top of elements, we render the target page inside a fixed-width `1200px` container overlay.
