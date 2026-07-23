// pages/quizzes.js — Brain Quizzes game logic.
(function () {
  'use strict';

  var QUESTIONS = [
    { q: 'Which language uses indentation (whitespace) to define code blocks?', options: ['C', 'Java', 'Python', 'All of them'], correct: 2 },
    { q: 'What does "static typing" mean?', options: ['Variable types are checked at compile time', 'Variables can only be declared once', 'The program runs slower', 'Variables never change value'], correct: 0 },
    { q: 'In Java, what keyword is used to create a subclass?', options: ['implements', 'extends', 'inherits', 'super'], correct: 1 },
    { q: 'What is the time complexity of binary search on a sorted array of n elements?', options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], correct: 2 },
    { q: 'In C, what does malloc() do?', options: ['Frees memory', 'Allocates memory on the heap', 'Declares a static variable', 'Compiles the program'], correct: 1 },
    { q: 'Which of these is NOT a primitive type in Java?', options: ['int', 'boolean', 'String', 'double'], correct: 2 },
    { q: "What does Python's GIL stand for?", options: ['Global Interpreter Lock', 'General Import Library', 'Generic Iterator Loop', 'Global Instance List'], correct: 0 },
    { q: "In C, what's the difference between == and =?", options: ['No difference', '== compares, = assigns', '= compares, == assigns', 'Both assign values'], correct: 1 },
    { q: 'Which paradigm best describes Python, even though it also supports OOP?', options: ['Purely functional', 'Multi-paradigm (procedural, OOP, functional)', 'Purely object-oriented', 'Assembly-based'], correct: 1 },
    { q: "What happens if you don't call free() on malloc'd memory in C?", options: ['Automatic garbage collection cleans it', 'Memory leak', 'Program crashes immediately', 'Nothing, it is optional either way'], correct: 1 },
    { q: 'In Java, what is method overloading?', options: ['Same method name, different parameters', 'Overriding a parent method', 'Calling too many methods', 'Recursive methods'], correct: 0 },
    { q: 'Which of these correctly creates a list of 3 integers in Python?', options: ['int arr[3]', 'arr = [1, 2, 3]', 'array<int> arr(3)', 'let arr = [1,2,3]'], correct: 1 }
  ];

  var order = [];
  var idx = 0;
  var correctCount = 0;
  var answered = false;

  var qText = document.getElementById('questionText');
  var optionsList = document.getElementById('optionsList');
  var progressEl = document.getElementById('statProgress');
  var correctEl = document.getElementById('statCorrect');
  var accuracyEl = document.getElementById('statAccuracy');
  var nextBtn = document.getElementById('nextBtn');
  var finalPanel = document.getElementById('finalPanel');
  var finalSummary = document.getElementById('finalSummary');
  var finalXp = document.getElementById('finalXp');
  var restartBtn = document.getElementById('restartBtn');
  var mainPanel = qText.closest('.app-panel');

  function shuffledIndices(n) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i);
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function renderQuestion() {
    answered = false;
    var question = QUESTIONS[order[idx]];
    progressEl.textContent = (idx + 1) + ' / ' + order.length;
    qText.textContent = question.q;
    nextBtn.style.display = 'none';

    optionsList.innerHTML = '';
    question.options.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', function () { handlePick(i, btn); });
      optionsList.appendChild(btn);
    });
  }

  function handlePick(pickedIndex, btnEl) {
    if (answered) return;
    answered = true;
    var question = QUESTIONS[order[idx]];
    var buttons = optionsList.querySelectorAll('.quiz-option');
    var isCorrect = pickedIndex === question.correct;

    buttons.forEach(function (b) { b.disabled = true; });
    buttons[question.correct].classList.add('is-correct');
    if (!isCorrect) btnEl.classList.add('is-incorrect');

    if (isCorrect) correctCount++;
    correctEl.textContent = String(correctCount);
    accuracyEl.textContent = Math.round((correctCount / (idx + 1)) * 100) + '%';

    if (window.MTC && isCorrect) window.MTC.addXP(5);

    if (idx + 1 < order.length) {
      nextBtn.style.display = 'inline-flex';
    } else {
      setTimeout(finish, 500);
    }
  }

  nextBtn.addEventListener('click', function () {
    idx++;
    renderQuestion();
  });

  function finish() {
    mainPanel.style.display = 'none';
    finalPanel.style.display = 'block';
    var accuracy = Math.round((correctCount / order.length) * 100);
    finalSummary.textContent = correctCount + ' / ' + order.length + ' correct (' + accuracy + '% accuracy).';
    var bonusXp = correctCount === order.length ? 20 : 0;

    if (window.MTC) {
      if (bonusXp) window.MTC.addXP(bonusXp);
      var stats = window.MTC.getStats();
      stats.quizRuns = (stats.quizRuns || 0) + 1;
      stats.quizBest = Math.max(stats.quizBest || 0, accuracy);
      window.MTC.saveStats(stats);
      window.MTC.recordActivity({
        type: 'quiz',
        label: 'Brain Quiz',
        detail: correctCount + '/' + order.length + ' correct',
        xp: correctCount * 5 + bonusXp
      });
    }
    finalXp.textContent = bonusXp ? 'Perfect score! +' + bonusXp + ' bonus XP' : 'Total XP earned this round: +' + (correctCount * 5);
  }

  restartBtn.addEventListener('click', function () {
    mainPanel.style.display = 'block';
    finalPanel.style.display = 'none';
    startRound();
  });

  function startRound() {
    order = shuffledIndices(QUESTIONS.length);
    idx = 0;
    correctCount = 0;
    correctEl.textContent = '0';
    accuracyEl.textContent = '—';
    renderQuestion();
  }

  startRound();
})();
