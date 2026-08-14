/* ============================================================
   ME-RIISE QUIZ — Shared utilities  (global namespace: MR)
   ============================================================ */
window.MR = window.MR || {};

MR.util = (function () {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== null && v !== undefined) node.setAttribute(k, v);
    });
    children.flat().forEach(c => node.append(c?.nodeType ? c : document.createTextNode(c ?? '')));
    return node;
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  const pad = (n, len = 2) => String(n).padStart(len, '0');

  const fmtTime = (ms) => {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const qs = (key) => new URLSearchParams(location.search).get(key);

  const debounce = (fn, wait = 250) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
  };

  const uid = (len = 12) => {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = ''; for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  };

  const genPin = () => String(Math.floor(100000 + Math.random() * 900000));

  const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  // Deterministic avatar color from a string
  const avatarColor = (str) => {
    let h = 0; for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return `hsl(${h} 80% 58%)`;
  };

  /* ---------- Toasts ---------- */
  let toastWrap;
  const toast = (msg, type = 'info', ms = 3200) => {
    if (!toastWrap) { toastWrap = el('div', { class: 'toast-wrap' }); document.body.append(toastWrap); }
    const icon = { ok: '✅', err: '⚠️', info: '💡' }[type] || '💡';
    const t = el('div', { class: `toast ${type}` }, el('span', { class: 'ic' }, icon), el('span', { class: 'grow' }, msg));
    toastWrap.append(t);
    setTimeout(() => { t.style.animation = 'fadeIn .3s reverse forwards'; setTimeout(() => t.remove(), 300); }, ms);
  };

  /* ---------- Modal ---------- */
  const modal = ({ title = '', body, actions = [], wide = false } = {}) => {
    const backdrop = el('div', { class: 'modal-backdrop' });
    const close = () => { backdrop.style.animation = 'fadeIn .2s reverse forwards'; setTimeout(() => backdrop.remove(), 200); };
    const head = el('div', { class: 'modal-head' },
      el('h3', {}, title),
      el('button', { class: 'modal-close', onClick: close, 'aria-label': 'Close' }, '✕'));
    const bodyNode = typeof body === 'string' ? el('div', { html: body }) : (body || el('div'));
    const footer = actions.length ? el('div', { class: 'row gap-2', style: 'justify-content:flex-end;margin-top:22px;flex-wrap:wrap' },
      ...actions.map(a => { const b = el('button', { class: `btn ${a.class || 'btn-ghost'}` }, a.label); b.addEventListener('click', () => a.onClick?.(close)); return b; })) : null;
    const panel = el('div', { class: 'modal glass card-lg' + (wide ? ' modal-wide' : '') }, head, bodyNode, footer || '');
    backdrop.append(panel);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', function esc(e){ if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    document.body.append(backdrop);
    return { close, panel, body: bodyNode };
  };

  /* ---------- Animated number counter ---------- */
  const countTo = (node, to, { from = 0, dur = 900, prefix = '', suffix = '' } = {}) => {
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const val = Math.round(from + (to - from) * ease(p));
      node.textContent = prefix + val.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Confetti ---------- */
  const confetti = ({ count = 160, duration = 4200 } = {}) => {
    const colors = ['#22e6ff', '#2f6bff', '#7c5cff', '#ff4ecd', '#ffd447', '#23d18b'];
    const layer = el('div', { class: 'confetti' });
    for (let i = 0; i < count; i++) {
      const p = el('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (2.4 + Math.random() * 2.4) + 's';
      p.style.animationDelay = Math.random() * 0.8 + 's';
      p.style.width = (6 + Math.random() * 8) + 'px';
      p.style.height = (10 + Math.random() * 10) + 'px';
      p.style.opacity = 0.7 + Math.random() * 0.3;
      layer.append(p);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), duration);
  };

  /* ---------- QR code (uses qrcode.js if present, else API image) ---------- */
  const makeQR = (text, size = 200) => {
    const frame = el('div', { class: 'qr-frame' });
    if (window.QRCode) {
      new window.QRCode(frame, { text, width: size, height: size, correctLevel: window.QRCode.CorrectLevel.M });
    } else {
      frame.append(el('img', { src: `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`, width: size, height: size, alt: 'QR code' }));
    }
    return frame;
  };

  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast('Copied to clipboard', 'ok'); } catch { toast('Copy failed', 'err'); } };

  const downloadFile = (filename, content, mime = 'text/csv') => {
    const blob = new Blob([content], { type: mime + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename }); document.body.append(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 300);
  };

  const toCSV = (rows) => rows.map(r => r.map(c => {
    const s = String(c ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\r\n');

  const accuracy = (correct, total) => total ? Math.round((correct / total) * 100) : 0;

  return { $, $$, el, esc, pad, fmtTime, fmtDate, qs, debounce, uid, genPin, initials,
           avatarColor, toast, modal, countTo, confetti, makeQR, copy, downloadFile, toCSV, accuracy };
})();

/* ============================================================
   Theme (light / dark) — floating toggle on every page
   ============================================================ */
MR.theme = (function () {
  const KEY = 'mr_theme';
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };
  const apply = (t) => { if (t === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme'); };
  const ICON = {
    sun:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5.1" y1="5.1" x2="6.8" y2="6.8"/><line x1="17.2" y1="17.2" x2="18.9" y2="18.9"/><line x1="5.1" y1="18.9" x2="6.8" y2="17.2"/><line x1="17.2" y1="6.8" x2="18.9" y2="5.1"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };
  let btn;
  const refresh = () => { if (btn) btn.innerHTML = read() === 'light' ? ICON.moon : ICON.sun; };
  const set = (t) => { try { localStorage.setItem(KEY, t); } catch {} apply(t); refresh(); };
  const toggle = () => set(read() === 'light' ? 'dark' : 'light');
  function mount() {
    apply(read());
    btn = document.createElement('button');
    btn.className = 'theme-toggle'; btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle light or dark theme');
    btn.title = 'Toggle light / dark';
    btn.addEventListener('click', toggle);
    refresh();
    document.body.appendChild(btn);
  }
  apply(read()); // apply immediately (in case the <head> pre-script was missed)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  return { toggle, set, get: read };
})();
