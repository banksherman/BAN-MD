const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const QRCode = require('qrcode');
const twilio = require('twilio');

// Twilio Credentials
const accountSid = 'AC3e71cf33c152e10187637ef5bc0284c7';  // Your Account SID
const authToken = 'b7f18ae12453ed9332563c21f4b5397e';  // Your Auth Token
const twilioPhone = 'whatsapp:+15315354361';  // Your Twilio WhatsApp-enabled number

const app = express();
const PORT = process.env.PORT || 3000;

// Session Store Setup (using MemoryStore)
app.use(session({
  secret: 'pairing-secret',
  resave: false,
  saveUninitialized: true,
}));

// Middleware

