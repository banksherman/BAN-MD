const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // For making HTTP requests to WhatsApp bot

const app = express();
const PORT = process.env.PORT || 3000;

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

  // Send Pair Code to the user's WhatsApp using your Baileys bot or other WhatsApp API
  sendPairCodeToWhatsApp(phone, pairCode);

  // Respond with the pair code
  res.send(`
    <h3>Pair Code: ${pairCode}</h3>
    <p>Scan QR or send this code via WhatsApp to our bot.</p>
  `);
});

// Function to send pair code to the user's WhatsApp via Baileys bot
function sendPairCodeToWhatsApp(phone, pairCode) {
  // Assuming you have Baileys or another WhatsApp API set up to send the message
  axios.post('https://your-whatsapp-bot-endpoint/send-message', {
    phone: phone,
    message: `Your pairing code is: ${pairCode}`
  })
  .then(response => {
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
  // Assuming you have Baileys or another WhatsApp API set up to send the message
  axios.post('https://your-whatsapp-bot-endpoint/send-message', {
    phone: phone,
    message: `✅ Your device has been paired successfully. Your session ID is: ${sessionId}`
  })
  .then(response => {
    console.log(`Session ID sent to ${phone}`);
  })
  .catch(error => {
    console.error('Error sending session I
