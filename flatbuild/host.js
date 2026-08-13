/* ============================================================
   ME-RIISE QUIZ — Host / Projector controller
   ============================================================ */
(function () {
  const { $, el, esc, initials, avatarColor, toast, confetti, makeQR, countTo } = MR.util;
  const main = $('#hostMain'), controls = $('#hostControls'), meta = $('#liveMeta');
  const SHAPES = ['▲', '◆', '●', '■'];

  const H = { pin: null, view: '', game: null, timer: null, answersUnsub: null, answers: {}, autoLocked: false };

  $('#fsBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  init();

  async function init() {
    const pin = MR.util.qs('pin');
    const quizId = MR.util.qs('quiz');
    if (pin) return startHosting(pin);
    if (quizId) {
      const quiz = await MR.game.getQuiz(quizId);
      if (quiz) { const p = await MR.game.createGame(quiz); return goToPin(p); }
    }
    renderPicker();
  }

  function goToPin(pin) { history.replaceState(null, '', 'host.html?pin=' + pin); startHosting(pin); }

  function startHosting(pin) {
    H.pin = pin;
    MR.game.onGame(pin, (game) => {
      if (!game) { toast('Game ended', 'info'); renderPicker(); return; }
      H.game = game;
      renderMeta(game);
      switch (game.status) {
        case 'lobby':       renderLobby(game); break;
        case 'question':    renderQuestion(game); break;
        case 'reveal':      renderReveal(game); break;
        case 'leaderboard': renderLeaderboard(game); break;
        case 'ended':       renderPodium(game); break;
      }
      renderControls(game);
    });
  }

  /* ---------------- Quiz picker ---------------- */
  function renderPicker() {
    H.view = 'picker'; meta.innerHTML = ''; controls.innerHTML = '';
    const wrap = el('div', { class: 'anim-up', style: 'width:100%;max-width:900px' });
    wrap.append(el('h1', { class: 'text-center' }, 'Host a ', el('span', { class: 'gradient-text' }, 'Live Quiz')),
      el('p', { class: 'text-center muted', style: 'margin:8px 0 26px' }, 'Pick a quiz to launch. Students join with the PIN on their phones.'));
    const grid = el('div', { class: 'pick-grid' });
    wrap.append(grid);
    main.innerHTML = ''; main.append(wrap);

    MR.game.onQuizzes(async (quizzes) => {
      grid.innerHTML = '';
      if (!quizzes.length) {
        grid.append(el('div', { class: 'empty glass card-lg', style: 'grid-column:1/-1' },
          el('div', { class: 'ic' }, '📭'),
          el('h3', {}, 'No quizzes yet'),
          el('p', { class: 'muted', style: 'margin:8px 0 18px' }, 'Create quizzes in the Admin dashboard, or load a demo quiz to try it now.'),
          el('div', { class: 'row gap-2', style: 'justify-content:center' },
            el('button', { class: 'btn btn-primary', onClick: loadDemo }, '⚡ Load Demo Quiz'),
            el('a', { class: 'btn btn-ghost', href: 'admin.html' }, 'Open Admin'))));
        return;
      }
      quizzes.forEach(q => {
        const card = el('div', { class: 'pick-card glass', onClick: () => host(q) },
          el('h3', {}, q.title),
          el('div', { class: 'meta' }, (q.event || 'ME-RIISE') + ' · ' + (q.questions || []).length + ' questions'),
          el('div', { class: 'row gap-2', style: 'margin-top:16px' },
            el('span', { class: 'chip' }, '⏱️ ' + (q.timePerQuestion || 20) + 's'),
            el('span', { class: 'chip' }, '⭐ ' + (q.pointsPerQuestion || 1000))));
        grid.append(card);
      });
    });
  }

  async function loadDemo() {
    // Start a demo game directly from the sample questions — no quiz is saved,
    // so this works without an admin login (saving quizzes requires auth).
    try {
      await host({ ...MR.SAMPLE_QUIZ, id: 'demo-' + MR.util.uid(6) });
    } catch (e) {
      toast('Could not start demo — ' + (e.message || 'permission error'), 'err');
    }
  }
  async function host(quiz) {
    if (!(quiz.questions || []).length) { toast('This quiz has no questions', 'err'); return; }
    try {
      const pin = await MR.game.createGame(quiz);
      goToPin(pin);
    } catch (e) {
      toast('Could not create game — ' + (e.message || 'error'), 'err');
      throw e;
    }
  }

  /* ---------------- Meta bar ---------------- */
  function renderMeta(game) {
    const players = MR.objToArr(game.players).length;
    meta.innerHTML = '';
    meta.append(
      el('span', { class: 'chip chip-live' }, el('span', { class: 'dot' }), 'LIVE'),
      el('span', { class: 'chip' }, esc(game.quizTitle)),
      el('span', { class: 'chip chip-cyan mono' }, 'PIN ' + game.pin),
      el('span', { class: 'chip' }, '👥 ' + players));
  }

  /* ---------------- Lobby ---------------- */
  function renderLobby(game) {
    const joinUrl = location.origin + location.pathname.replace(/host\.html$/, 'student.html') + '?pin=' + game.pin;
    const players = MR.objToArr(game.players);
    if (H.view !== 'lobby') {
      H.view = 'lobby';
      const wrap = el('div', { class: 'lobby-wrap anim-up' });
      const left = el('div', { class: 'join-panel' },
        el('div', { class: 'kicker' }, 'Join at'),
        el('div', { class: 'join-url' }, el('b', {}, joinUrl.replace(/^https?:\/\//, ''))),
        el('div', { class: 'kicker', style: 'margin-top:18px' }, 'Game PIN'),
        el('div', { class: 'pin-display mono' }, game.pin),
        el('div', { class: 'players-live' },
          el('div', { class: 'head' },
            el('h3', {}, 'Players joining…'),
            el('span', { class: 'count-big gradient-text', id: 'lobbyCountBig' }, '0')),
          el('div', { class: 'player-grid', id: 'playerGrid' })));
      const right = el('div', { class: 'qr-panel' },
        makeQR(joinUrl, 220),
        el('div', { class: 'muted' }, '📱 Scan to join instantly'));
      wrap.append(left, right);
      main.innerHTML = ''; main.append(wrap);
    }
    const cb = $('#lobbyCountBig'); if (cb) cb.textContent = players.length;
    const grid = $('#playerGrid');
    if (grid) {
      const seen = new Set(Array.from(grid.children).map(c => c.dataset.pid));
      players.forEach(p => {
        if (seen.has(p.id)) return;
        grid.append(el('div', { class: 'player-name-chip', dataset: { pid: p.id } },
          el('span', { class: 'av', style: `background:${avatarColor(p.name)}` }, initials(p.name)),
          esc(p.name)));
      });
    }
  }

  /* ---------------- Question ---------------- */
  function renderQuestion(game) {
    const idx = game.currentIndex;
    const q = game.quiz.questions[idx];
    const viewKey = 'q' + idx;
    if (H.view !== viewKey) {
      H.view = viewKey; H.autoLocked = false; H.answers = {};
      teardownAnswers();
      const wrap = el('div', { style: 'width:100%' });
      wrap.append(
        el('div', { class: 'host-q-count anim-in' }, `Question ${idx + 1} of ${game.quiz.questions.length}`),
        el('div', { class: 'host-q-text anim-up' }, q.q));
      if (q.image) wrap.append(el('img', { class: 'host-q-image', src: q.image, alt: '' }));
      wrap.append(el('div', { class: 'host-timer-wrap' },
        hostTimer(),
        el('div', { class: 'answered-count', id: 'answeredCount' }, '0', el('small', {}, 'answered'))));
      const grid = el('div', { class: 'host-answers' });
      (q.options || []).forEach((opt, i) => {
        grid.append(el('div', { class: 'host-answer anim-up', 'data-i': i },
          el('span', { class: 'shape' }, SHAPES[i]),
          el('span', { class: 'grow' }, opt),
          el('span', { class: 'cnt', id: 'cnt' + i }, '')));
      });
      wrap.append(grid);
      main.innerHTML = ''; main.append(wrap);
      startHostTimer(game);
      // live answered count
      H.answersUnsub = MR.game.onAnswers(game.pin, idx, (a) => {
        H.answers = a || {};
        const n = Object.keys(H.answers).length;
        const ac = $('#answeredCount'); if (ac) ac.innerHTML = n + '<small>of ' + MR.objToArr(game.players).length + ' answered</small>';
      });
    }
  }

  function hostTimer() {
    const r = 54, C = 2 * Math.PI * r;
    const t = el('div', { class: 'host-timer', id: 'hostTimer' });
    t.innerHTML = `<svg width="120" height="120" viewBox="0 0 120 120">
      <circle class="track" cx="60" cy="60" r="${r}" fill="none" stroke-width="9"></circle>
      <circle class="bar" id="hBar" cx="60" cy="60" r="${r}" fill="none" stroke-width="9" stroke-dasharray="${C}" stroke-dashoffset="0"></circle>
    </svg><div class="num" id="hNum">--</div>`;
    t._C = C; return t;
  }

  function startHostTimer(game) {
    clearInterval(H.timer);
    const total = (game.quiz.timePerQuestion || 20) * 1000;
    const endAt = game.state.endAt;
    const t = $('#hostTimer'), bar = $('#hBar'), num = $('#hNum');
    if (!t) return; const C = t._C;
    const tick = async () => {
      const remaining = Math.max(0, endAt - MR.serverNow());
      const frac = Math.min(1, remaining / total);
      if (num) num.textContent = Math.ceil(remaining / 1000);
      if (bar) bar.style.strokeDashoffset = C * (1 - frac);
      t.classList.toggle('danger', frac <= 0.25);
      if (remaining <= 0) {
        clearInterval(H.timer);
        if (!H.autoLocked) { H.autoLocked = true; await MR.game.lockQuestion(game.pin); renderControls(H.game); }
      }
    };
    tick(); H.timer = setInterval(tick, 200);
  }

  /* ---------------- Reveal (distribution) ---------------- */
  function renderReveal(game) {
    const idx = game.currentIndex;
    const viewKey = 'reveal' + idx;
    if (H.view === viewKey) return;
    H.view = viewKey; clearInterval(H.timer); teardownAnswers();
    const q = game.quiz.questions[idx];
    const answers = (game.answers && game.answers[idx]) || {};
    const counts = q.options.map((_, i) => Object.values(answers).filter(a => a.choice === i).length);
    const totalAns = Object.values(answers).length || 1;

    const wrap = el('div', { class: 'anim-up', style: 'width:100%' });
    wrap.append(el('div', { class: 'host-q-count' }, `Question ${idx + 1} — Results`),
      el('div', { class: 'host-q-text', style: 'margin-bottom:22px' }, q.q));
    const grid = el('div', { class: 'host-answers' });
    q.options.forEach((opt, i) => {
      const isCorrect = i === q.correct;
      const a = el('div', { class: 'host-answer ' + (isCorrect ? 'correct' : 'wrong'), 'data-i': i },
        el('span', { class: 'shape' }, isCorrect ? '✓' : SHAPES[i]),
        el('span', { class: 'grow' }, opt),
        el('span', { class: 'cnt' }, counts[i] + (isCorrect ? ' ✅' : '')),
        el('span', { class: 'distbar' }));
      grid.append(a);
    });
    wrap.append(grid);
    main.innerHTML = ''; main.append(wrap);
    requestAnimationFrame(() => {
      grid.querySelectorAll('.host-answer').forEach((a, i) => {
        a.querySelector('.distbar').style.width = Math.round((counts[i] / totalAns) * 100) + '%';
      });
    });
  }

  /* ---------------- Leaderboard ---------------- */
  function renderLeaderboard(game) {
    const viewKey = 'lb' + game.currentIndex;
    if (H.view === viewKey) return;
    H.view = viewKey; clearInterval(H.timer);
    const players = MR.objToArr(game.players).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
    const max = Math.max(1, players[0]?.score || 1);
    const wrap = el('div', { class: 'lb-wrap anim-up' });
    wrap.append(el('h1', { class: 'lb-title text-center' }, '🏆 Leaderboard'));
    const bars = el('div', { class: 'lb-bars' });
    players.slice(0, 8).forEach((p, i) => {
      const pct = 30 + Math.round((p.score / max) * 70);
      const fill = el('div', { class: 'fill', style: `width:${pct}%` },
        el('span', { class: 'av', style: `background:${avatarColor(p.name)}` }, initials(p.name)),
        el('span', { class: 'nm' }, esc(p.name)));
      const row = el('div', { class: 'lb-bar' },
        el('div', { class: 'pos' }, ['🥇', '🥈', '🥉'][i] || (i + 1)),
        el('div', { class: 'track' }, fill),
        el('div', { class: 'sc mono' }, '0'));
      bars.append(row);
      countTo(row.querySelector('.sc'), p.score || 0, { dur: 1000 });
    });
    wrap.append(bars);
    main.innerHTML = ''; main.append(wrap);
  }

  /* ---------------- Podium (winners) ---------------- */
  function renderPodium(game) {
    if (H.view === 'podium') return;
    H.view = 'podium'; clearInterval(H.timer);
    const players = MR.objToArr(game.players).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
    const top3 = players.slice(0, 3);
    const titles = ['Quiz Champion', 'First Runner-Up', 'Second Runner-Up'];
    const medals = ['🥇', '🥈', '🥉'];

    const wrap = el('div', { class: 'podium-wrap anim-up' });
    wrap.append(el('div', { class: 'chip chip-gold', style: 'margin-bottom:10px' }, '🎉 Final Results'),
      el('h1', {}, 'Congratulations!'));
    const podium = el('div', { class: 'podium' });
    top3.forEach((p, i) => {
      podium.append(el('div', { class: 'col p' + (i + 1) },
        el('div', { class: 'who' },
          el('div', { class: 'medal' }, medals[i]),
          el('div', { class: 'nm' }, esc(p.name)),
          el('div', { class: 'muted', style: 'font-size:.85rem' }, titles[i]),
          el('div', { class: 'sc mono' }, (p.score || 0) + ' pts')),
        el('div', { class: 'stand' }, i + 1)));
    });
    wrap.append(podium);
    if (players.length > 3) {
      wrap.append(el('div', { class: 'muted', style: 'margin-top:30px' }, `+ ${players.length - 3} more participants — certificates ready for everyone`));
    }
    main.innerHTML = ''; main.append(wrap);
    confetti({ count: 260, duration: 6000 });
    setTimeout(() => confetti({ count: 160, duration: 4000 }), 1200);
  }

  /* ---------------- Controls ---------------- */
  function renderControls(game) {
    controls.innerHTML = '';
    const add = (label, cls, fn) => { const b = el('button', { class: 'btn ' + cls + ' btn-lg', onClick: fn }, label); controls.append(b); return b; };
    const idx = game.currentIndex, last = idx >= game.quiz.questions.length - 1;

    if (game.status === 'lobby') {
      const n = MR.objToArr(game.players).length;
      const b = add(n ? `🚀 Start Quiz (${n})` : 'Waiting for players…', 'btn-primary', () => MR.game.startQuestion(game.pin, 0));
      b.disabled = !n;
    } else if (game.status === 'question') {
      if (game.state.locked) add('👁️ Reveal Answer', 'btn-cyan', () => MR.game.revealQuestion(game.pin));
      else {
        add('🔒 Lock & Reveal', 'btn-cyan', async () => { await MR.game.lockQuestion(game.pin); await MR.game.revealQuestion(game.pin); });
      }
    } else if (game.status === 'reveal') {
      add('📊 Show Leaderboard', 'btn-primary', () => MR.game.showLeaderboard(game.pin));
    } else if (game.status === 'leaderboard') {
      if (last) add('🏁 Finish & Show Winners', 'btn-gold', () => MR.game.endGame(game.pin));
      else add('➡️ Next Question', 'btn-primary', () => MR.game.startQuestion(game.pin, idx + 1));
    } else if (game.status === 'ended') {
      add('📥 Export CSV', 'btn-cyan', () => exportCSV(game));
      if (MR.SHEETS_WEBHOOK) add('📤 Google Sheets', 'btn-ghost', () => pushSheets(game));
      add('🔁 New Game', 'btn-ghost', () => { location.href = 'host.html'; });
    }
    if (['question', 'reveal', 'leaderboard'].includes(game.status)) {
      add('⨯ End', 'btn-ghost btn-sm', async () => { if (confirm('End this game now?')) MR.game.endGame(game.pin); });
    }
  }

  async function exportCSV(game) {
    const res = await MR.game.getResults(game.pin);
    if (!res || !res.leaderboard) return toast('Results not ready', 'err');
    MR.exporter.downloadCSV(res.leaderboard, `meriise-${game.pin}.csv`);
    toast('CSV downloaded', 'ok');
  }
  async function pushSheets(game) {
    const res = await MR.game.getResults(game.pin);
    try { await MR.exporter.pushToSheets(res.leaderboard); toast('Sent to Google Sheets', 'ok'); }
    catch (e) { toast(e.message, 'err'); }
  }

  function teardownAnswers() { if (H.answersUnsub) { H.answersUnsub(); H.answersUnsub = null; } }
})();
