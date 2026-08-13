# 🎯 ME-RIISE QUIZ

A **premium, Kahoot-style real-time quiz platform** for the **ME-RIISE Foundation, Malnad College of Engineering** — built with **HTML5, CSS3 and Vanilla JavaScript** + **Firebase Realtime Database** (live multiplayer) and **Firebase Authentication** (admin). No React, no build step.

> **Kahoot + Modern Gaming UI + ME-RIISE Innovation Platform**

---

## ✨ Highlights

| Area | What you get |
|------|--------------|
| 🎮 **Student** | Join by 6-digit PIN **or QR**, enter Name/College/Dept/Year, live MCQ with countdown, instant feedback, live score, animated leaderboard, final rank + certificate. Mobile-first. |
| 📺 **Host / Projector** | Big-screen lobby with PIN + QR, live joining players, giant question + timer, live answer distribution, animated leaderboard bars, **Top-3 podium** with confetti. |
| 🔐 **Admin** | Secure login, Dashboard, Events, Quizzes, **Question editor** (timers/points/correct answers), Live Games, Participants, Results, Analytics, Certificates, Export. |
| 🏅 **Certificates** | Auto Top-3 detection (🥇 Champion / 🥈 First Runner-Up / 🥉 Second Runner-Up), premium **A4 landscape** certificate with unique ID + **QR verification**, public verify page. |
| 📥 **Export** | Google Sheets (Apps Script webhook) **and** CSV/Excel download. |
| 🎨 **Design** | Deep-navy / electric-blue / cyan, glassmorphism, glowing effects, floating orbs, smooth transitions, number counters, confetti, animated podium. |

---

## 🗂️ Project structure

```
meriise-quiz/
├── index.html            # Landing + join (PIN / QR)
├── student.html          # Student gameplay (mobile-first)
├── host.html             # Host / projector big screen
├── admin.html            # Admin dashboard (SPA)
├── certificate.html      # A4 certificate renderer
├── verify.html           # Public certificate verification
├── css/                  # variables, base, animations, components + per-screen styles
├── js/
│   ├── firebase-config.js   # ← paste your Firebase keys here
│   ├── firebase-service.js  # reactive data layer + live game logic (Firebase OR local fallback)
│   ├── utils.js             # helpers, toasts, modal, confetti, QR, CSV
│   ├── export.js            # CSV / Sheets export
│   ├── sample-data.js       # demo quiz/event
│   ├── student.js · host.js · admin.js · certificate.js · verify.js
├── apps-script/Code.gs   # Google Sheets Web App exporter
├── firebase-rules.json   # Realtime Database security rules
└── README.md
```

---

## 🚀 Quick start (Demo mode — zero config)

The app ships with a **local real-time fallback** (localStorage + `BroadcastChannel`) so it works live **across browser tabs on one machine with no Firebase project**. Great for trying it out.

1. Serve the folder (any static server):
   ```bash
   npx serve .
   # or:  python -m http.server 8080
   ```
2. Open **`/host.html`** → *Load Demo Quiz* → you get a Game PIN.
3. Open **`/student.html`** (or scan the QR / use the PIN on `index.html`) in **another tab / window** → join and play.
4. Drive the game from the host tab: **Start → Reveal → Leaderboard → Next → Finish**.
5. Admin: **`/admin.html`** → login `admin@meriise.in` / `meriise123` (demo credentials).

> A pill in the corner shows **🟡 Demo mode (local)** vs **🟢 Live · Firebase**.

---

## 🔥 Production setup (Firebase)

1. Create a project at **console.firebase.google.com**.
2. **Build → Realtime Database** → create → then paste **`firebase-rules.json`** into the *Rules* tab and Publish.
3. **Build → Authentication → Sign-in method → Email/Password** → enable, then **Add user** (your admin email + password).
4. **Project settings → Your apps → Web app** → copy the config into **`js/firebase-config.js`** (replace every `PASTE_…`).
5. Re-load — the corner pill should read **🟢 Live · Firebase**. Now multiplayer works across real devices.
6. Host on any static host (Firebase Hosting, GitHub Pages, Netlify…).

### Google Sheets export (optional)
1. New Google Sheet → **Extensions → Apps Script** → paste **`apps-script/Code.gs`** → Save.
2. **Deploy → New deployment → Web app** (*Execute as: Me*, *Access: Anyone*) → copy the `/exec` URL.
3. Paste it into `js/firebase-config.js` → `MR.SHEETS_WEBHOOK = "…"`.
4. Admin/Host **Export → Push to Google Sheets** appends every result row.

CSV/Excel download works with **no** setup.

---

## 🎬 Live flow

```
Game PIN → Students Join → Live Question → Countdown → Answer → Lock
        → Reveal Correct → Score → Animated Leaderboard → Next Question
        → Final Results → Top-3 Podium + Certificates
```

## 🧮 Scoring
- **Speed-based:** `points = round(basePoints × (0.5 + 0.5 × speedFactor))` where `speedFactor = 1 − elapsed/duration`. Instant answer ≈ full points, last-second ≈ half.
- **Streak bonus:** +100 per consecutive correct (capped at +500).
- **Host-authoritative:** scores are computed by the host on *Reveal* — clients never write their own score.

---

## 🛡️ Anti-cheat & security

Enforced by `firebase-rules.json`:
- **No duplicate / changed answers** — each `answers/{q}/{player}` node is **write-once** (`!data.exists()`), and answering is also guarded by a client-side transaction.
- **No fake-speed manipulation** — `at` **must equal the server timestamp** (`newData.val() === now`); clients cannot forge a faster time. Scoring uses server time only.
- **Answer nodes are immutable** — reveal writes scores only to player nodes; correctness is derived client-side from the revealed answer, so answer records are never touched again.
- **Admin content protected** — quizzes & events are **write-only for authenticated admins**; reads are public (needed by host/verify).

### Security hardening (STRICT variant)
For maximum integrity, run the **Host while signed in** and lock privileged writes to `auth != null`. Add admin sign-in to `host.html` (reuse `MR.authSvc`) and change, in `firebase-rules.json`, the `players`, `status`, `state`, `currentIndex`, `results`, and `certificates` writes from `true` to `"auth != null"`. Optionally enable **Anonymous Auth** so students carry a uid and can only write their own player/answer node.

---

## 🧩 Architecture notes
- **`MR.data`** is a small reactive DB API (`on/get/set/update/push/transaction/serverTime`) with two interchangeable backends — **Firebase RTDB** and a **local BroadcastChannel** mirror — so every screen has identical live behaviour with or without Firebase.
- **`MR.game`** holds all domain logic (quizzes, events, games, join, submit, reveal/score, leaderboard, finalize, certificates).
- Everything is framework-free, modular and namespaced under `window.MR`.

---

## 👤 Demo admin credentials (local mode only)
`admin@meriise.in` · `meriise123` — replace by enabling Firebase Email/Password auth in production.

---

Built with 💙 for **ME-RIISE Foundation**, Malnad College of Engineering, Hassan.
