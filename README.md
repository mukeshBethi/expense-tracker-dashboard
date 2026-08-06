# Expense Tracker Dashboard

A dashboard to log your daily expenses and keep track of them, with real email/password
sign-in and cloud storage via Firebase (Auth + Firestore). Built with React and Vite; no
custom backend server is required.

## How to run

```
npm install
npm run dev
```

Then open the printed `http://localhost:...` URL, create an account (or sign in), and start
adding expenses.

To produce an optimized production build (and preview it locally):

```
npm run build
npm run preview
```

### One-time Firebase setup

The project already points at a Firebase project (`expense-tracker-75c88`, config in
`src/firebase.js`). Before first use, in the [Firebase Console](https://console.firebase.google.com):

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Firestore Database** → create a database (production mode).
3. **Firestore → Rules** → paste the following rule so each user can only read/write their
   own data (the app stores everything in a single document at `users/{uid}`, not a
   subcollection):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null
                            && request.auth.uid == userId;
       }
     }
   }
   ```

> Chart.js and the Firebase SDK are npm dependencies bundled into the app by Vite (see
> [Offline use](#offline-use)) — no CDN scripts are loaded at runtime.

## Features

- **Add / edit / delete** expenses — date, amount, category, optional note.
- **Categories** — eight defaults, plus add/remove your own. (A category in use can't be removed.)
- **Filtering** — by category, by date range (this month / last month / this year / all / custom),
  and free-text search on notes. Click the **Date** or **Amount** column headers to sort.
- **Summary cards** — spent this month, spent today, top category, total entries.
- **Charts** — spending by category (doughnut) and a spending trend (bar, by day).
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

Chart.js and the Firebase SDK are regular npm dependencies (see `package.json`), bundled into
the production build by Vite — there are no CDN scripts to swap out. Once `npm run build` has
produced the `dist/` bundle, the app runs fully from that bundle with no additional downloads
(the Firebase Auth/Firestore calls themselves still need network access, of course).

## Deploying to Vercel

Vercel auto-detects the Vite project — no extra config is needed.

```
npm install -g vercel   # one-time
vercel --prod           # from this folder; follow the prompts
```

Or connect the repo in the Vercel dashboard; it will run `npm run build` and serve the `dist/`
output automatically on every push.

Firebase's web config values in `src/firebase.js` (API key, project ID, etc.) are safe to
commit and deploy as-is — they're public client identifiers, not secrets. Access control is
enforced by the Firestore security rules, not by hiding the config.

## Files

| File / folder         | Purpose                                              |
| ---------------------- | ----------------------------------------------------- |
| `index.html`            | Vite entry HTML, mounts the React app                |
| `src/main.jsx`          | React entry point                                     |
| `src/App.jsx`           | Top-level app assembly and layout                     |
| `src/index.css`         | Styling (dark/light dashboard theme)                  |
| `src/firebase.js`       | Firebase project config + Auth/Firestore setup        |
| `src/hooks/`            | `useAuth`, `useExpenseData`, `useTheme`               |
| `src/components/`       | UI components (form, table, charts, dialogs, etc.)    |
| `src/lib/`              | Formatting and validation helpers                     |
| `README.md`             | This file                                             |
