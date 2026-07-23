// pages/typing.js — Speed Typing game logic.
// Depends on window.MTC (defined in ../script.js) for XP/stat persistence.
(function () {
  'use strict';

  var SNIPPETS = {
    c: [
      '#include <stdio.h>\n\nint main(void) {\n    int sum = 0;\n    for (int i = 1; i <= 10; i++) {\n        sum += i;\n    }\n    printf("Sum: %d\\n", sum);\n    return 0;\n}',
      '#include <stdio.h>\n\nint square(int n) {\n    return n * n;\n}\n\nint main(void) {\n    printf("%d\\n", square(7));\n    return 0;\n}'
    ],
    python: [
      'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nfor i in range(6):\n    print(i, factorial(i))',
      'nums = [5, 3, 8, 1, 9]\nnums.sort()\nprint("Sorted:", nums)\nprint("Max:", nums[-1])'
    ],
    java: [
      'public class Main {\n    public static void main(String[] args) {\n        int[] nums = {5, 3, 8, 1, 9};\n        int max = nums[0];\n        for (int n : nums) {\n            if (n > max) max = n;\n        }\n        System.out.println("Max: " + max);\n    }\n}',
      'public class Main {\n    static int square(int n) {\n        return n * n;\n    }\n    public static void main(String[] args) {\n        System.out.println(square(7));\n    }\n}'
    ]
  };

  var currentLang = 'c';
  var currentSnippet = '';
  var startTime = null;
  var finished = false;

  var targetEl = document.getElementById('typingTarget');
  var inputEl = document.getElementById('typingInput');
  var startBtn = document.getElementById('startBtn');
  var newSnippetBtn = document.getElementById('newSnippetBtn');
  var statWpm = document.getElementById('statWpm');
  var statAccuracy = document.getElementById('statAccuracy');
  var statTime = document.getElementById('statTime');
  var resultPanel = document.getElementById('resultPanel');
  var resultSummary = document.getElementById('resultSummary');
  var resultXp = document.getElementById('resultXp');
  var tabs = document.querySelectorAll('.app-lang-tab');

  function pickSnippet(lang) {
    var list = SNIPPETS[lang];
    return list[Math.floor(Math.random() * list.length)];
  }

  function renderTarget() {
    var html = '';
    for (var i = 0; i < currentSnippet.length; i++) {
      var ch = currentSnippet[i] === ' ' ? '&nbsp;' : currentSnippet[i].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<span class="ty-pending" data-i="' + i + '">' + ch + '</span>';
    }
    targetEl.innerHTML = html;
  }

  function loadNewSnippet() {
    currentSnippet = pickSnippet(currentLang);
    renderTarget();
    inputEl.value = '';
    inputEl.disabled = true;
    startTime = null;
    finished = false;
    resultPanel.style.display = 'none';
    statWpm.textContent = '0';
    statAccuracy.textContent = '100%';
    statTime.textContent = '0.0s';
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      currentLang = tab.getAttribute('data-lang');
      loadNewSnippet();
    });
  });

  startBtn.addEventListener('click', function () {
    inputEl.disabled = false;
    inputEl.value = '';
    inputEl.focus();
    startTime = null;
    finished = false;
    resultPanel.style.display = 'none';
    renderTarget();
  });

  newSnippetBtn.addEventListener('click', loadNewSnippet);

  var timerInterval = null;

  function updateLiveStats() {
    if (!startTime) return;
    var elapsedSec = (Date.now() - startTime) / 1000;
    statTime.textContent = elapsedSec.toFixed(1) + 's';
  }

  inputEl.addEventListener('input', function () {
    if (finished) return;
    if (!startTime) {
      startTime = Date.now();
      timerInterval = setInterval(updateLiveStats, 100);
    }

    var typed = inputEl.value;
    var spans = targetEl.querySelectorAll('span');
    var correctCount = 0;

    for (var i = 0; i < spans.length; i++) {
      spans[i].className = 'ty-pending';
      if (i < typed.length) {
        if (typed[i] === currentSnippet[i]) {
          spans[i].className = 'ty-correct';
          correctCount++;
        } else {
          spans[i].className = 'ty-incorrect';
        }
      } else if (i === typed.length) {
        spans[i].className = 'ty-current';
      }
    }

    var accuracy = typed.length > 0 ? Math.round((correctCount / typed.length) * 100) : 100;
    statAccuracy.textContent = accuracy + '%';

    if (typed.length >= currentSnippet.length) {
      finish(correctCount, typed.length);
    }
  });

  function finish(correctCount, totalTyped) {
    finished = true;
    inputEl.disabled = true;
    clearInterval(timerInterval);

    var elapsedMinutes = Math.max((Date.now() - startTime) / 60000, 0.02);
    var wpm = Math.min(Math.round((currentSnippet.length / 5) / elapsedMinutes), 220);
    var accuracy = Math.round((correctCount / totalTyped) * 100);

    statWpm.textContent = String(wpm);
    statAccuracy.textContent = accuracy + '%';
    statTime.textContent = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

    var xpEarned = Math.max(2, Math.round(wpm / 8) + Math.round(accuracy / 20));
    if (window.MTC) {
      window.MTC.addXP(xpEarned);
      var stats = window.MTC.getStats();
      stats.typingRuns = (stats.typingRuns || 0) + 1;
      var prevBest = (stats.typingBestWpm && stats.typingBestWpm[currentLang]) || 0;
      stats.typingBestWpm = stats.typingBestWpm || {};
      stats.typingBestWpm[currentLang] = Math.max(prevBest, wpm);
      window.MTC.saveStats(stats);
      window.MTC.recordActivity({
        type: 'typing',
        label: 'Speed Typing (' + currentLang.toUpperCase() + ')',
        detail: wpm + ' WPM, ' + accuracy + '% accuracy',
        xp: xpEarned
      });
    }

    resultPanel.style.display = 'block';
    resultSummary.textContent = wpm + ' WPM at ' + accuracy + '% accuracy.';
    resultXp.textContent = '+' + xpEarned + ' XP earned';
  }

  loadNewSnippet();
})();
