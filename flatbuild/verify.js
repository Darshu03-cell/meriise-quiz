/* ============================================================
   ME-RIISE QUIZ — Public certificate verification
   ============================================================ */
(function () {
  const { $, el, esc, fmtDate } = MR.util;
  const form = $('#verifyForm'), input = $('#cidInput'), result = $('#result');

  const preset = MR.util.qs('cid');
  if (preset) { input.value = preset; verify(preset); }

  form.addEventListener('submit', (e) => { e.preventDefault(); verify(input.value.trim()); });
  input.addEventListener('input', () => input.value = input.value.toUpperCase());

  async function verify(id) {
    if (!id) return;
    result.innerHTML = '';
    const loading = el('div', { class: 'glass card row gap-2 anim-in', style: 'justify-content:center' }, el('span', { class: 'spinner' }), 'Verifying…');
    result.append(loading);
    let cert = null;
    try { cert = await MR.game.getCertificate(id); } catch {}
    result.innerHTML = '';
    if (!cert) { result.append(notFound(id)); return; }

    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const card = el('div', { class: 'glass verify-card anim-up' });
    card.append(el('div', { class: 'result-head ok' },
      el('span', { class: 'big' }, '✅'),
      el('div', {}, el('div', { style: 'font-family:var(--font-display);font-weight:700;font-size:1.2rem' }, 'Authentic Certificate'),
        el('div', { class: 'muted', style: 'font-size:.86rem' }, 'Issued by ME-RIISE Foundation'))));
    const kv = el('div', { class: 'kv' });
    const rows = [
      ['Certificate ID', el('span', { class: 'mono' }, cert.id)],
      ['Name', esc(cert.name)],
      ['College', esc(cert.college || '—')],
      ['Department', esc(cert.department || '—')],
      ['Event', esc(cert.event || '—')],
      ['Quiz', esc(cert.quiz || '—')],
      ['Achievement', el('span', {}, el('span', { class: 'medal-lg' }, medals[cert.rank] || '🎖️'), ' ' + esc(cert.achievement || 'Participant'))],
      ['Rank', '#' + cert.rank],
      ['Score', String(cert.score)],
      ['Accuracy', cert.accuracy + '%'],
      ['Issued On', fmtDate(cert.issuedAt)],
    ];
    rows.forEach(([k, v]) => { kv.append(el('div', { class: 'k' }, k), el('div', { class: 'v' }, v)); });
    card.append(kv);
    card.append(el('div', { style: 'padding:0 20px 20px' },
      el('a', { class: 'btn btn-primary btn-block', href: 'certificate.html?cid=' + cert.id, target: '_blank' }, '🏅 View Full Certificate')));
    result.append(card);
    MR.util.confetti({ count: 60, duration: 2400 });
  }

  function notFound(id) {
    const card = el('div', { class: 'glass verify-card anim-up' });
    card.append(el('div', { class: 'result-head bad' },
      el('span', { class: 'big' }, '❌'),
      el('div', {}, el('div', { style: 'font-family:var(--font-display);font-weight:700;font-size:1.2rem' }, 'Not Verified'),
        el('div', { class: 'muted', style: 'font-size:.86rem' }, 'No certificate found for ID “' + esc(id) + '”'))));
    card.append(el('div', { style: 'padding:20px' }, el('p', { class: 'muted' }, 'Please double-check the Certificate ID. Genuine ME-RIISE certificates have IDs like MR-123456-001-ABCD.')));
    return card;
  }
})();
