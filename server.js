const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const twilio = require('twilio');
const { Client } = require('whatsapp-web.js');  // ✅ WhatsApp Web client

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio Credentials
const accountSid = 'AC3e71cf33c152e10187637ef5bc0284c7';  
const authToken = 'b7f18ae12453ed9332563c21f4b5397e';    
const twilioPhone = 'whatsapp:+15315354361';             

// ✅ Session setup (memory only)
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
      <footer>
        <p>&copy; 2025 BANKS OFC KHAREL</p>
      </footer>
    `);
  });
});

function sendPairCodeToWhatsApp(phone, pairCode) {
  const client = twilio(accountSid, authToken);
  client.messages
    .create({
      from: twilioPhone,
      body: `🔐 Your pairing code is: ${pairCode}\n\nPlease send this code back to complete the pairing process.`,
      to: `whatsapp:${phone}`
    })
    .then(() => console.log(`Pair code sent to ${phone}`))
    .catch(error => console.error('Error sending pair code to WhatsApp:', error));
}

app.get('/whatsapp/callback/:pairCode', (req, res) => {
  const { pairCode } = req.params;
  const pairing = pairings[pairCode];

  if (!pairing) {
    return res.status(404).json({ error: 'Invalid pair code' });
  }

  if (pairing.paired) {
    return res.status(400).json({ error: 'Code already used' });
  }

  pairing.paired = true;
  sendSessionIdToWhatsApp(pairing.phone, pairing.sessionId);

  res.json({
    message: `Paired with phone ${pairing.phone}`,
    sessionId: pairing.sessionId
  });
});

function sendSessionIdToWhatsApp(phone, sessionId) {
  const client = twilio(accountSid, authToken);
  client.messages
    .create({
      from: twilioPhone,
      body: `✅ Your device has been paired successfully!\n\nYour session ID is: ${sessionId}\nPlease use this ID to authenticate future requests.`,
      to: `whatsapp:${phone}`
    })
    .then(() => console.log(`Session ID sent to ${phone}`))
    .catch(error => console.error('Error sending session ID to WhatsApp:', error));
}

// ---------------- WhatsApp Web Login via QR ----------------
let latestQR = null;
const waClient = new Client();

waClient.on('qr', async (qr) => {
  console.log('QR RECEIVED', qr);
  latestQR = await QRCode.toDataURL(qr); // convert QR string to image
});

waClient.on('ready', () => {
  console.log('✅ WhatsApp Web client is ready!');
});

waClient.initialize();

// Route to show WhatsApp Web QR
app.get('/qr', (req, res) => {
  if (!latestQR) return res.send('QR not yet generated. Please wait...');
  res.send(`<h2>Scan this QR with WhatsApp (Linked Devices)</h2><img src="${latestQR}" />`);
});

// ---------------- Start server ----------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
