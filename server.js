const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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

app.post('/pair', (req, res) => {
  const { phone } = req.body;
  const pairCode = uuidv4(); // unique pair code
  const sessionId = uuidv4(); // unique session ID

  // Save pairing
  pairings[pairCode] = {
    phone,
    sessionId,
    paired: false
  };

  // Simulate QR or WhatsApp integration here
  console.log(`Pair code for ${phone}: ${pairCode}`);

  res.send(`
    <h3>Pair Code: ${pairCode}</h3>
    <p>Scan QR or send this code via WhatsApp to our bot.</p>
  `);
});

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

  pairing.paired = true;

  res.json({
    message: `Paired with phone ${pairing.phone}`,
    sessionId: pairing.sessionId
  });
});


  // Simulate sending session ID via WhatsApp
  console.log(`✅ Sending session ID to ${pairing.phone}: ${pairing.sessionId}`);

  res.send(`User with phone ${pairing.phone} is now paired!`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
