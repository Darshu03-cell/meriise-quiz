/* ============================================================
   ME-RIISE QUIZ — Result export (CSV / Excel / Google Sheets)
   Shared by Host & Admin.  Columns:
   Name, College, Department, Year, Event, Quiz, Score, Accuracy,
   Rank, Achievement, Certificate ID, Timestamp
   ============================================================ */
window.MR = window.MR || {};

MR.exporter = (function () {
  const HEADERS = ['Name', 'College', 'Department', 'Year', 'Event', 'Quiz',
    'Score', 'Accuracy', 'Rank', 'Achievement', 'Certificate ID', 'Timestamp'];

  // Map result/leaderboard rows (certificate objects) to export rows.
  function toRows(certs) {
    return (certs || []).map(c => ([
      c.name || '', c.college || '', c.department || '', c.year || '',
      c.event || '', c.quiz || '', c.score ?? 0, (c.accuracy ?? 0) + '%',
      c.rank ?? '', c.achievement || 'Participant', c.id || '',
      MR.util.fmtDate(c.issuedAt)
    ]));
  }

  function toObjects(certs) {
    return toRows(certs).map(r => Object.fromEntries(HEADERS.map((h, i) => [h, r[i]])));
  }

  function downloadCSV(certs, filename = 'meriise-quiz-results.csv') {
    const csv = MR.util.toCSV([HEADERS, ...toRows(certs)]);
    MR.util.downloadFile(filename, csv, 'text/csv');
  }

  async function pushToSheets(certs) {
    return MR.game.pushToSheets(toObjects(certs));
  }

  return { HEADERS, toRows, toObjects, downloadCSV, pushToSheets };
})();
