const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio Credentials
const accountSid = 'AC3e71cf33c152e10187637ef5bc0284c7';  // Your Account SID
const authToken = 'b7f18ae12453ed9332563c21f4b5397e';    // Your Auth Token
const twilioPhone = 'whatsapp:+15315354361';             // Your Twilio WhatsApp-enabled number

// ✅ Session setup (no Mongo, just memory)
app.use(session({
  secret: 'pairing-secret',
  resave: false,
  saveUninitialized: true,
}));

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory pairings (simple, not persisted)
const pairings = {};

// POST route for pairing
app.post('/pair', (req, res) => {
  const { phone } = req.body;
  const pairCode = uuidv4();  // Generate unique pair code
  const sessionId = uuidv4(); // Generate session ID

  // Save pairing information
  pairings[pairCode] = {
    phone,
    sessionId,
    paired: false
  };

  // Generate QR Code URL
  const pairingUrl = `https://pairing-app-ut40.onrender.com/whatsapp/callback/${pairCode}`;
  QRCode.toDataURL(pairingUrl, (err, qrCodeUrl) => {
    if (err) {
      console.error('Error generating QR code:', err);
      return res.status(500).send('Error generating QR code');
    }

    // Send Pair Code to WhatsApp
    sendPairCodeToWhatsApp(phone, pairCode);

    // Respond with Pair Code and QR Code
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

// Function to send Pair Code to WhatsApp
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

// WhatsApp Bot callback (simulate pairing)
app.get('/whatsapp/callback/:pairCode', (req, res) => {
  const { pairCode } = req.params;
  const pairing = pairings[pairCode];

  if (!pairing) {
    return res.status(404).json({ error: 'Invalid pair code' });
  }

  if (pairing.paired) {
    return res.status(400).json({ error: 'Code already used' });
  }

  // Mark as paired
  pairing.paired = true;

  // Send session ID to WhatsApp
  sendSessionIdToWhatsApp(pairing.phone, pairing.sessionId);

  // Return session ID in response
  res.json({
    message: `Paired with phone ${pairing.phone}`,
    sessionId: pairing.sessionId
  });
});

// Function to send Session ID to WhatsApp
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

