const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const QRCode = require('qrcode');
const twilio = require('twilio');
const MongoStore = require('connect-mongo');

// MongoDB URI (replace with your actual MongoDB URI)
const mongoURI = 'mongodb+srv://herman:kharel075@cluster0.q860v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Twilio Credentials
const accountSid = 'AC3e71cf33c152e10187637ef5bc0284c7';  // Your Account SID
const authToken = 'b7f18ae12453ed9332563c21f4b5397e';  // Your Auth Token
const twilioPhone = 'whatsapp:+15315354361';  // Your Twilio WhatsApp-enabled number

const app = express();
const PORT = process.env.PORT || 3000;

// Session Store Setup (using MongoDB via connect-mongo)
app.use(session({
  secret: 'pairing-secret',
  store: MongoStore.create({ mongoUrl: mongoURI }),  // Store sessions in MongoDB
  resave: false,
  saveUninitialized: true,
}));

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory pairings (for simplicity)
const pairings = {};

// POST route for pairing
app.post('/pair', (req, res) => {
  const { phone } = req.body;
  const pairCode = uuidv4(); // Generate unique pair code
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

    // Respond with Pair Code and QR Code URL
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
      from: twilioPhone, // Your Twilio WhatsApp number
      body: `🔐 Your pairing code is: ${pairCode}\n\nPlease send this code back to complete the pairing process.`,
      to: `whatsapp:${phone}` // The recipient's WhatsApp number
    })
    .then(message => console.log(`Pair code sent to ${phone}`))
    .catch(error => console.error('Error sending pair code to WhatsApp:', error));
}

// Simulated WhatsApp Bot callback (used for pairing completion)
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
      from: twilioPhone, // Your Twilio WhatsApp number
      body: `✅ Your device has been paired successfully!\n\nYour session ID is: ${sessionId}\nPlease use this ID to authenticate future requests.`,
      to: `whatsapp:${phone}` // The recipient's WhatsApp number
    })
    .then(message => console.log(`Session ID sent to ${phone}`))
    .catch(error => console.error('Error sending session ID to WhatsApp:', error));
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
