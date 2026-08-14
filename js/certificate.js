/* ============================================================
   ME-RIISE QUIZ — Certificate renderer
   ============================================================ */
(function () {
  const { $, el, esc, toast, makeQR } = MR.util;
  const mount = $('#certMount'), toolbar = $('#toolbar');
  const cid = MR.util.qs('cid');

  // Preview mode — lets you review the design/logo/signature without finishing a game.
  const SAMPLE = { id: 'MR-000000-001-PRVW', name: 'Ananya Rao', college: 'Malnad College of Engineering',
    department: 'Computer Science', year: '3rd Year', event: 'TechRise 2026', quiz: 'ME-RIISE Innovation Challenge',
    rank: 1, score: 8450, accuracy: 92, achievement: '🥇 Quiz Champion', issuedAt: Date.now() };

  if (!cid || /^preview$/i.test(cid)) { render(SAMPLE); return; }

  MR.game.getCertificate(cid).then(cert => {
    if (!cert) { renderError('Certificate not found. It may not have been issued yet.'); return; }
    render(cert);
  }).catch(() => renderError('Could not load certificate.'));

  function render(c) {
    const isTop3 = c.rank <= 3;
    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const verifyUrl = location.origin + location.pathname.replace(/certificate\.html$/, 'verify.html') + '?cid=' + c.id;

    const cert = el('div', { class: 'certificate', id: 'certificate' });
    cert.innerHTML = `
      <div class="glow-orb a"></div><div class="glow-orb b"></div>
      <div class="frame"></div>
      <div class="edge tl"></div><div class="edge tr"></div><div class="edge bl"></div><div class="edge br"></div>
      <div class="cert-inner">
        <div class="cert-head">
          <div class="cert-brand">
            <div class="cert-logo-plate">
              <img src="assets/meriise-logo.webp" alt="ME-RIISE Foundation"
                   onerror="this.onerror=null;this.src='assets/meriise-logo.svg'">
            </div>
            <div class="txt"><b>ME-RIISE QUIZ</b><small>Malnad College of Engineering</small></div>
          </div>
          <div class="cert-ribbon">
            <div class="medal">${medals[c.rank] || '🎖️'}</div>
            <div class="achv">${esc(c.achievement || 'Participant')}</div>
          </div>
        </div>

        <div class="cert-body">
          <div class="kicker">Certificate of ${isTop3 ? 'Achievement' : 'Participation'}</div>
          <div class="cert-title">${esc(c.quiz || 'Quiz')}</div>
          <div class="cert-awarded">This certificate is proudly presented to</div>
          <div class="cert-name ${c.rank === 1 ? 'gold' : ''}">${esc(c.name)}</div>
          <div class="cert-underline"></div>
          <div class="cert-desc">
            of <b>${esc(c.college || 'Malnad College of Engineering')}</b>${c.department ? `, ${esc(c.department)}` : ''}
            ${isTop3 ? `for the outstanding achievement of securing <b>Rank #${c.rank}</b>` : `for enthusiastic participation`}
            in <b>${esc(c.quiz)}</b>${c.event ? ` at <b>${esc(c.event)}</b>` : ''}.
          </div>
          <div class="cert-stats">
            <div class="s"><div class="v">#${c.rank}</div><div class="l">Rank</div></div>
            <div class="s"><div class="v">${c.score}</div><div class="l">Score</div></div>
            <div class="s"><div class="v">${c.accuracy}%</div><div class="l">Accuracy</div></div>
          </div>
        </div>

        <div class="cert-foot">
          <div class="sign">
            <div class="sig-name">Geetha Kiran A</div>
            <div class="line"></div>
            <div class="who">Dr. Geetha Kiran A</div>
            <small>CEO, ME-RIISE Foundation</small>
          </div>
          <div class="cert-verify">
            <div id="certQR"></div>
            <div class="vtext">
              <small>Certificate ID</small>
              <div class="cid">${esc(c.id)}</div>
              <small>Issued ${MR.util.fmtDate(c.issuedAt)}</small>
              <small>Scan QR to verify authenticity</small>
            </div>
          </div>
        </div>
      </div>
      ${isTop3 ? `<div class="cert-seal"><span>✔</span>VERIFIED<br>WINNER</div>` : ''}`;
    mount.innerHTML = '';
    mount.append(cert);
    cert.querySelector('#certQR').append(qrImage(verifyUrl, 96));
    fitScale(cert);
    window.addEventListener('resize', () => fitScale(cert));

    // toolbar
    toolbar.innerHTML = '';
    toolbar.append(
      el('button', { class: 'btn btn-primary', onClick: () => window.print() }, '🖨️ Print / Save PDF'),
      el('button', { class: 'btn btn-cyan', onClick: () => downloadPNG(c) }, '🖼️ Download PNG'),
      el('a', { class: 'btn btn-ghost', href: verifyUrl, target: '_blank' }, '🔗 Verify'),
      el('a', { class: 'btn btn-ghost', href: 'index.html' }, '🏠 Home'));
    if (c.rank <= 3) MR.util.confetti({ count: 140, duration: 4000 });
  }

  function fitScale(cert) {
    const avail = Math.min(document.querySelector('.cert-scale').clientWidth, 1123);
    const scale = Math.min(1, avail / 1123);
    cert.style.transform = `scale(${scale})`;
    cert.parentElement.style.height = (794 * scale) + 'px';
  }

  async function downloadPNG(c) {
    toast('Rendering image…', 'info');
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      const cert = $('#certificate');
      // Wait for web fonts (signature script) and all images (QR, logo) so nothing shifts or goes blank.
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
      await Promise.all(Array.from(cert.querySelectorAll('img')).map(im =>
        (im.complete && im.naturalWidth) ? Promise.resolve()
          : new Promise(res => { im.onload = res; im.onerror = res; setTimeout(res, 4000); })));
      const prev = cert.style.transform; cert.style.transform = 'none';
      const canvas = await html2canvas(cert, {
        backgroundColor: '#060a18', scale: 2, useCORS: true, imageTimeout: 8000,
        onclone: (doc) => { doc.querySelectorAll('.glow-orb').forEach(o => { o.style.display = 'none'; }); }
      });
      cert.style.transform = prev;
      const a = el('a', { href: canvas.toDataURL('image/png'), download: `ME-RIISE-Certificate-${c.id}.png` });
      document.body.append(a); a.click(); a.remove();
      toast('Certificate downloaded', 'ok');
    } catch (e) {
      toast('PNG export unavailable — use Print / Save PDF', 'err');
    }
  }

  // QR as a data-URL <img> — captured reliably by html2canvas AND print.
  // The temp element is attached to the DOM so qrcode.js actually paints the canvas.
  function qrImage(text, size) {
    const frame = el('div', { class: 'qr-frame' });
    const img = new Image(size, size);
    img.width = size; img.height = size; img.alt = 'Verification QR'; img.style.display = 'block';
    let src = '';
    try {
      if (window.QRCode) {
        const tmp = el('div', { style: 'position:fixed;left:-9999px;top:0' });
        document.body.appendChild(tmp);
        new window.QRCode(tmp, { text, width: size, height: size, correctLevel: window.QRCode.CorrectLevel.M });
        const canvas = tmp.querySelector('canvas');
        const qi = tmp.querySelector('img');
        src = canvas ? canvas.toDataURL('image/png') : (qi ? qi.src : '');
        document.body.removeChild(tmp);
      }
    } catch (e) { src = ''; }
    if (!src) { img.crossOrigin = 'anonymous'; src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`; }
    img.src = src;
    frame.append(img);
    return frame;
  }

  function renderError(msg) {
    toolbar.innerHTML = '';
    mount.innerHTML = '';
    mount.append(el('div', { class: 'empty glass card-lg anim-up', style: 'max-width:480px' },
      el('div', { class: 'ic' }, '🔍'), el('h3', {}, 'Certificate unavailable'),
      el('p', { class: 'muted', style: 'margin:8px 0 18px' }, msg),
      el('a', { class: 'btn btn-primary', href: 'index.html' }, 'Back to Home')));
  }

  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); }); }
})();
