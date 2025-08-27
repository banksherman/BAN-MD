const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Optional: body parser middleware
app.use(express.json());

// Simple route
app.get('/', (req, res) => {
  res.send('Welcome to the pairing app!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
