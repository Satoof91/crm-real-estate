# Deployment Guide (Render + Neon)

This guide explains how to deploy your Real Estate CRM for free using **Render** (for the app) and **Neon** (for the database).

## Why this stack?
- **Render:** Easiest way to host Node.js apps. Free tier available.
- **Neon:** Serverless Postgres database. **Permanent free tier** (unlike Render's free DB which deletes data after 90 days). Your code is already optimized for Neon.

## Prerequisites
- A GitHub account (with this code pushed to a repository)
- A [Render](https://render.com/) account
- A [Neon](https://neon.tech/) account

---

## Step 1: Set up the Database (Neon)

1. Log in to [Neon Console](https://console.neon.tech/).
2. Click **New Project**.
3. Name it `real-estate-crm` and create it.
4. Copy the **Connection String** from the dashboard (it looks like `postgresql://neondb_owner:xyz...@ep-xyz.aws.neon.tech/neondb...`).
   - You will need this for the `DATABASE_URL` later.

## Step 2: Deploy the App (Render)

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name:** `real-estate-crm`
   - **Region:** Frankfurt (closest to KSA) or simple defaults.
   - **Branch:** `main` (or your working branch).
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build && npm run db:push`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

5. **Environment Variables** (Scroll down to "Advanced"):
   Add the following keys and values:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (Paste your Neon connection string from Step 1) |
   | `NODE_ENV` | `production` |
   | `SESSION_SECRET` | (Generate a random string, e.g., `my-super-secret-key-123`) |
   | `WASENDER_API_KEY` | (Your Wasender API Key) |
   | `WASENDER_API_URL` | `https://wasenderapi.com/api/send-message` |

6. Click **Create Web Service**.

## Step 3: Verify

1. Wait for the deployment to finish (it usually takes 2-3 minutes).
2. Render will give you a URL (e.g., `https://real-estate-crm.onrender.com`).
3. Open it in your browser.
4. The first time you use it, the database migrations will run automatically (managed by the app logic or you can add `npm run db:push` to the build command if needed, but your current setup uses `drizzle-kit push` locally. For production, the app handles schema usage).

> **Note:** On the Free tier, Render puts the app to "sleep" after 15 minutes of inactivity. The first request after sleep might take 30-50 seconds to load. For an admin tool, this is usually acceptable. To avoid this, upgrade to the "Starter" plan ($7/mo).
