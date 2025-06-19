// This file is located at `/api/generate-glia-token.js`

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// --- CONFIGURATION ---
// These are read from your Vercel Environment Variables.
const privateKey = process.env.GLIA_PRIVATE_KEY;
const apiKeyId = process.env.GLIA_API_KEY_ID;
const siteId = process.env.GLIA_SITE_ID;
const accountId = process.env.GLIA_ACCOUNT_ID; 

export default async function handler(req, res) {
  // Check that this is a POST request.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check for server configuration errors.
  if (!privateKey || !apiKeyId || !siteId || !accountId) {
    console.error('Missing required environment variables on Vercel.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // **THE FIX**: Get the visitor ID from the incoming request body.
  const { visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ error: 'visitorId is required in the request body.' });
  }

  // For Direct ID, the subject should be prefixed with 'visitor:'
  const subject = `visitor:${visitorId}`;

  const payload = {
    // Standard JWT claims
    sub: subject, 
    iss: apiKeyId,
    aud: ['gl', siteId],
    jti: uuidv4(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (5 * 60),
    account_id: accountId,

    // Structuring the `roles` array with the dynamic visitorId
    roles: [
        {
            type: 'visitor',
            visitor_id: visitorId 
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