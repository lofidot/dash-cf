# Cloudflare Portal

A fullstack React + Supabase + Creem account portal, deployable on Cloudflare Pages with API endpoints as serverless functions.

## Setup

1. Clone this repo.
2. Add your environment variables in the Cloudflare Pages dashboard:
   - `CREEM_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy to Cloudflare Pages (connect your repo, set build command to `npm run build`, output dir to `dist`).

## Features

- User registration, login, password reset (Supabase)
- Payment/upgrade (Creem, via `/api/checkout`)
- Dashboard with subscription status 