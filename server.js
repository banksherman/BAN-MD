const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const twilio = require('twilio'); // Twilio package to send messages

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio credentials (use environment variables for security in production)
const ACCOUNT_SID = 'AC3e71cf33c152e10187637ef5bc0284c7';  // Your Twilio Account SID
const AUTH_TOKEN = 'b7f18ae12453ed9332563c21f4b5397e';  // Your Twilio Auth Token
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+15315354361';  // Your Twilio WhatsApp-enabled number

const client = twilio(ACCOUNT_SID, AUTH_TOKEN); // Initialize Twilio client

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'pairing-secret',
  resave: false,
  saveUninitialized: true
}));

// In-memory store for simplicity (use a DB in production)
const pairings = {};

// POST route to handle pairing requests and send pair code to WhatsApp
app.post('/pair', (req, res) => {
  const { phone } = req.body;
  const pairCode = uuidv4(); // Generate unique pair code
  const sessionId = uuidv4(); // Generate unique session ID

  // Save pairing information
  pairings[pairCode] = {
    phone,
    sessionId,
    paired: false
  };

  // Log pair code (for your internal use)
  console.log(`Pair code for ${phone}: ${pairCode}`);

  // Send Pair Code to the user's WhatsApp using Twilio API
  sendPairCodeToWhatsApp(phone, pairCode);

  // Respond with the pair code
  res.send(`
    <h3>Pair Code: ${pairCode}</h3>
    <p>Scan QR or send this code via WhatsApp to our bot.</p>
  `);
});

// Function to send pair code to the user's WhatsApp via Twilio API
function sendPairCodeToWhatsApp(phone, pairCode) {
  client.messages
    .create({
      from: TWILIO_WHATSAPP_NUMBER,  // Twilio WhatsApp number
      to: `whatsapp:${phone}`,  // Phone number in international format
      body: `🔐 Your pairing code is: ${pairCode}\n\nPlease send this code back to complete the pairing process.`
    })
    .then(message => {
      console.log(`Pair code sent to ${phone}`);
    })
    .catch(error => {
      console.error('Error sending pair code to WhatsApp:', error);
    });
}

// ✅ Simulated WhatsApp Bot callback (in real case, from webhook or bot)
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

  // Log sending session ID to WhatsApp (to notify user)
  console.log(`✅ Sending session ID to ${pairing.phone}: ${pairing.sessionId}`);

  // Send session ID back to WhatsApp
  sendSessionIdToWhatsApp(pairing.phone, pairing.sessionId);

  // Return the session ID in response
  res.json({
    message: `Paired with phone ${pairing.phone}`,
    sessionId: pairing.sessionId
  });
});

// Function to send session ID to the user's WhatsApp after pairing
function sendSessionIdToWhatsApp(phone, sessionId) {
  client.messages
    .create({
      from: TWILIO_WHATSAPP_NUMBER,  // Twilio WhatsApp number
      to: `whatsapp:${phone}`,  // Phone number in international format
      body: `✅ Your device has been paired successfully!\n\nYour session ID is: ${sessionId}\nPlease use this ID to authenticate future requests.`
    })
    .then(message => {
      console.log(`Session ID sent to ${phone}`);
    })
    .catch(error => {
      console.error('Error sending session ID to WhatsApp:', error);
    });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
