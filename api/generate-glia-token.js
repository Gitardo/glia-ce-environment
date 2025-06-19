// This file is located at `/api/generate-glia-token.js`

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// --- CONFIGURATION ---
// These are read from your Vercel Environment Variables.
const privateKey = process.env.GLIA_PRIVATE_KEY;
const apiKeyId = process.env.GLIA_API_KEY_ID;
const siteId = process.env.GLIA_SITE_ID;
// **NEW**: You will need to add this to your Vercel Environment Variables.
const accountId = process.env.GLIA_ACCOUNT_ID; 

export default async function handler(req, res) {
  // Check for server configuration errors.
  if (!privateKey || !apiKeyId || !siteId || !accountId) {
    console.error('Missing required environment variables on Vercel.');
    return res.status(500).json({ error: 'Server configuration error. Ensure GLIA_ACCOUNT_ID is set.' });
  }

  // --- MOCK USER DATA ---
  // For this test, we are hardcoding the user's details.
  const externalUserId = 'user-12345';
  
  const payload = {
    // Standard JWT claims
    sub: externalUserId, 
    iss: 'DirectID Authentication', // Using a simple string as the issuer.
    aud: ['gl', siteId],
    jti: uuidv4(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (5 * 60),

    // Account ID, as seen in the working example token.
    account_id: accountId,

    // **THE FIX**: Structuring the `roles` array as an array of objects.
    // We are creating a simple "visitor" role for the authenticated user.
    roles: [
        {
            type: 'visitor',
            visitor_id: externalUserId 
        },
        {
            type: 'site_visitor',
            site_id: siteId
        }
    ]
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