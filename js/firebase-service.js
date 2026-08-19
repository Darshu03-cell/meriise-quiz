/* ============================================================
   ME-RIISE QUIZ — Data & real-time service layer
   ------------------------------------------------------------
   Exposes MR.data (reactive DB), MR.authSvc, and MR.game.
   Two interchangeable backends:
     • FirebaseBackend  — real Firebase RTDB + Auth (production)
     • LocalBackend     — localStorage + BroadcastChannel, mirrors
                          the same reactive API so the whole app
                          works live across browser tabs with NO
                          Firebase project (great for demos/dev).
   ============================================================ */
window.MR = window.MR || {};

(function () {
  const configured = MR.initFirebase();

  /* ============================================================
     REACTIVE DATA LAYER
     ============================================================ */

  /* ---------- Firebase backend ---------- */
  function FirebaseBackend() {
    const db = MR.db;
    const val = (snap) => snap.val();
    return {
      serverTime: firebase.database.ServerValue.TIMESTAMP,
      on(path, cb) {
        const ref = db.ref(path);
        const handler = ref.on('value', s => cb(val(s)));
        return () => ref.off('value', handler);
      },
      async get(path) { return val(await db.ref(path).get()); },
      set(path, v) { return db.ref(path).set(v); },
      update(path, v) { return db.ref(path).update(v); },
      remove(path) { return db.ref(path).remove(); },
      async push(path, v) { const r = db.ref(path).push(); await r.set(v); return r.key; },
      async transaction(path, fn) {
        const res = await db.ref(path).transaction(fn);
        return { committed: res.committed, value: res.snapshot.val() };
      }
    };
  }

  /* ---------- Local backend (localStorage + BroadcastChannel) ---------- */
  function LocalBackend() {
    const KEY = 'meriise_quiz_db';
    const channel = ('BroadcastChannel' in window) ? new BroadcastChannel('meriise_quiz') : null;
    const subs = new Map(); // path -> Set<cb>
    let store = load();

    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
    function persist() { localStorage.setItem(KEY, JSON.stringify(store)); }
    function parts(path) { return String(path).split('/').filter(Boolean); }

    function getByPath(path) {
      let node = store;
      for (const p of parts(path)) { if (node == null || typeof node !== 'object') return null; node = node[p]; }
      return node === undefined ? null : node;
    }
    function setByPath(path, v) {
      const ps = parts(path);
      if (!ps.length) { store = v || {}; return; }
      let node = store;
      for (let i = 0; i < ps.length - 1; i++) {
        if (typeof node[ps[i]] !== 'object' || node[ps[i]] === null) node[ps[i]] = {};
        node = node[ps[i]];
      }
      if (v === null || v === undefined) delete node[ps[ps.length - 1]];
      else node[ps[ps.length - 1]] = v;
    }

    function notifyLocal() { subs.forEach((set, path) => { const v = getByPath(path); set.forEach(cb => cb(clone(v))); }); }
    function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

    function afterWrite() {
      persist();
      notifyLocal();
      channel && channel.postMessage({ t: Date.now() });
    }

    if (channel) channel.onmessage = () => { store = load(); notifyLocal(); };
    window.addEventListener('storage', e => { if (e.key === KEY) { store = load(); notifyLocal(); } });

    return {
      serverTime: '__SERVER_TIME__', // resolved on write
      _resolveServerTime(v) {
        if (v === '__SERVER_TIME__') return Date.now();
        if (v && typeof v === 'object') { const o = Array.isArray(v) ? [] : {}; for (const k in v) o[k] = this._resolveServerTime(v[k]); return o; }
        return v;
      },
      on(path, cb) {
        if (!subs.has(path)) subs.set(path, new Set());
        subs.get(path).add(cb);
        Promise.resolve().then(() => cb(clone(getByPath(path)))); // initial
        return () => { const s = subs.get(path); s && s.delete(cb); };
      },
      async get(path) { return clone(getByPath(path)); },
      async set(path, v) { setByPath(path, this._resolveServerTime(v)); afterWrite(); },
      async update(path, v) {
        // Mirrors Firebase multi-path update: keys may contain "/" for deep writes.
        const resolved = this._resolveServerTime(v);
        const base = (path === '/' || path === '') ? '' : String(path).replace(/\/$/, '') + '/';
        for (const k in resolved) setByPath(base + k, resolved[k]);
        afterWrite();
      },
      async remove(path) { setByPath(path, null); afterWrite(); },
      async push(path, v) {
        const key = '-' + MR.util.uid(16) + Date.now().toString(36);
        setByPath(path + '/' + key, this._resolveServerTime(v)); afterWrite(); return key;
      },
      async transaction(path, fn) {
        store = load(); // fresh read to reduce races
        const cur = clone(getByPath(path));
        const next = fn(cur);
        if (next === undefined) return { committed: false, value: cur };
        setByPath(path, this._resolveServerTime(next)); afterWrite();
        return { committed: true, value: next };
      }
    };
  }

  const backend = configured ? FirebaseBackend() : LocalBackend();
  MR.backendMode = configured ? 'firebase' : 'local';

  // Shared server clock so every device counts down in sync.
  MR._offset = 0;
  if (configured) MR.db.ref('.info/serverTimeOffset').on('value', s => { MR._offset = s.val() || 0; });
  MR.serverNow = () => Date.now() + MR._offset;

  MR.data = {
    serverTime: backend.serverTime,
    on: (p, cb) => backend.on(p, cb),
    get: (p) => backend.get(p),
    set: (p, v) => backend.set(p, v),
    update: (p, v) => backend.update(p, v),
    remove: (p) => backend.remove(p),
    push: (p, v) => backend.push(p, v),
    transaction: (p, fn) => backend.transaction(p, fn),
  };

  /* ============================================================
     AUTH SERVICE
     ============================================================ */
  MR.authSvc = configured ? (function FirebaseAuth() {
    const A = () => (MR.auth = MR.auth || firebase.auth()); // lazy: only created when admin uses it
    return {
      login: (email, pw) => A().signInWithEmailAndPassword(email, pw),
      logout: () => A().signOut(),
      onChange: (cb) => A().onAuthStateChanged(u => cb(u ? { email: u.email, uid: u.uid } : null)),
      current: () => { const u = A().currentUser; return u ? { email: u.email, uid: u.uid } : null; }
    };
  })() : (function LocalAuth() {
    // Demo admin — CHANGE in production by enabling Firebase Auth.
    const DEMO = { email: 'admin@meriise.in', pw: 'meriise123' };
    const K = 'meriise_admin_session';
    const listeners = new Set();
    const emit = () => { const u = current(); listeners.forEach(cb => cb(u)); };
    const current = () => { try { return JSON.parse(localStorage.getItem(K)); } catch { return null; } };
    function login(email, pw) {
      return new Promise((res, rej) => setTimeout(() => {
        if (email.trim().toLowerCase() === DEMO.email && pw === DEMO.pw) {
          const u = { email: DEMO.email, uid: 'demo-admin' };
          localStorage.setItem(K, JSON.stringify(u)); emit(); res(u);
        } else rej(new Error('Invalid email or password'));
      }, 500));
    }
    function logout() { localStorage.removeItem(K); emit(); return Promise.resolve(); }
    function onChange(cb) { listeners.add(cb); Promise.resolve().then(() => cb(current())); return () => listeners.delete(cb); }
    return { login, logout, onChange, current, DEMO };
  })();

  /* ============================================================
     DOMAIN SERVICE — quizzes, events, games, live logic
     ============================================================ */
  const D = MR.data;

  MR.game = {
    /* ---------- Quizzes ---------- */
    async createQuiz(q) {
      const id = MR.util.uid(10);
      const now = Date.now();
      const quiz = { id, title: q.title || 'Untitled Quiz', event: q.event || '', eventId: q.eventId || '',
        description: q.description || '', timePerQuestion: q.timePerQuestion || 20, pointsPerQuestion: q.pointsPerQuestion || 1000,
        questions: q.questions || [], createdAt: now, updatedAt: now };
      await D.set('quizzes/' + id, quiz);
      return id;
    },
    updateQuiz(id, patch) { return D.update('quizzes/' + id, { ...patch, updatedAt: Date.now() }); },
    deleteQuiz(id) { return D.remove('quizzes/' + id); },
    getQuiz(id) { return D.get('quizzes/' + id); },
    onQuizzes(cb) { return D.on('quizzes', v => cb(objToArr(v))); },

    /* ---------- Events ---------- */
    async createEvent(e) {
      const id = MR.util.uid(10);
      const ev = { id, name: e.name || 'Untitled Event', date: e.date || '', venue: e.venue || '',
        description: e.description || '', createdAt: Date.now() };
      await D.set('events/' + id, ev); return id;
    },
    updateEvent(id, patch) { return D.update('events/' + id, patch); },
    deleteEvent(id) { return D.remove('events/' + id); },
    onEvents(cb) { return D.on('events', v => cb(objToArr(v))); },

    /* ---------- Games (host) ---------- */
    async createGame(quiz, hostId = 'host') {
      let pin, exists = true, tries = 0;
      while (exists && tries++ < 12) { pin = MR.util.genPin(); exists = !!(await D.get('games/' + pin + '/pin')); }
      const certMode = quiz.certMode || (quiz.issueCertificates === false ? 'off' : 'all'); // 'all' | 'top3' | 'off'
      const game = {
        pin, quizId: quiz.id, quizTitle: quiz.title, event: quiz.event || '', hostId,
        certMode, issueCertificates: certMode !== 'off',
        status: 'lobby', currentIndex: -1, totalQuestions: (quiz.questions || []).length,
        timePerQuestion: quiz.timePerQuestion || 20, pointsPerQuestion: quiz.pointsPerQuestion || 1000,
        quiz: { title: quiz.title, event: quiz.event || '', questions: quiz.questions || [],
                timePerQuestion: quiz.timePerQuestion || 20, pointsPerQuestion: quiz.pointsPerQuestion || 1000 },
        state: { index: -1, startAt: 0, endAt: 0, locked: true, revealed: false },
        createdAt: Date.now()
      };
      await D.set('games/' + pin, game);
      return pin;
    },
    onGame(pin, cb) { return D.on('games/' + pin, cb); },
    onGameField(pin, field, cb) { return D.on('games/' + pin + '/' + field, cb); },
    getGame(pin) { return D.get('games/' + pin); },

    async gameExists(pin) { const s = await D.get('games/' + pin + '/status'); return !!s; },

    // Host advances to a question
    async startQuestion(pin, index) {
      const game = await D.get('games/' + pin);
      if (!game) return;
      const dur = (game.quiz.timePerQuestion || 20) * 1000;
      const startAt = MR.serverNow(); // server-aligned clock so every device agrees
      await D.update('games/' + pin, {
        status: 'question', currentIndex: index,
        state: { index, startAt, endAt: startAt + dur, locked: false, revealed: false }
      });
    },
    async lockQuestion(pin) {
      await D.update('games/' + pin + '/state', { locked: true });
    },

    // Host reveals correct answer & computes scores (authoritative, runs once)
    async revealQuestion(pin) {
      const game = await D.get('games/' + pin);
      if (!game || game.state.revealed) return game;
      const idx = game.currentIndex;
      const q = game.quiz.questions[idx];
      const base = game.quiz.pointsPerQuestion || 1000;
      const dur = (game.quiz.timePerQuestion || 20) * 1000;
      const answers = (game.answers && game.answers[idx]) || {};
      const players = game.players || {};
      const updates = {};

      Object.entries(answers).forEach(([pid, a]) => {
        if (!players[pid]) return;
        const correct = a.choice === q.correct;
        const elapsed = Math.max(0, (a.at || game.state.startAt) - game.state.startAt);
        const speed = Math.max(0, 1 - Math.min(1, elapsed / dur));
        const points = correct ? Math.round(base * (0.5 + 0.5 * speed)) : 0;
        const p = players[pid];
        const prevStreak = p.streak || 0;
        const streak = correct ? prevStreak + 1 : 0;
        const streakBonus = correct && streak >= 2 ? Math.min(500, (streak - 1) * 100) : 0;
        const gained = points + streakBonus;
        updates[`games/${pin}/players/${pid}/score`] = (p.score || 0) + gained;
        updates[`games/${pin}/players/${pid}/correctCount`] = (p.correctCount || 0) + (correct ? 1 : 0);
        updates[`games/${pin}/players/${pid}/answeredCount`] = (p.answeredCount || 0) + 1;
        updates[`games/${pin}/players/${pid}/streak`] = streak;
        updates[`games/${pin}/players/${pid}/lastGain`] = gained;
        // NOTE: answer nodes are intentionally left immutable (write-once) so the
        // security rules can block any tampering. Correctness is derived client-side
        // from the (now revealed) question's correct index + the player's own choice.
      });
      // players who didn't answer -> break streak
      Object.keys(players).forEach(pid => {
        if (!answers[pid]) {
          updates[`games/${pin}/players/${pid}/streak`] = 0;
          updates[`games/${pin}/players/${pid}/lastGain`] = 0;
        }
      });
      updates[`games/${pin}/state/locked`] = true;
      updates[`games/${pin}/state/revealed`] = true;
      updates[`games/${pin}/status`] = 'reveal';
      await D.update('/', updates);
      return D.get('games/' + pin);
    },

    showLeaderboard(pin) { return D.set('games/' + pin + '/status', 'leaderboard'); },

    async endGame(pin) {
      await D.update('games/' + pin, { status: 'ended', endedAt: Date.now() });
      return this.finalizeResults(pin);
    },

    /* ---------- Student ---------- */
    async joinGame(pin, player) {
      const status = await D.get('games/' + pin + '/status');
      if (!status) throw new Error('Game PIN not found');
      if (status !== 'lobby') throw new Error('This game has already started');
      const pid = MR.util.uid(14);
      const rec = { id: pid, name: player.name, college: player.college, department: player.department,
        year: player.year, score: 0, correctCount: 0, answeredCount: 0, streak: 0, lastGain: 0, joinedAt: Date.now() };
      await D.set(`games/${pin}/players/${pid}`, rec);
      return pid;
    },
    onPlayers(pin, cb) { return D.on('games/' + pin + '/players', v => cb(objToArr(v))); },
    onPlayer(pin, pid, cb) { return D.on(`games/${pin}/players/${pid}`, cb); },
    leaveGame(pin, pid) { return D.remove(`games/${pin}/players/${pid}`); },

    // Submit answer — atomic, first-write-wins (prevents duplicates & changes)
    async submitAnswer(pin, index, pid, choice) {
      const st = await D.get('games/' + pin + '/state');
      if (!st || st.locked || st.index !== index) return { ok: false, reason: 'locked' };
      if (st.endAt && MR.serverNow() > st.endAt + 800) return { ok: false, reason: 'timeup' };
      const res = await D.transaction(`games/${pin}/answers/${index}/${pid}`, (cur) => {
        if (cur) return undefined; // already answered -> abort
        return { choice, at: D.serverTime };
      });
      return { ok: res.committed, reason: res.committed ? '' : 'duplicate' };
    },
    onAnswers(pin, index, cb) { return D.on(`games/${pin}/answers/${index}`, v => cb(v || {})); },

    /* ---------- Results & certificates ---------- */
    async finalizeResults(pin) {
      const game = await D.get('games/' + pin);
      if (!game) return null;
      // Resolve certificate mode ('all' | 'top3' | 'off'). Prefer the game's stored setting;
      // for older games created before this field existed, fall back to the quiz's current
      // setting so "None" is always honored and no unwanted certificates are generated.
      let certMode = game.certMode;
      if (!certMode) {
        const quiz = game.quizId ? await D.get('quizzes/' + game.quizId) : null;
        certMode = (quiz && quiz.certMode)
          || ((game.issueCertificates === false || (quiz && quiz.issueCertificates === false)) ? 'off' : 'all');
      }
      const players = objToArr(game.players).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
      const total = game.totalQuestions || 1;
      const achievements = ['🥇 Quiz Champion', '🥈 First Runner-Up', '🥉 Second Runner-Up'];
      const rows = [];
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const rank = i + 1;
        const acc = MR.util.accuracy(p.correctCount || 0, p.answeredCount || total);
        const achievement = rank <= 3 ? achievements[rank - 1] : 'Participant';
        const row = {
          name: p.name, college: p.college, department: p.department, year: p.year,
          event: game.event || '', quiz: game.quizTitle, rank, score: p.score || 0,
          accuracy: acc, achievement, pin, playerId: p.id, issuedAt: Date.now()
        };
        const wantCert = certMode === 'all' || (certMode === 'top3' && rank <= 3);
        const playerUpdate = { finalRank: rank, accuracy: acc, achievement };
        if (wantCert) {
          const certId = `MR-${pin}-${MR.util.pad(rank, 3)}-${MR.util.uid(4)}`;
          row.id = certId; row.verified = true;
          await D.set('certificates/' + certId, row);
          playerUpdate.certId = certId;
        }
        await D.update(`games/${pin}/players/${p.id}`, playerUpdate);
        rows.push(row);
      }
      await D.set('results/' + pin, { pin, quiz: game.quizTitle, event: game.event || '', certMode, certificates: certMode !== 'off',
        totalPlayers: players.length, totalQuestions: total, finishedAt: Date.now(), leaderboard: rows });
      await D.update('games/' + pin, { resultsReady: true });
      return rows;
    },
    getResults(pin) { return D.get('results/' + pin); },
    onGames(cb) { return D.on('games', v => cb(objToArr(v).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))); },

    getCertificate(id) { return D.get('certificates/' + id); },
    onCertificates(cb) { return D.on('certificates', v => cb(objToArr(v).sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0)))); },

    /* ---------- Google Sheets export ---------- */
    async pushToSheets(rows) {
      if (!MR.SHEETS_WEBHOOK) throw new Error('Google Sheets webhook not configured');
      await fetch(MR.SHEETS_WEBHOOK, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ rows })
      });
      return true;
    }
  };

  function objToArr(o) { return o ? Object.values(o) : []; }
  MR.objToArr = objToArr;
})();
