# Codeway Panel

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
# but your firestore service account json file to backend/ directory
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

*(TODO: fill in when you deploy to Heroku / DigitalOcean / GCP.)*

---

## Future Improvements

* Add Jest unit & integration tests.
* Role‑based permissions (read vs write).
* Audit log of changes.


