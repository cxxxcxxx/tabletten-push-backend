// Wird von GitHub Actions einmal täglich ausgeführt (siehe .github/workflows/missed-check.yml).
// Schaut in Firestore nach, ob der heutige Plan komplett abgehakt ist.
// Falls nicht: schickt DIR (nicht der Freundin) eine Push-Benachrichtigung.

import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});
const db = admin.firestore();

function berlinNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
}

async function main() {
  const now = berlinNow();
  const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const day = now.getDate();
  const dateKey = monthKey + '-' + String(day).padStart(2, '0');

  const planSnap = await db.collection('plans').doc(monthKey).get();
  const plan = planSnap.exists ? planSnap.data() : {};
  const dayPlan = plan[day] || { morgens: [], mittags: [], abends: [] };

  const checksSnap = await db.collection('checkins').doc(dateKey).get();
  const checks = checksSnap.exists ? checksSnap.data() : {};

  let total = 0, done = 0;
  ['morgens', 'mittags', 'nachmittags', 'abends'].forEach((b) => {
    (dayPlan[b] || []).forEach((m, i) => {
      total++;
      if (checks[b] && checks[b][i]) done++;
    });
  });

  console.log(`Heute (${dateKey}): ${done}/${total} abgehakt.`);

  if (total > 0 && done < total) {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        target_channel: 'push',
        include_aliases: { external_id: [process.env.OWNER_UID] },
        headings: { en: 'Tabletten-Tracker' },
        contents: { en: `Noch nicht alles abgehakt: ${done}/${total} heute.` }
      })
    });
    console.log(JSON.stringify(await res.json(), null, 2));
  } else {
    console.log('Alles abgehakt (oder kein Plan hinterlegt) – keine Erinnerung nötig.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
