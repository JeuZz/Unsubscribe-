const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.static('public'));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Step 1: Redirect user to Google
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
  });
  res.redirect(url);
});

// Step 2: Google redirects back here
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
    });

    let results = [];

    for (const msg of messages.data.messages || []) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
