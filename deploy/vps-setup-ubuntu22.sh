#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -eq 0 ]]; then
  echo "Please run as a normal user with sudo, not as root."
  exit 1
fi

APP_DIR="${HOME}/CampusMarket"
DOMAIN="${DOMAIN:-campusmarket.ca}"
PORT="${PORT:-4001}"

echo "==> Updating apt and installing prerequisites"
sudo apt update
sudo apt install -y curl git build-essential

echo "==> Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "==> Installing Caddy (reverse proxy + HTTPS)"
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
sudo apt update
sudo apt install -y caddy

echo "==> Cloning/updating repo"
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" pull
else
  git clone https://github.com/Hari3055/CampusMarket.git "${APP_DIR}"
fi

cd "${APP_DIR}"

echo "==> Installing dependencies and building frontend"
npm install
npm run build

if [[ ! -f ".env" ]]; then
  cat > .env <<EOF
NODE_ENV=production
PORT=${PORT}
JWT_SECRET=REPLACE_ME_WITH_LONG_RANDOM_SECRET
FRONTEND_URL=https://${DOMAIN}
# Optional (email verification sending):
# RESEND_API_KEY=
# FROM_EMAIL=Campus Market <noreply@campusmarket.ca>
EOF
  echo "==> Created .env (you MUST edit JWT_SECRET before launch)"
fi

echo "==> Installing PM2 and starting the app"
sudo npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u "${USER}" --hp "${HOME}" | tail -n 1 | bash || true

echo "==> Installing Caddyfile for ${DOMAIN}"
sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
${DOMAIN}, www.${DOMAIN} {
  reverse_proxy 127.0.0.1:${PORT}
}
EOF

sudo systemctl reload caddy
sudo systemctl enable caddy >/dev/null

echo ""
echo "Done."
echo "- App listens on http://127.0.0.1:${PORT}"
echo "- Caddy will serve https://${DOMAIN} once DNS points to this VPS and ports 80/443 are open."
echo "- IMPORTANT: edit ${APP_DIR}/.env and set JWT_SECRET to a strong value."

