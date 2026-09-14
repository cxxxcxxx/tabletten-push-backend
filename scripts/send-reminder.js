// Wird von GitHub Actions zeitgesteuert ausgeführt (siehe .github/workflows/daily-reminders.yml).
// Schickt eine feste Erinnerung an die Freundin, unabhängig davon, ob schon abgehakt ist.

async function main() {
  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${process.env.ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      target_channel: 'push',
      include_aliases: { external_id: [process.env.FRIEND_UID] },
      headings: { en: 'Tabletten-Zeit' },
      contents: { en: 'Zeit für deine Tabletten 💊' }
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!data.id) {
    console.error('OneSignal hat keine Notification-ID zurückgegeben – vermutlich kein Fehler, aber bitte prüfen.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
