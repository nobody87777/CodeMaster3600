// pages/debugger.js — Debugger Arena game logic.
(function () {
  'use strict';

  var SNIPPETS = [
    {
      lang: 'C',
      lines: [
        '#include <stdio.h>',
        'int main(void) {',
        '    int arr[5] = {1, 2, 3, 4, 5};',
        '    int sum = 0;',
        '    for (int i = 0; i <= 5; i++) {',
        '        sum += arr[i];',
        '    }',
        '    printf("%d\\n", sum);',
        '    return 0;',
        '}'
      ],
      buggyLine: 4,
      explanation: 'The loop condition should be i < 5, not i <= 5. As written it reads arr[5], one element past the end of the array — undefined behavior in C.'
    },
    {
      lang: 'Python',
      lines: [
        'def add_item(item, basket=[]):',
        '    basket.append(item)',
        '    return basket',
        '',
        'print(add_item("apple"))',
        'print(add_item("banana"))'
      ],
      buggyLine: 0,
      explanation: 'Mutable default arguments in Python are created once, not per call — basket keeps growing across calls instead of starting fresh each time.'
    },
    {
      lang: 'Java',
      lines: [
        'String a = new String("hi");',
        'String b = new String("hi");',
        'if (a == b) {',
        '    System.out.println("Equal");',
        '} else {',
        '    System.out.println("Not equal");',
        '}'
      ],
      buggyLine: 2,
      explanation: '== compares object references in Java, not content. Two separately-constructed String objects are never == even with equal text — use .equals() instead.'
    },
    {
      lang: 'C',
      lines: [
        'switch (grade) {',
        '    case \'A\':',
        '        printf("Excellent\\n");',
        '    case \'B\':',
        '        printf("Good\\n");',
        '        break;',
        '    default:',
        '        printf("Try again\\n");',
        '}'
      ],
      buggyLine: 2,
      explanation: 'There is no break after the \'A\' case, so it falls through into case \'B\' and prints both messages for grade A.'
    },
    {
      lang: 'Python',
      lines: [
        'total = 0',
        'for i in range(1, 10):',
        '    total += i',
        'print("Sum 1 to 10:", total)'
      ],
      buggyLine: 1,
      explanation: 'range(1, 10) stops before 10, so it only sums 1 through 9. To include 10 it needs to be range(1, 11).'
    },
    {
      lang: 'Java',
      lines: [
        'int[] scores = {90, 85, 77, 92};',
        'for (int i = 0; i <= scores.length; i++) {',
        '    System.out.println(scores[i]);',
        '}'
      ],
      buggyLine: 1,
      explanation: 'scores.length is 4, and valid indices only go up to 3. i <= scores.length lets i reach 4, which throws ArrayIndexOutOfBoundsException.'
    },
    {
      lang: 'C',
      lines: [
        'int total;',
        'for (int i = 0; i < 5; i++) {',
        '    total += i;',
        '}',
        'printf("Total: %d\\n", total);'
      ],
      buggyLine: 0,
      explanation: 'total is declared but never initialized. In C it starts with an indeterminate value, so the final sum is garbage — it should start at 0.'
    },
    {
      lang: 'Python',
      lines: [
        'x = 1000',
        'y = 1000',
        'if x is y:',
        '    print("Same")',
        'else:',
        '    print("Different")'
      ],
      buggyLine: 2,
      explanation: '"is" checks object identity, not value equality. CPython doesn\'t guarantee caching integers this large, so this can print "Different" — use == to compare values.'
    }
  ];

  var order = [];
  var idx = 0;
  var correctCount = 0;
  var answered = false;

  var codeEl = document.getElementById('debugCode');
  var langEl = document.getElementById('snippetLang');
  var progressEl = document.getElementById('statProgress');
  var correctEl = document.getElementById('statCorrect');
  var accuracyEl = document.getElementById('statAccuracy');
  var feedback = document.getElementById('debugFeedback');
  var feedbackTitle = document.getElementById('debugFeedbackTitle');
  var feedbackText = document.getElementById('debugFeedbackText');
  var nextBtn = document.getElementById('nextBtn');
  var finalPanel = document.getElementById('finalPanel');
  var finalSummary = document.getElementById('finalSummary');
  var finalXp = document.getElementById('finalXp');
  var restartBtn = document.getElementById('restartBtn');
  var mainPanel = codeEl.closest('.app-panel');

  function shuffledIndices(n) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i);
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderSnippet() {
    answered = false;
    var snippet = SNIPPETS[order[idx]];
    langEl.textContent = snippet.lang;
    progressEl.textContent = (idx + 1) + ' / ' + order.length;
    feedback.style.display = 'none';
    nextBtn.style.display = 'none';

    var html = '';
    snippet.lines.forEach(function (line, i) {
      html += '<div class="debug-line" data-i="' + i + '"><span class="debug-line-num">' + (i + 1) + '</span><span>' + esc(line) + '</span></div>';
    });
    codeEl.innerHTML = html;

    codeEl.querySelectorAll('.debug-line').forEach(function (row) {
      row.addEventListener('click', function () {
        if (answered) return;
        handlePick(parseInt(row.getAttribute('data-i'), 10));
      });
    });
  }

  function handlePick(pickedIndex) {
    answered = true;
    var snippet = SNIPPETS[order[idx]];
    var rows = codeEl.querySelectorAll('.debug-line');
    var isCorrect = pickedIndex === snippet.buggyLine;

    rows[snippet.buggyLine].classList.add(isCorrect ? 'is-correct-pick' : 'is-buggy-revealed');
    if (!isCorrect) rows[pickedIndex].classList.add('is-wrong-pick');

    if (isCorrect) correctCount++;
    correctEl.textContent = String(correctCount);
    accuracyEl.textContent = Math.round((correctCount / (idx + 1)) * 100) + '%';

    feedback.style.display = 'block';
    feedbackTitle.textContent = isCorrect ? '✅ Correct!' : '❌ Not quite — line ' + (snippet.buggyLine + 1) + ' was the bug.';
    feedbackText.textContent = snippet.explanation;

    if (window.MTC && isCorrect) {
      window.MTC.addXP(5);
    }

    if (idx + 1 < order.length) {
      nextBtn.style.display = 'inline-flex';
    } else {
      finish();
    }
  }

  nextBtn.addEventListener('click', function () {
    idx++;
    renderSnippet();
  });

  function finish() {
    mainPanel.style.display = 'none';
    finalPanel.style.display = 'block';
    var accuracy = Math.round((correctCount / order.length) * 100);
    finalSummary.textContent = correctCount + ' / ' + order.length + ' correct (' + accuracy + '% accuracy).';
    var bonusXp = correctCount === order.length ? 15 : 0;
    if (window.MTC) {
      if (bonusXp) window.MTC.addXP(bonusXp);
      var stats = window.MTC.getStats();
      stats.debuggerCorrect = (stats.debuggerCorrect || 0) + correctCount;
      stats.debuggerTotal = (stats.debuggerTotal || 0) + order.length;
      window.MTC.saveStats(stats);
      window.MTC.recordActivity({
        type: 'debugger',
        label: 'Debugger Arena',
        detail: correctCount + '/' + order.length + ' correct',
        xp: correctCount * 5 + bonusXp
      });
    }
    finalXp.textContent = bonusXp ? 'Perfect round! +' + bonusXp + ' bonus XP' : 'Total XP earned this round: +' + (correctCount * 5);
  }

  restartBtn.addEventListener('click', function () {
    mainPanel.style.display = 'block';
    finalPanel.style.display = 'none';
    startRound();
  });

  function startRound() {
    order = shuffledIndices(SNIPPETS.length);
    idx = 0;
    correctCount = 0;
    correctEl.textContent = '0';
    accuracyEl.textContent = '—';
    renderSnippet();
  }

  startRound();
})();
