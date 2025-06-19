// This file is located at `/api/generate-glia-token.js`

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// --- CONFIGURATION ---
// These are read from your Vercel Environment Variables.
const privateKey = process.env.GLIA_PRIVATE_KEY;
const apiKeyId = process.env.GLIA_API_KEY_ID;
const siteId = process.env.GLIA_SITE_ID;

export default async function handler(req, res) {
  // Check for server configuration errors.
  if (!privateKey || !apiKeyId || !siteId) {
    console.error('Missing required environment variables on Vercel.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // --- MOCK USER DATA ---
  // For this test, we are hardcoding the user's details.
  const externalUserId = 'user-12345';
  const userName = 'John Doe';
  const userEmail = 'john.doe@example.com';
  
  const payload = {
    // Subject (the user's unique ID in your system)
    sub: externalUserId, 
    
    // **THE FIX**: Reverting the Issuer (iss) to a simple string, as per Glia's examples.
    // This identifies your system without being a URL.
    iss: 'GliaCEEnvironment', 
    
    // Audience (must be 'gl' and your site ID)
    aud: ['gl', siteId],
    
    // JWT ID (a unique ID for this specific token)
    jti: uuidv4(),
    
    // Issued At (current time in seconds)
    iat: Math.floor(Date.now() / 1000),
    
    // Expiration Time (e.g., 5 minutes from now)
    exp: Math.floor(Date.now() / 1000) + (5 * 60),

    // Custom claims for user information
    name: userName,
    email: userEmail,
  };

  try {
    // Sign the token with your private key using the RS256 algorithm.
    const signedToken = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      // The `kid` (Key ID) in the header is what Glia uses to find your public key.
      header: {
        kid: apiKeyId,
      },
    });

    // Send the correctly signed token back to the front-end.
    res.status(200).json({ token: signedToken });

  } catch (error) {
    console.error('Error signing JWT:', error);
    res.status(500).json({ error: 'Failed to generate authentication token.' });
  }
}