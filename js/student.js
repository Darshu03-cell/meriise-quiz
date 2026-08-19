/* ============================================================
   ME-RIISE QUIZ — Student gameplay controller
   ============================================================ */
(function () {
  const { $, el, esc, initials, avatarColor, toast, countTo, confetti } = MR.util;
  const screen = $('#screen');
  const scoreArea = $('#scoreArea');

  const pin = MR.util.qs('pin');
  if (!pin || !/^\d{6}$/.test(pin)) { location.replace('index.html'); return; }

  const PID_KEY = 'mr_pid_' + pin;
  let pid = sessionStorage.getItem(PID_KEY) || null;
  let joined = !!pid;

  const S = { view: '', choice: null, timer: null, answerBtns: [], game: null };
  const SHAPES = ['▲', '◆', '●', '■'];

  MR.game.onGame(pin, (game) => {
    if (!game || !game.status) { renderMissing(); return; }
    S.game = game;
    const player = pid && game.players ? game.players[pid] : null;

    if (pid && joined && !player && game.status !== 'ended') {
      // Removed by host
      sessionStorage.removeItem(PID_KEY); pid = null; joined = false; S.view = '';
      toast('You were removed from the game', 'err');
    }
    renderTopbar(game, player);

    if (!pid) { renderJoin(game); return; }

    switch (game.status) {
      case 'lobby':       renderLobby(game, player); break;
      case 'question':    renderQuestion(game, player); break;
      case 'reveal':      renderReveal(game, player); break;
      case 'leaderboard': renderLeaderboard(game, player); break;
      case 'ended':       renderFinal(game, player); break;
    }
  });

  /* ---------------- Topbar ---------------- */
  function renderTopbar(game, player) {
    scoreArea.innerHTML = '';
    if (player) {
      scoreArea.append(el('div', { class: 'score-pill chip chip-cyan' }, '⭐ ', el('span', { class: 'n mono' }, String(player.score || 0))));
    } else {
      scoreArea.append(el('div', { class: 'chip mono' }, 'PIN ' + game.pin));
    }
  }

  /* ---------------- Join form ---------------- */
  function renderJoin(game) {
    if (S.view === 'join') return;
    S.view = 'join';
    const departments = ['Computer Science', 'Information Science', 'Electronics & Comm.', 'Electrical & Electronics',
      'Mechanical', 'Civil', 'AI & Machine Learning', 'MBA', 'MCA', 'Other'];
    const wrap = el('div', { class: 'anim-up' });
    wrap.append(
      el('div', { class: 'join-hero' },
        el('div', { class: 'chip chip-cyan' }, 'Joining game'),
        el('h2', { style: 'margin-top:10px' }, game.quizTitle || 'Live Quiz'),
        el('div', { class: 'muted', style: 'margin-top:4px' }, game.event || 'ME-RIISE Foundation'),
        el('div', { class: 'pin-badge', style: 'margin-top:10px' }, 'PIN ' + game.pin)
      )
    );
    const form = el('form', { class: 'glass card-lg', autocomplete: 'off' });
    form.innerHTML = `
      <div class="field"><label>Your Name</label><input class="input" name="name" maxlength="40" placeholder="e.g. Ananya Rao" required></div>
      <div class="field"><label>College / Organization Name</label><input class="input" name="college" maxlength="80" placeholder="Your college or organization" value="Malnad College of Engineering" required></div>
      <div class="field"><label>Department</label>
        <select class="select" name="department" id="deptSelect" required>
          <option value="" disabled selected>Select department</option>
          ${departments.map(d => `<option>${d}</option>`).join('')}
        </select>
      </div>
      <div class="field hidden" id="deptOtherWrap"><label>Enter your department</label><input class="input" id="deptOther" maxlength="60" placeholder="e.g. Biotechnology"></div>
      <div class="field"><label>Year</label>
        <select class="select" name="year" id="yearSelect" required>
          <option value="" disabled selected>Select year</option>
          <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>PG</option>
          <option>Other</option>
        </select>
      </div>
      <div class="field hidden" id="yearOtherWrap"><label>Enter your year / details</label><input class="input" id="yearOther" maxlength="40" placeholder="e.g. Diploma 2nd Year"></div>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Join Game 🎮</button>`;

    // "Other" reveals a free-text field for Department and Year
    const deptSel = form.querySelector('#deptSelect'), deptOtherWrap = form.querySelector('#deptOtherWrap'), deptOther = form.querySelector('#deptOther');
    const yearSel = form.querySelector('#yearSelect'), yearOtherWrap = form.querySelector('#yearOtherWrap'), yearOther = form.querySelector('#yearOther');
    deptSel.addEventListener('change', () => {
      const other = deptSel.value === 'Other';
      deptOtherWrap.classList.toggle('hidden', !other); deptOther.required = other;
      if (other) deptOther.focus();
    });
    yearSel.addEventListener('change', () => {
      const other = yearSel.value === 'Other';
      yearOtherWrap.classList.toggle('hidden', !other); yearOther.required = other;
      if (other) yearOther.focus();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const department = deptSel.value === 'Other' ? (deptOther.value.trim() || 'Other') : deptSel.value;
      const year = yearSel.value === 'Other' ? (yearOther.value.trim() || 'Other') : yearSel.value;
      const player = { name: fd.get('name').trim(), college: fd.get('college').trim(), department, year };
      if (!player.name) return;
      const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Joining…';
      try {
        pid = await MR.game.joinGame(pin, player);
        sessionStorage.setItem(PID_KEY, pid); joined = true; S.view = '';
        toast('You\'re in! 🎉', 'ok');
      } catch (err) {
        toast(err.message || 'Could not join', 'err');
        btn.disabled = false; btn.textContent = 'Join Game 🎮';
      }
    });
    wrap.append(form);
    swap(wrap);
  }

  /* ---------------- Lobby ---------------- */
  function renderLobby(game, player) {
    const players = MR.objToArr(game.players);
    if (S.view !== 'lobby') {
      S.view = 'lobby';
      const wrap = el('div', { class: 'lobby anim-up' });
      wrap.append(
        el('div', { class: 'big-emoji' }, '🎯'),
        el('h2', {}, "You're in, " + (player?.name?.split(' ')[0] || 'Player') + '!'),
        el('div', { class: 'muted' }, 'Hang tight — the host will start soon.'),
        el('div', { class: 'pulse-wait' }, el('span', { class: 'spinner' }), 'Waiting for host to begin…'),
        el('div', { class: 'chip', id: 'lobbyCount', style: 'margin-top:22px' }, ''),
        el('div', { class: 'player-chips', id: 'lobbyChips' })
      );
      swap(wrap);
    }
    const cnt = $('#lobbyCount'); if (cnt) cnt.textContent = `👥 ${players.length} player${players.length === 1 ? '' : 's'} in the room`;
    const chips = $('#lobbyChips');
    if (chips) {
      chips.innerHTML = '';
      players.slice(-24).forEach(p => {
        chips.append(el('span', { class: 'chip player-chip' + (p.id === pid ? ' chip-cyan' : '') },
          el('span', {}, initials(p.name)), ' ', p.name.split(' ')[0]));
      });
    }
  }

  /* ---------------- Question ---------------- */
  function renderQuestion(game, player) {
    const idx = game.currentIndex;
    const q = game.quiz.questions[idx];
    if (!q) return;
    const viewKey = 'q' + idx;

    if (S.view !== viewKey) {
      S.view = viewKey; S.choice = null; S.answerBtns = [];
      // Was the answer already submitted (rejoin)?
      const existing = game.answers && game.answers[idx] && game.answers[idx][pid];
      if (existing) S.choice = existing.choice;

      const total = game.quiz.questions.length;
      const wrap = el('div', { class: 'anim-up' });
      const head = el('div', { class: 'q-head' },
        el('div', { class: 'q-count' }, `Question ${idx + 1} / ${total}`),
        timerRing());
      const qtext = el('div', { class: 'q-text' }, q.q);
      wrap.append(head, qtext);
      if (q.image) wrap.append(el('img', { class: 'q-image', src: q.image, alt: '' }));

      const grid = el('div', { class: 'answers', id: 'answers' });
      (q.options || []).forEach((opt, i) => {
        const b = el('button', { class: 'answer', 'data-i': i, type: 'button' },
          el('span', { class: 'shape' }, SHAPES[i]), el('span', { class: 'grow' }, opt));
        b.addEventListener('click', () => choose(i));
        S.answerBtns.push(b); grid.append(b);
      });
      wrap.append(grid);
      wrap.append(el('div', { id: 'qStatus', class: 'text-center muted', style: 'margin-top:16px;min-height:20px' }));
      swap(wrap);
      startTimer(game);
      if (S.choice != null) markChosen(S.choice, false);
    }

    // React to lock without rebuilding
    if (game.state.locked) lockAnswers();
  }

  function timerRing() {
    const r = 28, C = 2 * Math.PI * r;
    const ring = el('div', { class: 'timer-ring', id: 'timerRing' });
    ring.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64">
        <circle class="track" cx="32" cy="32" r="${r}" fill="none" stroke-width="6"></circle>
        <circle class="bar" id="timerBar" cx="32" cy="32" r="${r}" fill="none" stroke-width="6"
          stroke-dasharray="${C}" stroke-dashoffset="0"></circle>
      </svg><div class="num" id="timerNum">--</div>`;
    ring._C = C;
    return ring;
  }

  function startTimer(game) {
    clearInterval(S.timer);
    const total = (game.quiz.timePerQuestion || 20) * 1000;
    const endAt = game.state.endAt;
    const ring = $('#timerRing'), bar = $('#timerBar'), num = $('#timerNum');
    if (!ring) return;
    const C = ring._C;
    const tick = () => {
      const remaining = Math.max(0, endAt - MR.serverNow());
      const frac = Math.min(1, remaining / total);
      const secs = Math.ceil(remaining / 1000);
      if (num) num.textContent = secs;
      if (bar) bar.style.strokeDashoffset = C * (1 - frac);
      ring.classList.toggle('warn', frac <= 0.5 && frac > 0.25);
      ring.classList.toggle('danger', frac <= 0.25);
      if (remaining <= 0) {
        clearInterval(S.timer);
        lockAnswers();
        const st = $('#qStatus');
        if (st && S.choice == null) st.textContent = "⏰ Time's up!";
      }
    };
    tick();
    S.timer = setInterval(tick, 200);
  }

  async function choose(i) {
    if (S.choice != null) return;
    const st = S.game.state;
    if (st.locked) { toast('Answers are locked', 'err'); return; }
    S.choice = i;
    markChosen(i, true);
    const res = await MR.game.submitAnswer(pin, S.game.currentIndex, pid, i);
    if (!res.ok) {
      if (res.reason === 'duplicate') { /* already counted */ }
      else { toast("Too late — answers locked", 'err'); }
    }
    const status = $('#qStatus');
    if (status) status.innerHTML = '🔒 <b>Locked in!</b> Waiting for others…';
  }

  function markChosen(i, animate) {
    S.answerBtns.forEach((b, j) => {
      if (j === i) b.classList.add('sel');
      else b.classList.add('dim');
      b.disabled = true;
    });
    if (animate && navigator.vibrate) navigator.vibrate(30);
  }

  function lockAnswers() {
    S.answerBtns.forEach(b => { b.disabled = true; });
    clearInterval(S.timer);
  }

  /* ---------------- Reveal ---------------- */
  function renderReveal(game, player) {
    const idx = game.currentIndex;
    const viewKey = 'reveal' + idx;
    if (S.view === viewKey) return;
    S.view = viewKey;
    clearInterval(S.timer);
    const q = game.quiz.questions[idx];
    const myAns = game.answers && game.answers[idx] && game.answers[idx][pid];
    const answered = !!myAns;
    // Correctness derived locally from the revealed answer + own choice (answers stay immutable).
    const correct = answered && myAns.choice === q.correct;
    const gain = player?.lastGain || 0;

    const wrap = el('div', { class: 'feedback ' + (correct ? 'correct' : 'wrong') });
    wrap.append(
      el('div', { class: 'badge-big' }, correct ? '✅' : (answered ? '❌' : '⌛')),
      el('h2', {}, correct ? 'Correct!' : (answered ? 'Not quite' : 'No answer')),
      el('div', { class: 'muted' }, 'Answer: ' + esc(q.options[q.correct]))
    );
    if (correct) {
      const g = el('div', { class: 'gain correct' }, '+0');
      wrap.append(g);
      countTo(g, gain, { prefix: '+', dur: 900 });
      if ((player?.streak || 0) >= 2) wrap.append(el('div', { class: 'chip chip-gold streak-tag' }, `🔥 ${player.streak} in a row!`));
    }
    wrap.append(el('div', { class: 'chip', style: 'margin-top:18px' }, 'Total score ',
      el('b', { class: 'mono', style: 'margin-left:6px;color:var(--cyan)' }, String(player?.score || 0))));
    wrap.append(el('div', { class: 'pulse-wait', style: 'margin-top:20px' }, el('span', { class: 'spinner' }), 'Next up…'));
    swap(wrap);
    if (correct) confetti({ count: 60, duration: 2200 });
  }

  /* ---------------- Leaderboard ---------------- */
  function renderLeaderboard(game, player) {
    const viewKey = 'lb' + game.currentIndex;
    if (S.view === viewKey) return;
    S.view = viewKey;
    const players = MR.objToArr(game.players).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
    const myRank = players.findIndex(p => p.id === pid) + 1;

    const wrap = el('div', { class: 'anim-up' });
    wrap.append(el('div', { class: 'my-rank-card glass' },
      el('div', { class: 'muted' }, 'Your position'),
      el('div', { class: 'rank-num gradient-text' }, '#' + myRank),
      el('div', { class: 'chip chip-cyan', style: 'margin-top:8px' }, '⭐ ' + (player?.score || 0) + ' pts')));

    const list = el('div', { class: 'rank-list' });
    players.slice(0, 5).forEach((p, i) => {
      list.append(rankRow(i + 1, p, p.id === pid));
    });
    if (myRank > 5) list.append(rankRow(myRank, player, true));
    wrap.append(el('h3', { style: 'margin:22px 0 6px' }, '🏆 Top Players'), list);
    swap(wrap);
  }

  function rankRow(pos, p, me) {
    const medal = ['🥇', '🥈', '🥉'][pos - 1] || '';
    return el('div', { class: 'rank-row' + (me ? ' me' : '') },
      el('div', { class: 'pos' }, medal || pos),
      el('div', { class: 'avatar', style: `background:${avatarColor(p.name)}` }, initials(p.name)),
      el('div', { class: 'nm' }, (p.name || 'Player') + (me ? ' (You)' : '')),
      el('div', { class: 'sc mono' }, String(p.score || 0)));
  }

  /* ---------------- Final ---------------- */
  function renderFinal(game, player) {
    if (!player) { renderMissing('The game has ended.'); return; }
    const players = MR.objToArr(game.players).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
    const rank = player.finalRank || (players.findIndex(p => p.id === pid) + 1);
    const isTop3 = rank <= 3;
    const issueCerts = game.issueCertificates !== false;

    if (S.view !== 'final') {
      S.view = 'final'; S.certShown = false;
      clearInterval(S.timer);
      const total = game.totalQuestions || (game.quiz.questions || []).length || 1;
      const acc = player.accuracy != null ? player.accuracy : MR.util.accuracy(player.correctCount || 0, player.answeredCount || total);
      const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const titles = { 1: 'Quiz Champion', 2: 'First Runner-Up', 3: 'Second Runner-Up' };

      const wrap = el('div', { class: 'final anim-up' });
      wrap.append(
        el('div', { class: 'medal' }, medals[rank] || '🎖️'),
        el('div', { class: 'chip ' + (isTop3 ? 'chip-gold' : 'chip-cyan') }, isTop3 ? titles[rank] : 'Participant'),
        el('h1', {}, 'Rank #' + rank),
        el('div', { class: 'muted' }, game.quizTitle));
      wrap.append(el('div', { class: 'final-stats' },
        statTile('⭐', player.score || 0, 'Points'),
        statTile('🎯', acc + '%', 'Accuracy'),
        statTile('👥', players.length, 'Players')));
      wrap.append(el('div', { class: 'stack gap-2', id: 'finalActions' },
        issueCerts
          ? el('div', { class: 'pulse-wait', style: 'justify-content:center' }, el('span', { class: 'spinner' }), 'Preparing your certificate…')
          : el('a', { class: 'btn btn-primary btn-block btn-lg', href: 'index.html' }, '🏠 Back to Home')));
      swap(wrap);
      if (isTop3) confetti({ count: 220, duration: 5000 });
    }

    // When certificates are enabled, one is issued for EVERY participant; it may arrive a
    // moment after the game ends, so we react whenever certId appears — then auto-open it.
    if (issueCerts && !S.certShown && player.certId) {
      S.certShown = true;
      const url = 'certificate.html?cid=' + player.certId;
      const actions = document.getElementById('finalActions');
      if (actions) {
        actions.innerHTML = '';
        actions.append(
          el('a', { class: 'btn btn-gold btn-block btn-lg', href: url }, '🏅 View My Certificate'),
          el('div', { class: 'muted text-center', id: 'certCountdown', style: 'font-size:.85rem' }, 'Opening your certificate…'),
          el('a', { class: 'btn btn-ghost btn-block', href: 'index.html' }, 'Back to Home'));
      }
      let n = 3;
      clearInterval(S.certTimer);
      S.certTimer = setInterval(() => {
        n--;
        const cd = document.getElementById('certCountdown');
        if (cd) cd.textContent = n > 0 ? `Opening your certificate in ${n}…` : 'Opening…';
        if (n <= 0) { clearInterval(S.certTimer); location.href = url; }
      }, 1000);
    }
  }

  function statTile(ic, val, lbl) {
    return el('div', { class: 'stat glass' }, el('div', { class: 'ic' }, ic),
      el('div', { class: 'val mono' }, String(val)), el('div', { class: 'lbl' }, lbl));
  }

  /* ---------------- Helpers ---------------- */
  function renderMissing(msg) {
    if (S.view === 'missing') return;
    S.view = 'missing';
    swap(el('div', { class: 'empty glass card-lg anim-up' },
      el('div', { class: 'ic' }, '🔍'),
      el('h3', {}, 'Game not found'),
      el('p', { class: 'muted', style: 'margin:8px 0 18px' }, msg || 'This game PIN is no longer active.'),
      el('a', { class: 'btn btn-primary', href: 'index.html' }, 'Back to Home')));
  }

  function swap(node) { screen.innerHTML = ''; screen.append(node); }
})();
