# 🚀 Deploying ME-RIISE QUIZ to `quiz.meriise.org`

The site is 100% static (HTML/CSS/JS) with Firebase for the live backend, so it can be hosted anywhere. Below is the **recommended Firebase Hosting** path (most integrated, free, HTTPS + global CDN), followed by DNS for the subdomain and alternatives.

---

## ✅ Before you deploy — make it "Live" (one-time)

1. **Paste your Firebase web config** into [`js/firebase-config.js`](js/firebase-config.js) — replace every `PASTE_…`. The corner pill must read **🟢 Live · Firebase** (not 🟡 Demo).
2. **Realtime Database → Rules:** these ship in [`firebase-rules.json`](firebase-rules.json) and deploy automatically (see below).
3. **Authentication → Sign-in method → Email/Password:** enable it and **Add user** (your admin email + password). The demo `admin@meriise.in` only works in local mode.
4. **Authentication → Settings → Authorized domains:** add **`quiz.meriise.org`** (and `localhost` for testing). *Admin login will silently fail on the live domain until this is added.*
5. *(Optional)* Google Sheets export: deploy [`apps-script/Code.gs`](apps-script/Code.gs) and paste the `/exec` URL into `MR.SHEETS_WEBHOOK` in `js/firebase-config.js`.

---

## 🔥 Option A — Firebase Hosting (recommended)

### 1. Install the CLI & sign in
```bash
npm install -g firebase-tools
firebase login
```

### 2. Point the project at yours
Edit [`.firebaserc`](.firebaserc) → replace `PASTE_YOUR_FIREBASE_PROJECT_ID` with your Firebase **Project ID**
(or run `firebase use --add` and pick it).

### 3. Deploy (site + database rules in one shot)
```bash
firebase deploy --only hosting,database
```
You'll get a live URL like `https://<project>.web.app`. Test it there first.

### 4. Connect the custom subdomain
Firebase Console → **Hosting → Add custom domain** → enter **`quiz.meriise.org`** → Continue.
Firebase shows the exact DNS records to create. Typically:

| Type | Host / Name | Value |
|------|-------------|-------|
| `TXT` | `quiz` (or `quiz.meriise.org`) | *verification string Firebase shows* |
| `A` | `quiz` | `151.101.1.195` |
| `A` | `quiz` | `151.101.65.195` |

> Firebase shows **your** exact values — always copy them from the console, don't hard-code the above.

Add those records at whoever manages `meriise.org` DNS (see the DNS section below), click **Verify**, then wait for Firebase to auto-provision the free SSL certificate (minutes → up to 24h). Done — `https://quiz.meriise.org` is live.

### Redeploying after changes
```bash
firebase deploy --only hosting          # site only
firebase deploy --only database         # rules only
```

---

## 🌐 Adding the DNS record for the subdomain

You only touch the **`quiz`** subdomain — the main `meriise.org` site is untouched. Find where `meriise.org`'s DNS is managed and add the record your host asks for:

- **Cloudflare:** DNS → Add record → `A`/`CNAME`, Name `quiz`. For Firebase A-records set proxy to **DNS only (grey cloud)** during verification.
- **GoDaddy / Namecheap / Hostinger / Google Domains:** DNS management → Add record → Name/Host `quiz`.
- **cPanel host:** Zone Editor → add the record for `quiz`.

A subdomain that points to a hosting provider = a **CNAME** (e.g. Netlify/Vercel/GitHub Pages) or **A records** (Firebase). Use exactly what the host's dashboard specifies.

---

## 🟣 Option B — Netlify / Vercel / Cloudflare Pages
1. Push this repo to GitHub, "Import project", framework = **None / static**, publish directory = repo root. No build command.
2. Add custom domain `quiz.meriise.org` in the host dashboard → it gives you a **CNAME** target → add `CNAME quiz → <target>` in DNS.
3. Still do the **"Before you deploy"** steps (Firebase config + authorized domain `quiz.meriise.org`).

## ⚫ Option C — GitHub Pages
1. Repo → Settings → Pages → deploy from branch (`main`, root).
2. Set custom domain `quiz.meriise.org` (writes a `CNAME` file) → add `CNAME quiz → <user>.github.io` in DNS.
3. Same "Before you deploy" steps.

## 🟠 Option D — Existing cPanel / shared host for meriise.org
1. cPanel → **Subdomains** → create `quiz` (root e.g. `/home/user/quiz.meriise.org`).
2. Upload **all files/folders** (index.html, css/, js/, assets/, etc.) via File Manager/FTP into that folder.
3. Same "Before you deploy" steps. (Firebase DB still runs in the cloud; the host only serves static files.)

---

## 🔒 Production hardening reminder
Default rules keep the two competitive-integrity guarantees (no duplicate answers, no timing forgery) but leave score fields broadly writable so the unauthenticated Host works. For a real event, add admin sign-in to `host.html` and flip the relevant writes to `auth != null` — see **Security hardening** in [README.md](README.md).
