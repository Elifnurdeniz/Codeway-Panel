![image](https://github.com/user-attachments/assets/a3a3a7fa-8b57-490e-93c9-d946893ebd72)# Codeway Panel

A configuration management panel web application, with both desktop and mobile views, backed by a RESTful API and Firestore as storage.

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Architecture](#architecture)
* [Prerequisites](#prerequisites)
* [Environment Variables](#environment-variables)

  * [Backend (`.env`)](#backend-env)
  * [Frontend (`.env`)](#frontend-env)
* [Setup](#setup)

  * [Backend](#backend-setup)
  * [Frontend](#frontend-setup)
* [Running Locally](#running-locally)
* [API Reference](#api-reference)
* [Testing](#testing)
* [Deployment](#deployment)
* [Future Improvements](#future-improvements)

---

## Overview

**Codeway Panel** is a full-stack configuration management app. Application managers can:

* View, add, edit, and delete global parameters.
* Define and manage country‑specific overrides.
* Sort and page through large parameter sets.
* Authenticate via Firebase; all update operations require a Firebase ID token and an API key.

---

## Features

* **Responsive UI**: Adapted view for desktop and mobile users.
* **CRUD Operations**: Create, Read, Update, Delete parameters and overrides.
* **Optimistic Locking**: Prevents accidental overwrites via version checks.
* **Authentication & Authorization**:

  * Firebase ID token validation on all update endpoints.
  * Public API key for all HTTP requests.
* **Firestore Back‑end**: Config stored in `config_params` collection and `overrides` subcollection.
* **Pagination & Sorting**: Efficient Firestore queries with cursors.

---

## Architecture

```
┌──────────┐     HTTP/API     ┌──────────────┐
| Frontend |  <============>  |  Backend     |
| (Vue 3)  |                  | (Express.js) |
└──────────┘                  └──────────────┘
      |                              |
      | Firebase Auth + ID Token     | Firestore (config_params)
      |                              |
```

* **Frontend**: Vue 3 + TypeScript + Vite + Firebase Web SDK.
* **Backend**: Node.js + Express + TypeScript + `firebase-admin`.
* **Database**: Google Firestore.

---

## Prerequisites and Versions

* **Node.js** v22 is used for this project.
* A **Firebase** project with Firestore and a Service Account JSON
* A generated **PUBLIC\_API\_KEY** for your API

---

## Environment Variables

### Backend (`backend/.env`)

```dotenv
# A shared API key for client→API authorization
PUBLIC_API_KEY=your-super-secret-api-key

# Port the Express server listens on
PORT=8080
```

### Frontend (`.env` in project root)

```dotenv
# Firebase Web app config (from your Firebase console)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Same API key as backend
VITE_PUBLIC_API_KEY=

# Base URL of your backend API
VITE_BASE_URL=
```

> **Note:** Vite requires all env vars to start with `VITE_`.

---

## Setup

Clone this repo and install dependencies:

```bash
git clone https://github.com/Elifnurdeniz/Codeway-Panel.git
cd Codeway-Panel
```

### Backend Setup

```bash
cd backend
npm install
# copy .env.example → .env and fill in values
# but your firestore serviceAccountKey.json file to backend/ directory
npm run build      # compiles TypeScript to dist/
npm start          # starts Express on PORT
```

### Frontend Setup

```bash
# back in repo root
npm install
# copy .env.example → .env and fill in values
npm run dev        # launches Vite dev server on http://localhost:5173
```

---

## Running Locally

1. **Launch Backend**: `cd backend && npm start`.
2. **Launch Frontend**: `npm run dev`.
3. Browse to `http://localhost:5173`.

---

## API Reference

All endpoints require header `x-api-key: <PUBLIC_API_KEY>`.
For write operations, also include `Authorization: Bearer <Firebase ID Token>`.

| Method | Path                                     | Description                                      |
| ------ | ---------------------------------------- | ------------------------------------------------ |
| GET    | `/v1/config?country=US`                  | Fetch flat key→value map, with optional override |
| POST   | `/v1/config`                             | Create parameter `{ key, value, description? }`  |
| PATCH  | `/v1/config/:key`                        | Update by key `{ value, version, description? }` |
| DELETE | `/v1/config/:id`                         | Delete by Firestore doc ID                       |
| POST   | `/v1/config/:paramId/overrides`          | Add override `{ country, value }`                |
| PATCH  | `/v1/config/:paramId/overrides/:country` | Update override `{ value, version? }`            |
| DELETE | `/v1/config/:paramId/overrides/:country` | Delete override                                  |

Sample cURL – **GET** all config:

```bash
curl -H "x-api-key: your-super-secret-api-key" \
     http://localhost:8080/v1/config?country=TR
```

---

## Testing

* You can use **Postman** or **curl** to hit the above endpoints.
* In the UI, sign in with Firebase Auth, then exercise the table/mobile UI.

---

## Deployment

Follow these steps to deploy both the frontend and backend on a single Ubuntu droplet.

### Prerequisites

On your Ubuntu 20.04+ Droplet, ensure you have:

- **SSH access** as `root` (or a sudo‐user)
- **Node.js** >= 16 & **npm**
- `git`

### 1. Connect To Your Droplet Console

From the DigitalOcean UI or command line, connect to the console. From the command line, you can connect with:

```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Install Node.js & npm

```
sudo apt update
sudo apt install nodejs
sudo apt install npm
```

Verify:
```
node --version
npm --version
```
### 3. Clone the Repository

```
git clone https://github.com/Elifnurdeniz/Codeway-Panel.git
// Also, available at Gitlab https://gitlab.com/elifnurdeniz/Codeway-Panel.git
cd Codeway-Panel
```

### 4. Backend Setup & Deployment

Open a new screen:
```
screen -S backend
```

Start installing packages:
```
cd backend
npm install
```

Fill you .env file as in .env.example
```
vim .env
```

Create your serviceAccountKey.json file:
```
vim serviceAccountKey.json
```

In `src/index.ts`, change the cors origin to droplet's IP.
```
app.use(cors({
  origin: 'http://YOUR_DROPLET_IP:5173',    // Change Here!
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-api-key','Authorization']
}))
```

Build & run:

```
npm run build
npm start 
```
Detach from the screen and continue with frontend deployment.

### 5. Frontend Setup & Deployment
Create a new screen:
```
screen -S frontend
```

Back in the repo root:
```
cd ..
npm install
```

Configure your .env:
```
vim .env
```

For your `VITE_BASE_URL` field, be sure to include the right IP address (your droplet IP).

Run the server:
```
npm run dev -- --host 0.0.0.0
```

The page will be available at `http://YOUR_DROPLET_IP:5173`. Your panel and API are now live 🎉

---

## Future Improvements

* Add unit & integration tests.
* Role‑based permissions (read vs write).
* Audit log of changes.
* Server locations could be selected closer to the main user population. 


