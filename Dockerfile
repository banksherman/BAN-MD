# Use the official Node.js LTS image as the base image
FROM node:lts-buster

# Install system dependencies required by puppeteer/whatsapp-web.js
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    libgbm-dev \
    libu2f-udev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install && \
    npm install -g pm2 && \
    npm install twilio qrcode whatsapp-web.js

# Copy the rest of the application files to the container
COPY . .

# Expose the port your app listens on
EXPOSE 9090

# Start the app with PM2
CMD ["pm2-runtime", "start", "server.js"]
