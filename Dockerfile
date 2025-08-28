# Use the official Node.js LTS image as the base image
FROM node:lts-buster

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies first (this is a performance optimization)
COPY package*.json ./

# Install dependencies
RUN npm install && \
    npm install -g pm2 && \
    npm install twilio qrcode

# Copy the rest of the application files to the container
COPY . .

# Expose the port your app listens on
EXPOSE 9090

# Start the app with PM2 to keep the app running in production mode
CMD ["pm2-runtime", "start", "server.js"]
