export default async function handler(req, res) {
  const pairCode = generatePairCode(); 
  return res.json({ pairCode });
}

function generatePairCode() {
  return Math.random().toString(36).substr(2, 6);
}
