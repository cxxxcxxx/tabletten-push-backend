# Push-Backend (OneSignal + GitHub Actions + Vercel)

Drei Teile:
- `scripts/send-reminder.js` – tägliche feste Erinnerung an die Freundin (3x/Tag)
- `scripts/check-missed.js` – einmal täglich prüfen, ob alles abgehakt wurde; falls nicht, Push an dich
- `api/remind.js` – Vercel-Funktion für den manuellen "Jetzt erinnern"-Button im Plan-Editor

## 1. Neues, eigenes GitHub-Repo anlegen

Diesen Ordner (`pushbackend/`) als eigenständiges Repo hochladen, z.B.:
```
git init
git add .
git commit -m "Push-Backend"
git remote add origin <dein-neues-leeres-repo>
git push -u origin main
```

**Empfehlung:** Repo als **public** anlegen. Das kostet nichts extra bei GitHub
Actions (öffentliche Repos haben unbegrenzte kostenlose Minuten), und es
stehen keine echten Geheimnisse im Code – die liegen alle in "Secrets"
(siehe unten), die auch in einem öffentlichen Repo nicht sichtbar sind.

## 2. GitHub Secrets eintragen

Im Repo: **Settings → Secrets and variables → Actions → New repository secret**.
Vier Secrets anlegen:

| Name | Wert |
|---|---|
| `ONESIGNAL_APP_ID` | `ba4a9b39-f1e2-4e7b-99e1-14946c103af8` |
| `ONESIGNAL_REST_API_KEY` | dein REST API Key aus OneSignal (Settings → Keys & IDs) |
| `FRIEND_UID` | `bKhamgvqvjQ9Jsf9GciQjHf72UA2` |
| `OWNER_UID` | `i4l0MdPA16UZJhW8rd5EKSDbOzW2` |
| `FIREBASE_SERVICE_ACCOUNT` | siehe Schritt 3 |

## 3. Firebase Service Account erstellen (für den "nicht abgehakt"-Check)

1. Firebase-Konsole → Projekteinstellungen (Zahnrad) → **Dienstkonten**
2. **Neuen privaten Schlüssel generieren** → lädt eine JSON-Datei herunter
3. Den **kompletten Inhalt** dieser JSON-Datei als Wert für das Secret
   `FIREBASE_SERVICE_ACCOUNT` eintragen (die ganze JSON als ein String)
4. Diese Datei danach lokal löschen bzw. nicht in irgendein Repo committen –
   sie erlaubt vollen Admin-Zugriff auf eure Firestore-Datenbank

## 4. Testen, ohne auf die Uhrzeit zu warten

Im GitHub-Repo → Tab **Actions** → den jeweiligen Workflow auswählen →
**Run workflow** – läuft sofort, unabhängig vom Zeitplan. So siehst du
direkt, ob eine Push ankommt, ohne bis abends zu warten.

## 5. Vercel-Funktion für den manuellen Button deployen

1. Auf vercel.com mit GitHub einloggen, **dieses selbe Repo** importieren
2. Unter **Settings → Environment Variables** dieselben Werte eintragen wie
   oben bei GitHub Secrets, plus zusätzlich:
   - `OWNER_EMAIL` = deine Login-E-Mail (dieselbe wie `OWNER_EMAIL` im Plan-Editor-Code)
3. Deploy abwarten – Vercel zeigt dir danach eine URL wie
   `https://dein-projekt.vercel.app`
4. Diese URL brauchst du gleich im `plan-editor.html`-Code (Konstante
   `REMIND_ENDPOINT`) – dort `.../api/remind` anhängen, also z.B.
   `https://dein-projekt.vercel.app/api/remind`

## Reminder-Zeiten anpassen

Die drei täglichen Uhrzeiten stehen als Kommentar in
`.github/workflows/daily-reminders.yml` (aktuell angenommen: ca. 7/13/20 Uhr).
Die "nicht abgehakt"-Prüfzeit steht in `missed-check.yml` (aktuell ca. 21 Uhr).
Beides sind nur Annahmen von mir – sag mir die echten Wunschzeiten, dann
passe ich die Cron-Werte gezielt an.
