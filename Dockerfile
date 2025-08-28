# Use official Node.js LTS as base
FROM node:lts-buster

# Set working directory inside container
WORKDIR /app

# Copy package.json first (for caching layers)
COPY package*.json ./

# Install dependencies
RUN npm install && \
    npm install -g pm2 && \
    npm install twilio qrcode whatsapp-web.js

# Copy app source code
COPY . .

# ✅ Make sure session folder exists & writable
RUN mkdir -p /app/session && chmod -R 777 /app/session

# Expose app port
EXPOSE 9090

# ✅ Persist WhatsApp Web session outside container
VOLUME [ "/app/session" ]

# Start with PM2
CMD ["pm2-runtime", "start", "server.js"]

