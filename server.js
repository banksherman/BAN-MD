const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const twilio = require('twilio');
const { Client, LocalAuth } = require('whatsapp-web.js');  // ✅ WhatsApp Web client with LocalAuth

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio Credentials
const accountSid = 'AC3e71cf33c152e10187637ef5bc0284c7';  
const authToken = 'b7f18ae12453ed9332563c21f4b5397e';    
const twilioPhone = 'whatsapp:+15315354361';             

// ✅ Session setup (memory only for web pairing codes)
app.use(session({
  secret: 'pairing-secret',
  resave: false,
  saveUninitialized: true,
}));

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory pairings
const pairings = {};

// ---------------- Twilio Pairing Flow ----------------
app.post('/pair', (req, res) => {
  const { phone } = req.body;
  const pairCode = uuidv4();
  const sessionId = uuidv4();

  pairings[pairCode] = {
    phone,
    sessionId,
    paired: false
  };

  const pairingUrl = `https://pairing-app-ut40.onrender.com/whatsapp/callback/${pairCode}`;
  QRCode.toDataURL(pairingUrl, (err, qrCodeUrl) => {
    if (err) {
      console.error('Error generating QR code:', err);
      return res.status(500).send('Error generating QR code');
    }

    sendPairCodeToWhatsApp(phone, pairCode);

    res.send(`
      <h3>Pair Code: ${pairCode}</h3>
      <img src="${qrCodeUrl}" alt="Scan to Pair" />
      <p>Scan the QR code or send the pair code to our WhatsApp bot.</p>
