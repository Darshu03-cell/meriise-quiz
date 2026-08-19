/* ============================================================
   ME-RIISE QUIZ — Admin dashboard controller
   ============================================================ */
(function () {
  const { $, $$, el, esc, toast, modal, fmtDate, avatarColor, initials, countTo } = MR.util;
  const app = $('#app');

  const A = {
    user: null,
    cache: { quizzes: [], events: [], games: [], certificates: [] },
    subs: [], ready: 0,
    navOpen: false,
  };

  const NAV = [
    { id: 'dashboard',    icon: 'grid',     label: 'Dashboard' },
    { id: 'events',       icon: 'calendar', label: 'Events' },
    { id: 'quizzes',      icon: 'help',     label: 'Quizzes' },
    { id: 'live',         icon: 'live',     label: 'Live Games' },
    { id: 'participants', icon: 'users',    label: 'Participants' },
    { id: 'results',      icon: 'trophy',   label: 'Results' },
    { id: 'analytics',    icon: 'chart',    label: 'Analytics' },
    { id: 'certificates', icon: 'award',    label: 'Certificates' },
    { id: 'export',       icon: 'download', label: 'Export' },
  ];
  const ico = (name, size) => MR.icon(name, size);

  /* ---------------- Boot / auth ---------------- */
  MR.authSvc.onChange((user) => {
    A.user = user;
    if (user) { startSubscriptions(); route(); }
    else renderLogin();
  });
  window.addEventListener('hashchange', () => { if (A.user) route(); });

  function renderLogin() {
    const demo = MR.backendMode === 'local';
    app.innerHTML = '';
    const card = el('div', { class: 'glass card-lg login-card anim-up' });
    card.innerHTML = `
      <div class="brand"><span class="brand-mark">MR</span>
        <span class="brand-name">ME-RIISE <b>QUIZ</b></span></div>
      <h2>Admin Login</h2>
      <p class="sub">Sign in to manage events, quizzes & live games.</p>
      <form id="loginForm" autocomplete="off">
        <div class="field"><label>Email</label><input class="input" name="email" type="email" placeholder="admin@meriise.in" required></div>
        <div class="field"><label>Password</label><input class="input" name="password" type="password" placeholder="••••••••" required></div>
        <button class="btn btn-primary btn-block btn-lg" type="submit" id="loginBtn">Sign In →</button>
      </form>
      ${demo ? `<div class="login-hint">🔑 <b>Demo mode</b> — email <b>admin@meriise.in</b> · password <b>meriise123</b></div>` : ''}
      <div style="margin-top:16px"><a class="muted" href="index.html" style="font-size:.85rem">← Back to home</a></div>`;
    const wrap = el('div', { class: 'login-wrap' }, card);
    app.append(wrap);
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = $('#loginBtn'); btn.disabled = true; btn.textContent = 'Signing in…';
      try { await MR.authSvc.login(fd.get('email'), fd.get('password')); }
      catch (err) { toast(err.message || 'Login failed', 'err'); btn.disabled = false; btn.textContent = 'Sign In →'; }
    });
  }

  function startSubscriptions() {
    if (A.subs.length) return;
    A.subs.push(MR.game.onQuizzes(v => { A.cache.quizzes = v; softRerender(); }));
    A.subs.push(MR.game.onEvents(v => { A.cache.events = v; softRerender(); }));
    A.subs.push(MR.game.onGames(v => { A.cache.games = v; softRerender(); }));
    A.subs.push(MR.game.onCertificates(v => { A.cache.certificates = v; softRerender(); }));
  }
  const softRerender = MR.util.debounce(() => { if (A.user) route(); }, 120);

  /* ---------------- Router ---------------- */
  function route() {
    const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [page, param] = hash.split('/');
    const active = NAV.find(n => n.id === page) ? page : 'dashboard';
    const content = el('div');
    ({
      dashboard: viewDashboard, events: viewEvents, quizzes: viewQuizzes, quiz: viewQuizEditor,
      live: viewLive, participants: viewParticipants, results: (c, p) => p ? viewResultDetail(c, p) : viewResults(c),
      analytics: viewAnalytics, certificates: viewCertificates, export: viewExport,
    }[page] || viewDashboard)(content, param);
    renderShell(active, content);
  }

  function renderShell(active, content) {
    app.innerHTML = '';
    const sidebar = el('aside', { class: 'sidebar' + (A.navOpen ? ' open' : '') });
    sidebar.append(el('a', { class: 'brand', href: 'index.html' },
      el('span', { class: 'brand-mark' }, 'MR'),
      el('span', { class: 'stack' }, el('span', { class: 'brand-name' }, 'ME-RIISE ', el('b', {}, 'QUIZ')),
        el('span', { class: 'brand-sub' }, 'Admin'))));
    NAV.forEach(n => {
      const item = el('a', { class: 'nav-item' + (n.id === active ? ' active' : ''), href: '#/' + n.id },
        el('span', { class: 'ic' }, ico(n.icon)), n.label);
      item.addEventListener('click', () => { A.navOpen = false; });
      sidebar.append(item);
    });
    sidebar.append(el('div', { class: 'nav-spacer' }));
    sidebar.append(el('button', { class: 'nav-item', onClick: () => MR.authSvc.logout() }, el('span', { class: 'ic' }, ico('logout')), 'Sign Out'));
    sidebar.append(el('div', { class: 'nav-foot' }, (A.user?.email || '') + ' · ' + (MR.backendMode === 'firebase' ? '🟢 Live' : '🟡 Demo')));

    const mobileBar = el('div', { class: 'mobile-bar' },
      el('button', { class: 'btn btn-ghost btn-icon', onClick: () => { A.navOpen = true; route(); } }, ico('menu')),
      el('span', { class: 'brand-name' }, 'ME-RIISE ', el('b', {}, 'QUIZ')),
      el('span', {}, ''));

    const mainWrap = el('div', { style: 'min-width:0' }, mobileBar, el('main', { class: 'admin-main' }, content));
    const shell = el('div', { class: 'admin-shell' }, sidebar, mainWrap);
    app.append(shell);
    if (A.navOpen) {
      const bd = el('div', { class: 'backdrop-nav', onClick: () => { A.navOpen = false; route(); } });
      app.append(bd);
    }
  }

  function pageHead(title, subtitle, actions) {
    return el('div', { class: 'page-head' },
      el('div', {}, el('h1', {}, title), subtitle ? el('div', { class: 'muted' }, subtitle) : ''),
      actions ? el('div', { class: 'row gap-2', style: 'flex-wrap:wrap' }, ...actions) : '');
  }

  /* ---------------- Dashboard ---------------- */
  function viewDashboard(root) {
    const games = A.cache.games;
    const live = games.filter(g => g.status !== 'ended');
    const totalPlayers = games.reduce((s, g) => s + MR.objToArr(g.players).length, 0);
    root.append(pageHead('Dashboard', 'Welcome back — here\'s your quiz platform at a glance.',
      [el('a', { class: 'btn btn-primary', href: '#/quizzes' }, ico('plus'), 'New Quiz'),
       el('a', { class: 'btn btn-ghost', href: 'host.html', target: '_blank' }, ico('monitor'), 'Open Host')]));

    const stats = el('div', { class: 'stat-grid' });
    const data = [
      ['help', A.cache.quizzes.length, 'Quizzes'],
      ['calendar', A.cache.events.length, 'Events'],
      ['live', live.length, 'Live / Recent'],
      ['users', totalPlayers, 'Total Players'],
      ['award', A.cache.certificates.length, 'Certificates'],
    ];
    data.forEach(([name, val, lbl]) => {
      const s = el('div', { class: 'stat glass' }, el('div', { class: 'stat-ic' }, ico(name, 22)),
        el('div', { class: 'val mono' }, '0'), el('div', { class: 'lbl' }, lbl));
      stats.append(s); countTo(s.querySelector('.val'), val, { dur: 900 });
    });
    root.append(stats);

    const grid = el('div', { class: 'list-grid', style: 'margin-top:22px' });
    // Recent games
    const recent = el('div', { class: 'glass card', style: 'grid-column:1/-1' },
      el('h3', { style: 'margin-bottom:6px' }, 'Recent Games'));
    const rl = el('div', { class: 'recent-list' });
    if (!games.length) rl.append(emptyInline('No games yet. Launch one from Host or a quiz.'));
    games.slice(0, 6).forEach(g => {
      const done = g.status === 'ended';
      rl.append(el('div', { class: 'recent-row' },
        el('div', { class: 'ic ' + (done ? 'done' : 'live') }, ico(done ? 'flag' : 'live', 18)),
        el('div', { class: 'grow' }, el('div', {}, el('b', {}, esc(g.quizTitle))),
          el('div', { class: 'muted', style: 'font-size:.82rem' }, 'PIN ' + g.pin + ' · ' + MR.objToArr(g.players).length + ' players · ' + fmtDate(g.createdAt))),
        el('span', { class: 'status-tag status-' + g.status }, g.status),
        done
          ? el('a', { class: 'btn btn-sm btn-ghost', href: '#/results/' + g.pin }, 'Results')
          : el('a', { class: 'btn btn-sm btn-cyan', href: 'host.html?pin=' + g.pin, target: '_blank' }, 'Open')));
    });
    recent.append(rl); grid.append(recent);
    root.append(grid);
  }

  /* ---------------- Events ---------------- */
  function viewEvents(root) {
    root.append(pageHead('Events', 'Organise quizzes under events / fests.',
      [el('button', { class: 'btn btn-primary', onClick: () => eventForm() }, ico('plus'), 'New Event')]));
    if (MR.backendMode === 'local' && !A.cache.events.length)
      root.append(seedNote('Add a sample event', async () => { await MR.game.createEvent(MR.SAMPLE_EVENT); }));
    const grid = el('div', { class: 'list-grid' });
    if (!A.cache.events.length) grid.append(emptyBlock('calendar', 'No events yet', 'Create your first event to group quizzes.'));
    A.cache.events.forEach(ev => {
      grid.append(el('div', { class: 'item-card glass' },
        el('div', { class: 'title' }, esc(ev.name)),
        el('div', { class: 'row-meta' }, el('span', { class: 'chip' }, ico('calendar'), (ev.date || '—')), ev.venue ? el('span', { class: 'chip' }, ico('pin'), esc(ev.venue)) : ''),
        ev.description ? el('div', { class: 'muted', style: 'font-size:.86rem' }, esc(ev.description)) : '',
        el('div', { class: 'item-actions' },
          el('button', { class: 'btn btn-sm btn-ghost', onClick: () => eventForm(ev) }, ico('edit'), 'Edit'),
          el('button', { class: 'btn btn-sm btn-ghost', title: 'Delete', onClick: () => del('Delete event?', () => MR.game.deleteEvent(ev.id)) }, ico('trash')))));
    });
    root.append(grid);
  }

  function eventForm(ev) {
    const body = el('div');
    body.innerHTML = `
      <div class="field"><label>Event Name</label><input class="input" id="ev-name" value="${esc(ev?.name || '')}" placeholder="TechRise 2026"></div>
      <div class="field"><label>Date</label><input class="input" id="ev-date" type="date" value="${esc(ev?.date || '')}"></div>
      <div class="field"><label>Venue</label><input class="input" id="ev-venue" value="${esc(ev?.venue || '')}" placeholder="MCE Auditorium"></div>
      <div class="field"><label>Description</label><textarea class="input" id="ev-desc" rows="2">${esc(ev?.description || '')}</textarea></div>`;
    modal({
      title: ev ? 'Edit Event' : 'New Event', body,
      actions: [{ label: 'Cancel', class: 'btn-ghost', onClick: c => c() },
        { label: 'Save', class: 'btn-primary', onClick: async (c) => {
          const data = { name: $('#ev-name').value.trim(), date: $('#ev-date').value, venue: $('#ev-venue').value.trim(), description: $('#ev-desc').value.trim() };
          if (!data.name) return toast('Name required', 'err');
          if (ev) await MR.game.updateEvent(ev.id, data); else await MR.game.createEvent(data);
          toast('Event saved', 'ok'); c();
        } }]
    });
  }

  /* ---------------- Quizzes ---------------- */
  function viewQuizzes(root) {
    root.append(pageHead('Quizzes', 'Create quizzes, manage questions, set timers & points.',
      [el('button', { class: 'btn btn-primary', onClick: () => quizForm() }, ico('plus'), 'New Quiz')]));
    if (MR.backendMode === 'local' && !A.cache.quizzes.length)
      root.append(seedNote('Load the sample quiz', async () => { await MR.game.createQuiz(MR.SAMPLE_QUIZ); }));
    const grid = el('div', { class: 'list-grid' });
    if (!A.cache.quizzes.length) grid.append(emptyBlock('help', 'No quizzes yet', 'Create a quiz and add questions.'));
    A.cache.quizzes.forEach(q => {
      grid.append(el('div', { class: 'item-card glass' },
        el('div', { class: 'title' }, esc(q.title)),
        el('div', { class: 'row-meta' },
          el('span', { class: 'chip' }, ico('help'), (q.questions || []).length + ' Q'),
          el('span', { class: 'chip' }, ico('clock'), (q.timePerQuestion || 20) + 's'),
          el('span', { class: 'chip' }, ico('star'), String(q.pointsPerQuestion || 1000)),
          (() => { const cm = q.certMode || (q.issueCertificates === false ? 'off' : 'all');
            return cm === 'off' ? el('span', { class: 'chip', title: 'No certificates' }, ico('award'), 'No cert')
              : cm === 'top3' ? el('span', { class: 'chip chip-gold', title: 'Certificates for Top 3 only' }, ico('award'), 'Top 3 certs')
              : el('span', { class: 'chip chip-gold', title: 'Certificates for everyone' }, ico('award'), 'All certs'); })(),
          q.event ? el('span', { class: 'chip chip-cyan' }, esc(q.event)) : ''),
        el('div', { class: 'item-actions' },
          el('a', { class: 'btn btn-sm btn-primary', href: '#/quiz/' + q.id }, ico('edit'), 'Edit Questions'),
          el('a', { class: 'btn btn-sm btn-cyan', href: 'host.html?quiz=' + q.id, target: '_blank' }, ico('launch'), 'Launch'),
          el('button', { class: 'btn btn-sm btn-ghost', title: 'Settings', onClick: () => quizForm(q) }, ico('settings')),
          el('button', { class: 'btn btn-sm btn-ghost', title: 'Delete', onClick: () => del('Delete quiz?', () => MR.game.deleteQuiz(q.id)) }, ico('trash')))));
    });
    root.append(grid);
  }

  function quizForm(q) {
    const events = A.cache.events;
    const mode = q?.certMode || (q?.issueCertificates === false ? 'off' : 'all');
    const body = el('div');
    body.innerHTML = `
      <div class="field"><label>Quiz Title</label><input class="input" id="qz-title" value="${esc(q?.title || '')}" placeholder="Innovation Challenge"></div>
      <div class="field"><label>Event</label>
        <select class="select" id="qz-event">
          <option value="">— None —</option>
          ${events.map(e => `<option ${q?.eventId === e.id ? 'selected' : ''} value="${e.id}">${esc(e.name)}</option>`).join('')}
        </select></div>
      <div class="row gap-2">
        <div class="field grow"><label>Time / question (sec)</label><input class="input" id="qz-time" type="number" min="5" max="120" value="${q?.timePerQuestion || 20}"></div>
        <div class="field grow"><label>Points / question</label><input class="input" id="qz-points" type="number" min="100" step="100" value="${q?.pointsPerQuestion || 1000}"></div>
      </div>
      <div class="field"><label>Description</label><textarea class="input" id="qz-desc" rows="2">${esc(q?.description || '')}</textarea></div>
      <div class="field"><label>Certificates</label>
        <p class="muted" style="font-size:.8rem;margin:-2px 0 10px">Certificates are <b>never</b> created automatically. After a quiz ends you click <b>“Generate Certificates”</b> (on the Host end screen or here in Results). This setting only decides <b>who</b> gets one when you do.</p>
        <label class="check-line">
          <input type="radio" name="certmode" value="all" ${mode === 'all' ? 'checked' : ''}>
          <span class="ck-txt"><b>🏅 Everyone</b><small>When you generate, every participant gets a certificate; Top 3 get achievement certificates (🥇 🥈 🥉).</small></span>
        </label>
        <label class="check-line">
          <input type="radio" name="certmode" value="top3" ${mode === 'top3' ? 'checked' : ''}>
          <span class="ck-txt"><b>🏆 Top 3 winners only</b><small>When you generate, only the top 3 get achievement certificates. Everyone else just sees their score & rank.</small></span>
        </label>
        <label class="check-line">
          <input type="radio" name="certmode" value="off" ${mode === 'off' ? 'checked' : ''}>
          <span class="ck-txt"><b>🚫 None</b><small>No certificates for this quiz — the Generate button is hidden.</small></span>
        </label>
      </div>`;
    modal({
      title: q ? 'Quiz Settings' : 'New Quiz', body,
      actions: [{ label: 'Cancel', class: 'btn-ghost', onClick: c => c() },
        { label: q ? 'Save' : 'Create & Add Questions', class: 'btn-primary', onClick: async (c) => {
          const ev = A.cache.events.find(e => e.id === $('#qz-event').value);
          const certMode = $('input[name="certmode"]:checked')?.value || 'all';
          const data = { title: $('#qz-title').value.trim(), eventId: ev?.id || '', event: ev?.name || '',
            timePerQuestion: +$('#qz-time').value || 20, pointsPerQuestion: +$('#qz-points').value || 1000,
            description: $('#qz-desc').value.trim(), certMode, issueCertificates: certMode !== 'off' };
          if (!data.title) return toast('Title required', 'err');
          if (q) { await MR.game.updateQuiz(q.id, data); toast('Saved', 'ok'); c(); }
          else { const id = await MR.game.createQuiz(data); toast('Quiz created', 'ok'); c(); location.hash = '#/quiz/' + id; }
        } }]
    });
  }

  /* ---------------- Quiz editor (questions) ---------------- */
  function viewQuizEditor(root, id) {
    const quiz = A.cache.quizzes.find(q => q.id === id);
    if (!quiz) { root.append(emptyBlock('search', 'Quiz not found', 'It may have been deleted.')); return; }
    const questions = JSON.parse(JSON.stringify(quiz.questions || []));

    root.append(pageHead(quiz.title, `${questions.length} questions · ${quiz.timePerQuestion}s · ${quiz.pointsPerQuestion} pts`,
      [el('a', { class: 'btn btn-ghost', href: '#/quizzes' }, ico('arrowLeft'), 'Back'),
       el('a', { class: 'btn btn-cyan', href: 'host.html?quiz=' + id, target: '_blank' }, ico('launch'), 'Launch')]));

    const editor = el('div', { class: 'q-editor' });
    const rerenderQ = () => { editor.innerHTML = ''; questions.forEach((q, i) => editor.append(qBlock(q, i))); editor.append(addBtn); };

    function qBlock(q, i) {
      const block = el('div', { class: 'q-block glass anim-up' });
      const head = el('div', { class: 'q-block-head' },
        el('span', { class: 'q-num' }, 'Question ' + (i + 1)),
        el('div', { class: 'row gap-1' },
          el('button', { class: 'btn btn-sm btn-ghost', title: 'Move up', onClick: () => { if (i > 0) { [questions[i - 1], questions[i]] = [questions[i], questions[i - 1]]; rerenderQ(); } } }, ico('arrowUp')),
          el('button', { class: 'btn btn-sm btn-ghost', title: 'Move down', onClick: () => { if (i < questions.length - 1) { [questions[i + 1], questions[i]] = [questions[i], questions[i + 1]]; rerenderQ(); } } }, ico('arrowDown')),
          el('button', { class: 'btn btn-sm btn-ghost', title: 'Remove', onClick: () => { questions.splice(i, 1); rerenderQ(); } }, ico('trash'))));
      const qt = el('input', { class: 'input', value: q.q || '', placeholder: 'Enter question text' });
      qt.addEventListener('input', () => q.q = qt.value);
      block.append(head, el('div', { class: 'field' }, qt));
      (q.options = q.options || ['', '', '', '']).forEach((opt, oi) => {
        const inp = el('input', { class: 'input', value: opt, placeholder: 'Option ' + (oi + 1) });
        inp.addEventListener('input', () => q.options[oi] = inp.value);
        const radio = el('input', { type: 'radio', name: 'correct-' + i, ...(q.correct === oi ? { checked: 'checked' } : {}) });
        radio.addEventListener('change', () => q.correct = oi);
        block.append(el('div', { class: 'opt-row' },
          el('span', { class: 'opt-color opt-c' + oi }), inp,
          el('label', { class: 'correct-toggle' }, radio, 'Correct')));
      });
      return block;
    }

    const addBtn = el('button', { class: 'btn btn-ghost btn-block', onClick: () => { questions.push({ q: '', options: ['', '', '', ''], correct: 0 }); rerenderQ(); } }, ico('plus'), 'Add Question');
    rerenderQ();
    root.append(editor);
    root.append(el('div', { class: 'row gap-2', style: 'margin-top:20px;position:sticky;bottom:0;padding:12px 0' },
      el('button', { class: 'btn btn-primary btn-lg', onClick: async () => {
        const clean = questions.filter(q => (q.q || '').trim() && (q.options || []).filter(o => o.trim()).length >= 2);
        await MR.game.updateQuiz(id, { questions: clean });
        toast(`Saved ${clean.length} question${clean.length === 1 ? '' : 's'}`, 'ok');
      } }, ico('save'), 'Save Quiz')));
  }

  /* ---------------- Live games ---------------- */
  function viewLive(root) {
    root.append(pageHead('Live Games', 'Monitor and jump into any running game.'));
    const live = A.cache.games.filter(g => g.status !== 'ended');
    const grid = el('div', { class: 'list-grid' });
    if (!live.length) grid.append(emptyBlock('live', 'No live games', 'Launch a quiz from the Quizzes page or Host screen.'));
    live.forEach(g => {
      grid.append(el('div', { class: 'item-card glass' },
        el('div', { class: 'row', style: 'justify-content:space-between' },
          el('div', { class: 'title' }, esc(g.quizTitle)),
          el('span', { class: 'status-tag status-' + g.status }, g.status)),
        el('div', { class: 'row-meta' },
          el('span', { class: 'chip chip-cyan mono' }, 'PIN ' + g.pin),
          el('span', { class: 'chip' }, ico('users'), String(MR.objToArr(g.players).length)),
          el('span', { class: 'chip' }, 'Q ' + (g.currentIndex + 1) + '/' + g.totalQuestions)),
        el('div', { class: 'item-actions' },
          el('a', { class: 'btn btn-sm btn-cyan', href: 'host.html?pin=' + g.pin, target: '_blank' }, ico('monitor'), 'Open Host'),
          el('button', { class: 'btn btn-sm btn-ghost', onClick: () => del('End this game?', () => MR.game.endGame(g.pin)) }, ico('stop'), 'End'))));
    });
    root.append(grid);
  }

  /* ---------------- Participants ---------------- */
  function viewParticipants(root) {
    const rows = [];
    A.cache.games.forEach(g => MR.objToArr(g.players).forEach(p =>
      rows.push({ ...p, pin: g.pin, quiz: g.quizTitle, event: g.event })));
    rows.sort((a, b) => b.joinedAt - a.joinedAt);

    root.append(pageHead('Participants', `${rows.length} entries across all games.`));
    const search = el('input', { class: 'input', placeholder: 'Search name, college, department…' });
    root.append(el('div', { class: 'toolbar' }, el('div', { class: 'search-field' }, ico('search'), search)));
    const wrap = el('div', { class: 'table-wrap glass' });
    root.append(wrap);
    const draw = (term = '') => {
      const t = term.toLowerCase();
      const filtered = rows.filter(r => [r.name, r.college, r.department, r.year, r.pin, r.quiz].join(' ').toLowerCase().includes(t));
      wrap.innerHTML = '';
      const table = el('table', { class: 'data' });
      table.innerHTML = `<thead><tr><th>Name</th><th>College</th><th>Dept</th><th>Year</th><th>Quiz</th><th>PIN</th><th>Score</th></tr></thead>`;
      const tb = el('tbody');
      if (!filtered.length) tb.append(el('tr', {}, el('td', { colspan: '7' }, el('div', { class: 'empty' }, 'No participants found'))));
      filtered.slice(0, 300).forEach(r => tb.append(el('tr', {},
        el('td', {}, el('div', { class: 'row gap-2' }, el('span', { class: 'avatar', style: `width:28px;height:28px;font-size:.7rem;background:${avatarColor(r.name)}` }, initials(r.name)), esc(r.name))),
        el('td', {}, esc(r.college)), el('td', {}, esc(r.department)), el('td', {}, esc(r.year)),
        el('td', {}, esc(r.quiz)), el('td', { class: 'mono' }, r.pin),
        el('td', { class: 'mono' }, String(r.score || 0)))));
      table.append(tb); wrap.append(table);
    };
    draw();
    search.addEventListener('input', MR.util.debounce(() => draw(search.value), 150));
  }

  /* ---------------- Results ---------------- */
  function viewResults(root) {
    root.append(pageHead('Results', 'Completed games and their leaderboards.'));
    const ended = A.cache.games.filter(g => g.status === 'ended' || g.resultsReady);
    const grid = el('div', { class: 'list-grid' });
    if (!ended.length) grid.append(emptyBlock('trophy', 'No results yet', 'Finish a game to see results here.'));
    ended.forEach(g => {
      const players = MR.objToArr(g.players).sort((a, b) => b.score - a.score);
      grid.append(el('div', { class: 'item-card glass' },
        el('div', { class: 'title' }, esc(g.quizTitle)),
        el('div', { class: 'row-meta' },
          el('span', { class: 'chip' }, ico('users'), String(players.length)),
          el('span', { class: 'chip' }, 'PIN ' + g.pin),
          g.event ? el('span', { class: 'chip chip-cyan' }, esc(g.event)) : ''),
        players[0] ? el('div', { class: 'muted', style: 'font-size:.86rem' }, '🥇 ' + esc(players[0].name) + ' — ' + (players[0].score || 0) + ' pts') : '',
        el('div', { class: 'item-actions' },
          el('a', { class: 'btn btn-sm btn-primary', href: '#/results/' + g.pin }, ico('trophy'), 'View'),
          el('button', { class: 'btn btn-sm btn-cyan', onClick: () => exportGame(g.pin) }, ico('download'), 'CSV'))));
    });
    root.append(grid);
  }

  async function viewResultDetail(root, pin) {
    const g = A.cache.games.find(x => x.pin === pin);
    const cm = g ? (g.certMode || (g.issueCertificates === false ? 'off' : 'all')) : 'all';
    root.append(pageHead('Results · ' + pin, g ? esc(g.quizTitle) : '',
      [el('a', { class: 'btn btn-ghost', href: '#/results' }, ico('arrowLeft'), 'Back'),
       // Certificates are created ONLY on this explicit click — never automatically.
       ...(cm !== 'off' ? [el('button', { class: 'btn btn-gold', onClick: () => genCerts(root, pin) },
            ico('award'), g?.certsIssued ? 'Regenerate Certificates' : 'Generate Certificates')] : []),
       el('button', { class: 'btn btn-cyan', onClick: () => exportGame(pin) }, ico('download'), 'Export CSV'),
       ...(MR.SHEETS_WEBHOOK ? [el('button', { class: 'btn btn-ghost', onClick: () => pushGame(pin) }, ico('upload'), 'Sheets')] : [])]));
    const wrap = el('div', { class: 'table-wrap glass' }); root.append(wrap);
    const res = await MR.game.getResults(pin);
    const rows = res?.leaderboard || [];
    const table = el('table', { class: 'data' });
    table.innerHTML = `<thead><tr><th>Rank</th><th>Name</th><th>Dept</th><th>Score</th><th>Accuracy</th><th>Achievement</th><th>Certificate</th></tr></thead>`;
    const tb = el('tbody');
    if (!rows.length) tb.append(el('tr', {}, el('td', { colspan: '7' }, el('div', { class: 'empty' }, 'No result rows'))));
    rows.forEach(c => tb.append(el('tr', {},
      el('td', {}, el('b', {}, ['🥇', '🥈', '🥉'][c.rank - 1] || c.rank)),
      el('td', {}, esc(c.name)), el('td', {}, esc(c.department)),
      el('td', { class: 'mono' }, String(c.score)), el('td', { class: 'mono' }, c.accuracy + '%'),
      el('td', {}, esc(c.achievement)),
      el('td', {}, c.id
        ? el('a', { class: 'btn btn-sm btn-ghost', href: 'certificate.html?cid=' + c.id, target: '_blank' }, ico('award'), 'View')
        : el('span', { class: 'muted' }, '—')))));
    table.append(tb); wrap.append(table);
  }

  async function genCerts(root, pin) {
    if (!confirm('Generate certificates for this game now? Students will then be able to view and download them.')) return;
    toast('Generating certificates…', 'info');
    try {
      const r = await MR.game.generateCertificates(pin);
      toast(r.created ? `${r.created} certificate${r.created > 1 ? 's' : ''} generated` : 'No certificates generated (mode is None)', r.created ? 'ok' : 'err');
      root.innerHTML = ''; viewResultDetail(root, pin);   // refresh so the View links appear
    } catch (e) { toast('Could not generate certificates', 'err'); }
  }

  /* ---------------- Analytics ---------------- */
  function viewAnalytics(root) {
    root.append(pageHead('Analytics', 'Participation & performance insights.'));
    const games = A.cache.games, certs = A.cache.certificates;
    const ended = games.filter(g => g.status === 'ended');
    const totalPlayers = games.reduce((s, g) => s + MR.objToArr(g.players).length, 0);
    const avgAcc = certs.length ? Math.round(certs.reduce((s, c) => s + (c.accuracy || 0), 0) / certs.length) : 0;

    const stats = el('div', { class: 'stat-grid' });
    [['monitor', games.length, 'Games Hosted'], ['users', totalPlayers, 'Participations'],
     ['flag', ended.length, 'Completed'], ['chart', avgAcc + '%', 'Avg Accuracy']].forEach(([name, v, l]) => {
      stats.append(el('div', { class: 'stat glass' }, el('div', { class: 'stat-ic' }, ico(name, 22)), el('div', { class: 'val mono' }, String(v)), el('div', { class: 'lbl' }, l)));
    });
    root.append(stats);

    const grid = el('div', { class: 'analytics-grid', style: 'margin-top:22px' });

    // Participation per quiz
    const perQuiz = {};
    games.forEach(g => { perQuiz[g.quizTitle] = (perQuiz[g.quizTitle] || 0) + MR.objToArr(g.players).length; });
    grid.append(chartCard('Participation by Quiz', Object.entries(perQuiz).map(([k, v]) => [k, v])));

    // Top performers (rank-1 champions)
    const champs = {};
    certs.filter(c => c.rank === 1).forEach(c => { champs[c.name] = (champs[c.name] || 0) + 1; });
    grid.append(chartCard('Most Championships', Object.entries(champs).sort((a, b) => b[1] - a[1]).slice(0, 6), ' wins'));

    // Department distribution
    const depts = {};
    games.forEach(g => MR.objToArr(g.players).forEach(p => { depts[p.department] = (depts[p.department] || 0) + 1; }));
    grid.append(chartCard('Participation by Department', Object.entries(depts).sort((a, b) => b[1] - a[1]).slice(0, 8)));

    root.append(grid);
  }

  function chartCard(title, entries, suffix = '') {
    const card = el('div', { class: 'chart-card glass' }, el('h3', {}, title));
    if (!entries.length) { card.append(emptyInline('No data yet')); return card; }
    const max = Math.max(...entries.map(e => e[1]), 1);
    entries.forEach(([label, val]) => {
      const bar = el('div', { class: 'hbar' },
        el('div', { class: 'lbl', title: label }, label || '—'),
        el('div', { class: 'track' }, el('div', { class: 'fill', style: `width:${Math.max(6, (val / max) * 100)}%` })),
        el('div', { class: 'val' }, val + suffix));
      card.append(bar);
    });
    return card;
  }

  /* ---------------- Certificates ---------------- */
  function viewCertificates(root) {
    root.append(pageHead('Certificates', `${A.cache.certificates.length} issued certificates.`));
    const search = el('input', { class: 'input', placeholder: 'Search name or certificate ID…' });
    root.append(el('div', { class: 'toolbar' }, el('div', { class: 'search-field' }, ico('search'), search)));
    const wrap = el('div', { class: 'table-wrap glass' }); root.append(wrap);
    const draw = (term = '') => {
      const t = term.toLowerCase();
      const rows = A.cache.certificates.filter(c => [c.name, c.id, c.quiz, c.achievement].join(' ').toLowerCase().includes(t));
      wrap.innerHTML = '';
      const table = el('table', { class: 'data' });
      table.innerHTML = `<thead><tr><th>Cert ID</th><th>Name</th><th>Quiz</th><th>Rank</th><th>Score</th><th>Issued</th><th></th></tr></thead>`;
      const tb = el('tbody');
      if (!rows.length) tb.append(el('tr', {}, el('td', { colspan: '7' }, el('div', { class: 'empty' }, 'No certificates found'))));
      rows.slice(0, 300).forEach(c => tb.append(el('tr', {},
        el('td', { class: 'mono' }, c.id),
        el('td', {}, esc(c.name)), el('td', {}, esc(c.quiz)),
        el('td', {}, ['🥇', '🥈', '🥉'][c.rank - 1] || c.rank),
        el('td', { class: 'mono' }, String(c.score)), el('td', {}, fmtDate(c.issuedAt)),
        el('td', {}, el('div', { class: 'row gap-1' },
          el('a', { class: 'btn btn-sm btn-ghost', title: 'Certificate', href: 'certificate.html?cid=' + c.id, target: '_blank' }, ico('award')),
          el('a', { class: 'btn btn-sm btn-ghost', title: 'Verify link', href: 'verify.html?cid=' + c.id, target: '_blank' }, ico('link')))))));
      table.append(tb); wrap.append(table);
    };
    draw();
    search.addEventListener('input', MR.util.debounce(() => draw(search.value), 150));
  }

  /* ---------------- Export ---------------- */
  function viewExport(root) {
    root.append(pageHead('Export', 'Download results as CSV/Excel or push to Google Sheets.'));
    const ended = A.cache.games.filter(g => g.status === 'ended' || g.resultsReady);
    if (!ended.length) { root.append(emptyBlock('download', 'Nothing to export', 'Finish a game first.')); return; }
    const card = el('div', { class: 'glass card-lg', style: 'max-width:560px' });
    const sel = el('select', { class: 'select' }, ...ended.map(g => el('option', { value: g.pin }, `${g.quizTitle} — PIN ${g.pin} (${MR.objToArr(g.players).length} players)`)));
    card.append(el('div', { class: 'field' }, el('label', {}, 'Select a game'), sel));
    const info = el('div', { class: 'muted', style: 'font-size:.85rem;margin:6px 0 18px' },
      'Columns: ' + MR.exporter.HEADERS.join(', '));
    card.append(info);
    const actions = el('div', { class: 'row gap-2', style: 'flex-wrap:wrap' },
      el('button', { class: 'btn btn-primary', onClick: () => exportGame(sel.value) }, ico('download'), 'Download CSV / Excel'));
    if (MR.SHEETS_WEBHOOK) actions.append(el('button', { class: 'btn btn-cyan', onClick: () => pushGame(sel.value) }, ico('upload'), 'Push to Google Sheets'));
    else actions.append(el('span', { class: 'chip' }, 'Set MR.SHEETS_WEBHOOK for Sheets export'));
    card.append(actions);
    root.append(card);
  }

  async function exportGame(pin) {
    const res = await MR.game.getResults(pin);
    if (!res?.leaderboard?.length) return toast('No results to export', 'err');
    MR.exporter.downloadCSV(res.leaderboard, `meriise-${pin}.csv`);
    toast('CSV downloaded', 'ok');
  }
  async function pushGame(pin) {
    const res = await MR.game.getResults(pin);
    try { await MR.exporter.pushToSheets(res.leaderboard); toast('Sent to Google Sheets', 'ok'); }
    catch (e) { toast(e.message, 'err'); }
  }

  /* ---------------- Shared bits ---------------- */
  function emptyBlock(name, title, sub) {
    return el('div', { class: 'empty glass card-lg', style: 'grid-column:1/-1' },
      el('div', { class: 'ic' }, ico(name, 46)), el('h3', {}, title), el('p', { class: 'muted', style: 'margin-top:6px' }, sub));
  }
  function emptyInline(msg) { return el('div', { class: 'empty', style: 'padding:24px' }, el('p', { class: 'muted' }, msg)); }
  function seedNote(label, fn) {
    return el('div', { class: 'glass card', style: 'margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap' },
      el('span', { class: 'muted' }, '💡 Running in demo mode — want some sample data?'),
      el('button', { class: 'btn btn-sm btn-cyan', onClick: async (e) => { e.target.disabled = true; await fn(); toast('Sample added', 'ok'); } }, label));
  }
  function del(msg, fn) { if (confirm(msg)) fn().then(() => toast('Deleted', 'ok')); }
})();
