FROM node:lts-buster

# Clone bot from GitHub
RUN git clone https:https://github.com/banksherman/BAN-MD.git /root/arslan
ban-bot

# Set working directory
WORKDIR /root/arslan-bot

# Install dependencies
RUN npm install && npm install -g pm2

# Expose port
EXPOSE 9090

# Start the bot
CMD ["npm", "start"]
