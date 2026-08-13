/* ============================================================
   ME-RIISE QUIZ — Clean line-icon set (Feather-style, monochrome)
   Use:  MR.icon('name', size)  -> SVG element
         MR.iconHTML('name', size) -> string
   Icons inherit `currentColor`, so colour comes from CSS.
   ============================================================ */
window.MR = window.MR || {};

(function () {
  const P = {
    grid:     '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><line x1="16" y1="2.5" x2="16" y2="6.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="3" y1="10" x2="21" y2="10"/>',
    help:     '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.3a2.6 2.6 0 1 1 3.6 2.5c-.9.4-1.5 1-1.5 2"/><line x1="12" y1="16.8" x2="12" y2="16.81"/>',
    live:     '<circle cx="12" cy="12" r="2.4"/><path d="M8.5 8.5a5 5 0 0 0 0 7"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M6 6a9 9 0 0 0 0 12"/><path d="M18 6a9 9 0 0 1 0 12"/>',
    users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.6"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M15.5 3.3a4 4 0 0 1 0 7.4"/>',
    trophy:   '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.6A1.6 1.6 0 0 0 3 7.6 3.4 3.4 0 0 0 6.4 11H7"/><path d="M17 6h2.4A1.6 1.6 0 0 1 21 7.6 3.4 3.4 0 0 1 17.6 11H17"/>',
    chart:    '<rect x="3" y="12" width="4" height="8" rx="1.2"/><rect x="10" y="6" width="4" height="14" rx="1.2"/><rect x="17" y="9" width="4" height="11" rx="1.2"/>',
    award:    '<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4 7 21l5-2.8L17 21l-1.6-7.6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7.5 11 12 15.5 16.5 11"/><line x1="12" y1="15.5" x2="12" y2="3.5"/>',
    upload:   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="16.5 8 12 3.5 7.5 8"/><line x1="12" y1="3.5" x2="12" y2="15.5"/>',
    logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    monitor:  '<rect x="2.5" y="4" width="19" height="13" rx="2.5"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    plus:     '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit:     '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash:    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    launch:   '<path d="M5 13c-1.4 1-1.9 4.4-1.9 4.4s3.4-.5 4.4-1.9"/><path d="M14.5 4.6C11 6.1 8.2 9 7 12l5 5c3-1.2 5.9-4 7.4-7.5.5-1.6.6-3.6.5-5.4-1.8-.1-3.8 0-5.4.5z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    arrowLeft:'<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    arrowUp:  '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    arrowDown:'<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    play:     '<polygon points="6 4 19 12 6 20 6 4"/>',
    stop:     '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
    link:     '<path d="M10 13a5 5 0 0 0 7.5.5l3-3A5 5 0 0 0 13.5 3.5l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3A5 5 0 0 0 10.5 20.5l1.7-1.7"/>',
    save:     '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    search:   '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    pin:      '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
    star:     '<polygon points="12 3 14.7 9 21 9.6 16.2 13.9 17.7 20 12 16.8 6.3 20 7.8 13.9 3 9.6 9.3 9"/>',
    flag:     '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="4"/>',
    home:     '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    print:    '<polyline points="6 9 6 2.5 18 2.5 18 9"/><path d="M6 18H4.5A2 2 0 0 1 2.5 16v-4.5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2H18"/><rect x="6" y="14" width="12" height="7.5" rx="1"/>',
    image:    '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.6"/><polyline points="21 15 16 10 5 21"/>',
    shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11.4 14.4 16 9.6"/>',
    x:        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    menu:     '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    dot:      '<circle cx="12" cy="12" r="4"/>',
  };

  MR.iconHTML = function (name, size = 20) {
    const body = P[name] || P.dot;
    return `<svg class="mr-ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  };
  MR.icon = function (name, size = 20) {
    const t = document.createElement('template');
    t.innerHTML = MR.iconHTML(name, size);
    return t.content.firstElementChild;
  };
})();
