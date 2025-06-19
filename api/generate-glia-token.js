// This file is located at `/api/generate-glia-token.js`

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// --- CONFIGURATION ---
// These are read from your Vercel Environment Variables.
const privateKey = process.env.GLIA_PRIVATE_KEY;
const apiKeyId = process.env.GLIA_API_KEY_ID;

export default async function handler(req, res) {
  // Check for server configuration errors.
  if (!privateKey || !apiKeyId) {
    console.error('Missing required environment variables on Vercel.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // --- MOCK USER DATA ---
  // A simple payload is sufficient for this authentication method.
  const userEmail = 'jane.doe@email.com';
  const userName = 'Jane Doe';
  
  const payload = {
    // Basic claims based on your documentation examples
    email: userEmail,
    name: userName,
    sub: userEmail, // Subject can also be the email or a unique ID
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (5 * 60),
  };

  try {
    // **THE FIX**: Signing the token with the correct ES256 algorithm.
    const signedToken = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        kid: apiKeyId,
      },
    });

    // Send the token back to the front-end.
    // The DirectID example script expects the raw token, not a JSON object.
    res.status(200).send(signedToken);

  } catch (error) {
    console.error('Error signing JWT:', error);
    res.status(500).json({ error: 'Failed to generate authentication token.' });
  }
}