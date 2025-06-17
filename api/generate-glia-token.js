// This file would typically be located at `/api/generate-glia-token.js`
// in a Vercel or Netlify project.

// You need to install these dependencies: `npm install jsonwebtoken`
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // To generate a unique ID for each token

// --- CONFIGURATION ---

// IMPORTANT: Your private key should be stored as a secret environment variable,
// NOT hardcoded in your file.
// On Vercel/Netlify, you would set an environment variable named `GLIA_PRIVATE_KEY`.
// It should contain the full content of your `private_key.pem` file.
const privateKey = process.env.GLIA_PRIVATE_KEY;

// Your Key ID and Secret from the Glia API settings page in the admin console.
// These should also be stored as environment variables.
const apiKeyId = process.env.GLIA_API_KEY_ID;
const apiKeySecret = process.env.GLIA_API_KEY_SECRET; // This might not be needed for JWT signing itself but good practice

// Your Site ID from Glia admin console.
const siteId = process.env.GLIA_SITE_ID;

// This is the function that will be executed when the endpoint is requested.
// `req` is the incoming request, `res` is the response we send back.
export default async function handler(req, res) {
  // Check if the private key is configured on the server
  if (!privateKey) {
    console.error('GLIA_PRIVATE_KEY environment variable not set.');
    return res.status(500).json({ error: 'Server configuration error: Missing private key.' });
  }

  // --- MOCK USER DATA ---
  // In a real application, this user would be authenticated with your system.
  // For this test environment, we can hardcode the user's details.
  const externalUserId = 'user-12345'; // A unique ID from your system
  const userName = 'John Doe';
  const userEmail = 'john.doe@example.com';
  
  // The JWT payload must contain specific "claims" as required by Glia.
  const payload = {
    // Subject (the user's unique ID in your system)
    sub: externalUserId, 
    // Issuer (Your company/domain name)
    iss: 'YourCompanyName', 
    // Audience (must be 'gl', your site ID)
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
    // You can add other custom attributes here
  };

  try {
    // Sign the token with your private key using the RS256 algorithm
    const signedToken = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      // The `kid` (Key ID) in the header must be your Glia API Key ID
      header: {
        kid: apiKeyId,
      },
    });

    // Send the signed token back to the front-end in a JSON response
    res.status(200).json({ token: signedToken });

  } catch (error) {
    console.error('Error signing JWT:', error);
    res.status(500).json({ error: 'Failed to generate authentication token.' });
  }
}