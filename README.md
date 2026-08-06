# Expense Tracker Dashboard

A dashboard to log your daily expenses and keep track of them, with real email/password
sign-in and cloud storage via Firebase (Auth + Firestore). No custom backend server and no
build step — the Firebase Web SDK is loaded straight from a CDN as ES modules.

## How to run

Because the app now uses ES module imports, open it via a local server rather than
double-clicking the file:

```
npx serve .
```

Then open the printed `http://localhost:...` URL, create an account (or sign in), and start
adding expenses.

### One-time Firebase setup

The project already points at a Firebase project (`expense-tracker-75c88`, config in
`firebase-config.js`). Before first use, in the [Firebase Console](https://console.firebase.google.com):

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Firestore Database** → create a database (production mode).
3. **Firestore → Rules** → paste the rule shown at the top of `firebase-config.js` so each
   user can only read/write their own data.

> First load needs an internet connection to fetch the charting library (Chart.js) and the
> Firebase SDK from CDNs. See [Offline use](#offline-use) for Chart.js.

## Features

- **Add / edit / delete** expenses — date, amount, category, optional note.
- **Categories** — eight defaults, plus add/remove your own. (A category in use can't be removed.)
- **Filtering** — by category, by date range (this month / last month / this year / all / custom),
  and free-text search on notes. Click the **Date** or **Amount** column headers to sort.
- **Summary cards** — spent this month, spent today, top category, total entries.
- **Charts** — spending by category (doughnut) and a spending trend (bar, by day or month).
  Charts reflect whatever filter is active.
- **Monthly budgets & alerts** — set a limit per category. Progress bars turn amber at 90%
  and red when over; a banner at the top warns about any category that's over budget this month.
- **Export CSV** — downloads the currently filtered expenses (opens cleanly in Excel).

## Where is my data?

Your expenses, categories, and budgets are stored in Firestore under a document scoped to your
signed-in account (`users/{your-uid}`), so they follow you across devices and browsers as long
as you sign in with the same account. Firestore security rules ensure only you can read or
write your own document.

- Use **Export CSV** periodically if you want a local backup.
- The footer has a **Clear all data** link to wipe everything and start over.

## Offline use

The only external dependency is Chart.js, loaded from a CDN in `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
```

To work fully offline, download that file next to the other files (e.g. as `chart.umd.min.js`)
and change the line to:

```html
<script src="chart.umd.min.js"></script>
```

## Deploying to Vercel

No build step is needed — this is deployed as a static site.

```
npm install -g vercel   # one-time
vercel                  # from this folder; follow the prompts
```

Firebase's web config values in `firebase-config.js` (API key, project ID, etc.) are safe to
commit and deploy as-is — they're public client identifiers, not secrets. Access control is
enforced by the Firestore security rules, not by hiding the config.

## Files

| File                 | Purpose                                          |
| -------------------- | ------------------------------------------------- |
| `index.html`         | Page layout / markup                              |
| `styles.css`         | Styling (dark dashboard theme)                    |
| `app.js`             | App logic: auth, Firestore persistence, charts    |
| `firebase-config.js` | Firebase project config + Auth/Firestore setup    |
| `README.md`          | This file                                          |
