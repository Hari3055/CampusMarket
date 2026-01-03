# Deploying Campus Market to Railway

## Step 1: Push Your Code to GitHub

1. If you haven't already, initialize git and push to GitHub:
   ```bash
   cd /Users/harjotsohi/CampusMarket
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login (free tier available)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `CampusMarket` repository
4. Railway will automatically detect it's a Node.js app and start building

## Step 3: Configure Environment Variables

In Railway, go to your project → **Variables** tab and add:

```
NODE_ENV=production
PORT=4001
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=https://campusmarket.ca
RESEND_API_KEY=your-resend-api-key-if-you-have-one
FROM_EMAIL=Campus Market <noreply@campusmarket.ca>
```

## Step 3.5: Make sure you're using Node 20 (important)

This project uses `better-sqlite3` and is intended to run on **Node 20**.
- Locally: use the `.nvmrc` file (`nvm use`)
- In Railway: set the Node version to 20 (in Settings / Nixpacks config)

**Important**: Generate a strong `JWT_SECRET`:
```bash
# Run this in terminal to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3.6: Uploaded images storage note

Uploaded listing images are stored on the server filesystem under `data/uploads` and served at `/uploads/...`.
If your host restarts containers or uses ephemeral disks, you may need a persistent volume for `data/` so uploads don’t get wiped.

## Step 4: Build the Frontend

Railway will run `npm install` automatically, but we need to build the React app:

1. In Railway, go to your project → **Settings** → **Build Command**
2. Set it to: `npm run build && npm install`
3. Or add a `railway.toml` file (already created) - Railway should use it

## Step 5: Connect Your Domain

1. In Railway, go to your project → **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter: `campusmarket.ca`
4. Railway will give you DNS records to add

## Step 6: Update DNS Records

Go to your domain registrar (where you bought `campusmarket.ca`) and add:

**Type**: `CNAME`  
**Name**: `@` (or leave blank)  
**Value**: The Railway-provided domain (something like `your-app.up.railway.app`)

**OR** if your registrar doesn't support CNAME for root:

**Type**: `A`  
**Name**: `@`  
**Value**: Railway's IP address (they'll provide this)

**Also add**:
**Type**: `CNAME`  
**Name**: `www`  
**Value**: Same Railway domain

## Step 7: Wait for DNS Propagation

DNS changes can take 5 minutes to 48 hours. Check with:
```bash
nslookup campusmarket.ca
```

## Step 8: Test Your Site

Once DNS propagates, visit:
- `https://campusmarket.ca`
- `https://www.campusmarket.ca`

## Troubleshooting

- **Build fails**: Check Railway logs for errors
- **White screen**: Make sure `NODE_ENV=production` is set
- **Database errors**: SQLite file will be created automatically in Railway's filesystem
- **CORS errors**: Make sure `FRONTEND_URL=https://campusmarket.ca` matches your domain

## Optional: Add SSL/HTTPS

Railway automatically provides SSL certificates via Let's Encrypt, so `https://` should work automatically once DNS is configured.

