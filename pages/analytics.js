// pages/analytics.js — Performance Analytics dashboard.
(function () {
  'use strict';

  function barRow(label, value, max, color) {
    var pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    var row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML =
      '<span class="bar-row-label">' + label + '</span>' +
      '<span class="bar-row-track"><span class="bar-row-fill" style="width:' + pct + '%; background:' + color + ';"></span></span>' +
      '<span class="bar-row-value">' + value + '</span>';
    return row;
  }

  function timeAgo(ts) {
    var diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (diffSec < 60) return diffSec + 's ago';
    var diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return diffMin + 'm ago';
    var diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return diffHr + 'h ago';
    return Math.round(diffHr / 24) + 'd ago';
  }

  function render() {
    if (!window.MTC) return;
    var xp = window.MTC.getXP();
    var info = window.MTC.xpToLevel(xp);
    var stats = window.MTC.getStats();

    document.getElementById('aLevel').textContent = 'Lvl ' + info.level;
    document.getElementById('aXp').textContent = String(xp);
    document.getElementById('aQuizBest').textContent = stats.quizRuns ? stats.quizBest + '%' : '—';

    var wpmContainer = document.getElementById('wpmBars');
    wpmContainer.innerHTML = '';
    var best = stats.typingBestWpm || { c: 0, python: 0, java: 0 };
    var maxWpm = Math.max(best.c || 0, best.python || 0, best.java || 0, 40);
    wpmContainer.appendChild(barRow('C', best.c || 0, maxWpm, '#6366f1'));
    wpmContainer.appendChild(barRow('Python', best.python || 0, maxWpm, '#10b981'));
    wpmContainer.appendChild(barRow('Java', best.java || 0, maxWpm, '#f59e0b'));
    if (!stats.typingRuns) {
      var hint = document.createElement('p');
      hint.className = 'text-sm text-muted';
      hint.style.marginTop = '0.5rem';
      hint.textContent = 'No typing runs yet.';
      wpmContainer.appendChild(hint);
    }

    var debugContainer = document.getElementById('debugBar');
    debugContainer.innerHTML = '';
    var debugAccuracy = stats.debuggerTotal ? Math.round((stats.debuggerCorrect / stats.debuggerTotal) * 100) : 0;
    debugContainer.appendChild(barRow('Accuracy', debugAccuracy, 100, '#f43f5e'));
    var debugNote = document.createElement('p');
    debugNote.className = 'text-sm text-muted';
    debugNote.style.marginTop = '0.5rem';
    debugNote.textContent = stats.debuggerTotal
      ? (stats.debuggerCorrect + ' / ' + stats.debuggerTotal + ' bugs found correctly across all rounds.')
      : 'No debugger rounds played yet.';
    debugContainer.appendChild(debugNote);

    var activityList = document.getElementById('activityList');
    if (stats.history && stats.history.length) {
      activityList.innerHTML = '';
      stats.history.forEach(function (item) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.08);';
        row.innerHTML =
          '<span><strong>' + item.label + '</strong><br><span class="text-muted" style="font-size:0.8rem;">' + item.detail + '</span></span>' +
          '<span style="text-align:right; white-space:nowrap;"><span style="color:#4ade80; font-weight:700;">+' + (item.xp || 0) + ' XP</span><br><span class="text-muted" style="font-size:0.75rem;">' + timeAgo(item.at) + '</span></span>';
        activityList.appendChild(row);
      });
    } else {
      activityList.innerHTML = '<p class="text-sm text-muted">Nothing recorded yet — go finish a typing run, a debugger round, or a quiz.</p>';
    }
  }

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!confirm('Reset all XP, level, and activity history? This cannot be undone.')) return;
    try {
      localStorage.removeItem('mtc-xp');
      localStorage.removeItem('mtc-stats');
    } catch (e) { /* ignore */ }
    if (window.MTC) window.MTC.renderLevelBadge();
    render();
  });

  render();
})();
