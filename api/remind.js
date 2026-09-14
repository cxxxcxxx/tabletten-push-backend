// Vercel Serverless Function: POST /api/remind
// Wird vom "Jetzt erinnern"-Button in plan-editor.html aufgerufen.
// Sicherheit: prüft das mitgeschickte Firebase-Login-Token und lässt nur
// den Owner-Account durch (kein extra Passwort nötig, nutzt euer Login).

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace('Bearer ', '');
  if (!idToken) {
    return res.status(401).json({ error: 'Kein Token mitgeschickt' });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (e) {
    return res.status(401).json({ error: 'Ungültiges Token' });
  }

  if (decoded.email !== process.env.OWNER_EMAIL) {
    return res.status(403).json({ error: 'Nicht berechtigt' });
  }

  try {
    const r = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        target_channel: 'push',
        include_aliases: { external_id: [process.env.FRIEND_UID] },
        headings: { en: 'Tabletten-Tracker' },
        contents: { en: 'Kleine Erinnerung: bitte kurz die Tabletten checken 💊' }
      })
    });
    const data = await r.json();
    if (!data.id) {
      return res.status(502).json({ error: 'OneSignal hat nichts gesendet', data });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
