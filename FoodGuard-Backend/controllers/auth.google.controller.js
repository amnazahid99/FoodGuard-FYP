const asyncHandler = require('express-async-handler');
const { signAccessToken, signRefreshToken } = require('../utils/generateToken');
const User = require('../models/User');

exports.googleLoginUrl = asyncHandler(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'Google OAuth not configured' });
  }
  const redirectUri = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/google/callback`;
  const scope = 'openid email profile';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;
  res.redirect(authUrl);
});

exports.googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.send(`
      <html><body><script>
        window.opener.postMessage({ type: 'google-auth-error', error: 'No authorization code' }, '${process.env.CLIENT_URL || 'http://localhost:3000'}');
        window.close();
      </script></body></html>
    `);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/google/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return res.send(`
        <html><body><script>
          window.opener.postMessage({ type: 'google-auth-error', error: 'Google auth failed: ${err.substring(0,100)}' }, '${process.env.CLIENT_URL || 'http://localhost:3000'}');
          window.close();
        </script></body></html>
      `);
    }

    const tokenData = await tokenRes.json();
    const id_token = tokenData.id_token || tokenData.access_token;

    // Get user info
    const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenData.access_token}`);
    if (!userInfoRes.ok) {
      return res.send(`
        <html><body><script>
          window.opener.postMessage({ type: 'google-auth-error', error: 'Failed to get user info' }, '${process.env.CLIENT_URL || 'http://localhost:3000'}');
          window.close();
        </script></body></html>
      `);
    }

    const googleUser = await userInfoRes.json();
    
    let user = await User.findOne({ email: googleUser.email });
    if (!user) {
      // Create new user with Google info
      user = await User.create({
        name: googleUser.name || 'Google User',
        email: googleUser.email,
        password: Math.random().toString(36).substring(2, 15),
        avatar: googleUser.picture || '',
      });
    }

    const token = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    const userData = user.toObject ? user.toObject() : user;
    
    // Return HTML page that closes window and passes token to opener
    res.send(`
      <html><body><script>
        window.opener.postMessage({ 
          type: 'google-auth-success', 
          token: '${token}', 
          refreshToken: '${refreshToken}',
          user: ${JSON.stringify(userData)}
        }, '${process.env.CLIENT_URL || 'http://localhost:3000'}');
        window.close();
      </script></body></html>
    `);
  } catch (err) {
    console.error('[Google OAuth] error:', err.message);
    res.send(`
      <html><body><script>
        window.opener.postMessage({ type: 'google-auth-error', error: 'Authentication error' }, '${process.env.CLIENT_URL || 'http://localhost:3000'}');
        window.close();
      </script></body></html>
    `);
  }
});