FROM node:lts-buster

RUN git clone https://github.com/banksherman/BAN-MD/root/productive

WORKDIR /root/productive

RUN npm install && npm install -g pm2 || yarn install --network-concurrency 1

COPY . .

EXPOSE 9090

CMD ["npm", "start"]
