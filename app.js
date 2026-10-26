/**
 * HSK 2 Cùng Bạn Dương - Main Application Logic
 * 150 từ vựng HSK 2 chuẩn với Flashcard, Trắc nghiệm ABCD, Nghe đoán từ, Nhìn nghĩa chọn chữ.
 */

// ==================== STATE MANAGEMENT ====================
const STORAGE_KEYS = {
  MASTERED: 'hsk2_duong_mastered',
  STARRED: 'hsk2_duong_starred',
  STREAK: 'hsk2_duong_streak',
  BEST_STREAK: 'hsk2_duong_best_streak',
};

const state = {
  words: typeof HSK2_DATA !== 'undefined' ? HSK2_DATA : [],
  masteredIds: new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTERED) || '[]')),
  starredIds: new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.STARRED) || '[]')),
  currentStreak: 0,
  bestStreak: parseInt(localStorage.getItem(STORAGE_KEYS.BEST_STREAK) || '0', 10),

  // Flashcard state
  fcFilter: 'all', // 'all' | 'unlearned' | 'mastered' | 'starred'
  fcList: [],
  fcIndex: 0,
  fcFlipped: false,
  fcAutoPlayTimer: null,

  // ABCD quiz state
  abcdMode: 'hanzi-to-meaning', // 'hanzi-to-meaning' | 'hanzi-to-pinyin' | 'pinyin-to-meaning'
  abcdCount: 150, // Default to full 150 words
  abcdRound: [],
  abcdIndex: 0,
  abcdScore: 0,
  abcdCorrect: 0,
  abcdWrong: 0,
  abcdStreak: 0,
  abcdMaxStreak: 0,
  abcdAnswered: false,

  // Listening quiz state
  listenAnsType: 'meaning', // 'meaning' | 'pinyin' | 'hanzi' | 'both'
  listenCount: 150, // Default to full 150 words
  listenSpeed: 0.9,
  listenRound: [],
  listenIndex: 0,
  listenScore: 0,
  listenCorrect: 0,
  listenWrong: 0,
  listenStreak: 0,
  listenMaxStreak: 0,
  listenAnswered: false,

  // Meaning-to-Hanzi match quiz state
  matchHint: 'none', // 'none' | 'pinyin'
  matchCount: 150, // Default to full 150 words
  matchRound: [],
  matchIndex: 0,
  matchScore: 0,
  matchCorrect: 0,
  matchWrong: 0,
  matchStreak: 0,
  matchMaxStreak: 0,
  matchAnswered: false,

  // Vocab list filter
  vocabFilter: 'all',
  vocabSearch: '',
};

function saveStorage() {
  localStorage.setItem(STORAGE_KEYS.MASTERED, JSON.stringify(Array.from(state.masteredIds)));
  localStorage.setItem(STORAGE_KEYS.STARRED, JSON.stringify(Array.from(state.starredIds)));
  if (state.currentStreak > state.bestStreak) {
    state.bestStreak = state.currentStreak;
    localStorage.setItem(STORAGE_KEYS.BEST_STREAK, state.bestStreak.toString());
  }
  updateHeaderBadges();
}

function updateHeaderBadges() {
  const masteredEl = document.getElementById('stat-mastered');
  const starredEl = document.getElementById('stat-starred');
  const streakEl = document.getElementById('stat-streak');

  if (masteredEl) masteredEl.textContent = state.masteredIds.size;
  if (starredEl) starredEl.textContent = state.starredIds.size;
  if (streakEl) streakEl.textContent = state.currentStreak;

  // Update counts in vocab list filter chips if present
  const unlearnedCount = state.words.length - state.masteredIds.size;
  const countUnlearned = document.getElementById('vfilter-unlearned-count');
  const countMastered = document.getElementById('vfilter-mastered-count');
  const countStarred = document.getElementById('vfilter-starred-count');
  if (countUnlearned) countUnlearned.textContent = unlearnedCount;
  if (countMastered) countMastered.textContent = state.masteredIds.size;
  if (countStarred) countStarred.textContent = state.starredIds.size;
}

// ==================== AUDIO & SOUND SYNTHESIS ====================
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSfx(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'correct') {
      // Pleasant double bell chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc2.frequency.setValueAtTime(1046.5, now + 0.1); // C6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (type === 'wrong') {
      // Low tone error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'fanfare') {
      // Victory chime arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    }
  } catch (e) {
    // Audio context not allowed before gesture or not supported
  }
}

// Text-to-Speech for Chinese (Mandarin)
function speakChinese(text, rate = 0.9) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }
  window.speechSynthesis.cancel(); // Stop any pending speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
  if (zhVoice) {
    utterance.voice = zhVoice;
  }
  window.speechSynthesis.speak(utterance);
}

// Pre-load voices
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Trigger voice population
    window.speechSynthesis.getVoices();
  };
}

// ==================== LIGHTWEIGHT CONFETTI ENGINE ====================
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4 + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 5,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      alpha: 1,
    });
  }

  let animationFrame;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.rotation += p.vRot;
      p.alpha -= 0.009;

      if (p.alpha > 0 && p.y < canvas.height) {
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive > 0) {
      animationFrame = requestAnimationFrame(update);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  update();
}

// ==================== TAB NAVIGATION ====================
function initNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `panel-${tab.dataset.tab}`;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      // Initialize or refresh view
      if (tab.dataset.tab === 'flashcard') {
        renderCurrentFlashcard();
      } else if (tab.dataset.tab === 'abcd') {
        if (state.abcdRound.length === 0) startAbcdRound();
      } else if (tab.dataset.tab === 'listening') {
        if (state.listenRound.length === 0) startListenRound();
      } else if (tab.dataset.tab === 'meaning-match') {
        if (state.matchRound.length === 0) startMatchRound();
      } else if (tab.dataset.tab === 'vocab-list') {
        renderVocabList();
      }
    });
  });
}

// ==================== 1. FLASHCARD LOGIC ====================
function getFilteredFlashcards() {
  if (state.fcFilter === 'mastered') {
    return state.words.filter(w => state.masteredIds.has(w.id));
  } else if (state.fcFilter === 'unlearned') {
    return state.words.filter(w => !state.masteredIds.has(w.id));
  } else if (state.fcFilter === 'starred') {
    return state.words.filter(w => state.starredIds.has(w.id));
  }
  return [...state.words];
}

function initFlashcard() {
  state.fcList = getFilteredFlashcards();
  state.fcIndex = 0;
  state.fcFlipped = false;

  const card = document.getElementById('main-flashcard');
  const flipBtn = document.getElementById('fc-flip-btn');
  const nextBtn = document.getElementById('fc-next-btn');
  const prevBtn = document.getElementById('fc-prev-btn');
  const shuffleBtn = document.getElementById('fc-shuffle-btn');
  const autoPlayBtn = document.getElementById('fc-autoplay-btn');

  const starBtn = document.getElementById('fc-star-btn');
  const checkBtn = document.getElementById('fc-check-btn');
  const speakFront = document.getElementById('fc-speak-front-btn');
  const speakBack = document.getElementById('fc-speak-back-btn');

  function flip() {
    state.fcFlipped = !state.fcFlipped;
    card.classList.toggle('flipped', state.fcFlipped);
  }

  card.addEventListener('click', (e) => {
    // Ignore click on action buttons
    if (e.target.closest('.icon-btn') || e.target.closest('.card-actions-top')) return;
    flip();
  });
  flipBtn.addEventListener('click', flip);

  nextBtn.addEventListener('click', () => {
    if (state.fcList.length === 0) return;
    state.fcIndex = (state.fcIndex + 1) % state.fcList.length;
    state.fcFlipped = false;
    card.classList.remove('flipped');
    renderCurrentFlashcard();
  });

  prevBtn.addEventListener('click', () => {
    if (state.fcList.length === 0) return;
    state.fcIndex = (state.fcIndex - 1 + state.fcList.length) % state.fcList.length;
    state.fcFlipped = false;
    card.classList.remove('flipped');
    renderCurrentFlashcard();
  });

  shuffleBtn.addEventListener('click', () => {
    for (let i = state.fcList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.fcList[i], state.fcList[j]] = [state.fcList[j], state.fcList[i]];
    }
    state.fcIndex = 0;
    state.fcFlipped = false;
    card.classList.remove('flipped');
    renderCurrentFlashcard();
  });

  // Autoplay
  autoPlayBtn.addEventListener('click', () => {
    if (state.fcAutoPlayTimer) {
      clearInterval(state.fcAutoPlayTimer);
      state.fcAutoPlayTimer = null;
      autoPlayBtn.innerHTML = '<span>▶️ Tự động</span>';
      autoPlayBtn.classList.remove('btn-accent');
      autoPlayBtn.classList.add('btn-secondary');
    } else {
      autoPlayBtn.innerHTML = '<span>⏹️ Dừng</span>';
      autoPlayBtn.classList.add('btn-accent');
      autoPlayBtn.classList.remove('btn-secondary');

      state.fcAutoPlayTimer = setInterval(() => {
        if (!state.fcFlipped) {
          flip();
        } else {
          nextBtn.click();
        }
      }, 3500);
    }
  });

  // Action buttons
  speakFront.addEventListener('click', (e) => {
    e.stopPropagation();
    const curr = state.fcList[state.fcIndex];
    if (curr) speakChinese(curr.hanzi);
  });

  speakBack.addEventListener('click', (e) => {
    e.stopPropagation();
    const curr = state.fcList[state.fcIndex];
    if (curr) speakChinese(curr.hanzi);
  });

  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const curr = state.fcList[state.fcIndex];
    if (!curr) return;
    if (state.starredIds.has(curr.id)) {
      state.starredIds.delete(curr.id);
      starBtn.classList.remove('starred');
    } else {
      state.starredIds.add(curr.id);
      starBtn.classList.add('starred');
    }
    saveStorage();
  });

  checkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const curr = state.fcList[state.fcIndex];
    if (!curr) return;
    if (state.masteredIds.has(curr.id)) {
      state.masteredIds.delete(curr.id);
      checkBtn.classList.remove('mastered');
    } else {
      state.masteredIds.add(curr.id);
      checkBtn.classList.add('mastered');
      playSfx('correct');
    }
    saveStorage();
  });

  // Filter pills
  const filterPills = document.querySelectorAll('#flashcard-filter-pills .toggle-pill-btn');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.fcFilter = pill.dataset.filter;
      state.fcList = getFilteredFlashcards();
      state.fcIndex = 0;
      state.fcFlipped = false;
      card.classList.remove('flipped');
      renderCurrentFlashcard();
    });
  });

  renderCurrentFlashcard();
}

function renderCurrentFlashcard() {
  const fcTotal = state.fcList.length;
  const fcCurrent = fcTotal === 0 ? 0 : state.fcIndex + 1;
  const fcPct = fcTotal === 0 ? '0.0' : ((fcCurrent / fcTotal) * 100).toFixed(1);

  const progressText = document.getElementById('fc-progress-text');
  const progressPct = document.getElementById('fc-progress-pct');
  const progressBar = document.getElementById('fc-progress-bar');
  if (progressText) progressText.textContent = `${fcCurrent} / ${fcTotal}`;
  if (progressPct) progressPct.textContent = `${fcPct}%`;
  if (progressBar) progressBar.style.width = `${fcPct}%`;

  if (state.fcList.length === 0) {
    document.getElementById('fc-hanzi').textContent = '—';
    document.getElementById('fc-front-pinyin').textContent = 'Danh sách rỗng';
    document.getElementById('fc-id-badge').textContent = '0 / 0';
    document.getElementById('fc-back-hanzi').textContent = '—';
    document.getElementById('fc-back-pinyin').textContent = '';
    document.getElementById('fc-meaning').textContent = 'Không có từ nào trong bộ lọc này';
    document.getElementById('fc-ex-hanzi').textContent = '';
    document.getElementById('fc-ex-pinyin').textContent = '';
    document.getElementById('fc-ex-meaning').textContent = '';
    return;
  }

  const word = state.fcList[state.fcIndex];
  document.getElementById('fc-id-badge').textContent = `#${word.id} (${state.fcIndex + 1}/${state.fcList.length})`;
  document.getElementById('fc-hanzi').textContent = word.hanzi;
  document.getElementById('fc-front-pinyin').textContent = word.pinyin;

  document.getElementById('fc-back-hanzi').textContent = word.hanzi;
  document.getElementById('fc-back-pinyin').textContent = word.pinyin;
  document.getElementById('fc-meaning').textContent = word.meaning;

  if (word.example) {
    document.getElementById('fc-ex-hanzi').textContent = word.example.hanzi || '';
    document.getElementById('fc-ex-pinyin').textContent = word.example.pinyin || '';
    document.getElementById('fc-ex-meaning').textContent = word.example.meaning || '';
  }

  // Update button active state
  const starBtn = document.getElementById('fc-star-btn');
  const checkBtn = document.getElementById('fc-check-btn');
  starBtn.classList.toggle('starred', state.starredIds.has(word.id));
  checkBtn.classList.toggle('mastered', state.masteredIds.has(word.id));
}

// ==================== 2. TRẮC NGHIỆM ABCD LOGIC ====================
function generateRandomChoices(correctWord, mode) {
  // mode: 'hanzi-to-meaning' | 'hanzi-to-pinyin' | 'pinyin-to-meaning'
  const pool = state.words.filter(w => w.id !== correctWord.id);
  const distractors = [];
  while (distractors.length < 3 && pool.length > 0) {
    const randIdx = Math.floor(Math.random() * pool.length);
    distractors.push(pool.splice(randIdx, 1)[0]);
  }

  const choices = [
    { word: correctWord, isCorrect: true },
    ...distractors.map(w => ({ word: w, isCorrect: false })),
  ];

  // Shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
}

function startAbcdRound() {
  const shuffled = [...state.words].sort(() => Math.random() - 0.5);
  const targetCount = state.abcdCount >= state.words.length ? state.words.length : state.abcdCount;
  state.abcdRound = shuffled.slice(0, targetCount);
  state.abcdIndex = 0;
  state.abcdScore = 0;
  state.abcdCorrect = 0;
  state.abcdWrong = 0;
  state.abcdStreak = 0;
  state.abcdMaxStreak = 0;
  renderAbcdQuestion();
}

function renderAbcdQuestion() {
  state.abcdAnswered = false;
  const curr = state.abcdRound[state.abcdIndex];
  const total = state.abcdRound.length;
  const answeredCount = state.abcdCorrect + state.abcdWrong;
  const pct = total === 0 ? '0.0' : ((answeredCount / total) * 100).toFixed(1);

  document.getElementById('abcd-question-num').textContent = `Câu ${state.abcdIndex + 1} / ${total}`;
  document.getElementById('abcd-progress').style.width = `${pct}%`;
  document.getElementById('abcd-progress-pct').textContent = `${pct}%`;
  document.getElementById('abcd-stat-correct').textContent = state.abcdCorrect;
  document.getElementById('abcd-stat-wrong').textContent = state.abcdWrong;
  document.getElementById('abcd-stat-remaining').textContent = total - answeredCount;
  document.getElementById('abcd-score-display').textContent = `Điểm: ${state.abcdScore}`;
  document.getElementById('abcd-streak-display').textContent = `🔥 Chuỗi: ${state.abcdStreak}`;

  const promptEl = document.getElementById('abcd-prompt-text');
  const hanziEl = document.getElementById('abcd-q-hanzi');
  const pinyinEl = document.getElementById('abcd-q-pinyin');
  const speakBtn = document.getElementById('abcd-q-speak');

  speakBtn.onclick = () => speakChinese(curr.hanzi);

  if (state.abcdMode === 'hanzi-to-meaning') {
    promptEl.textContent = 'Hãy chọn NGHĨA TIẾNG VIỆT chính xác:';
    hanziEl.textContent = curr.hanzi;
    pinyinEl.textContent = curr.pinyin;
    hanziEl.style.display = 'block';
    pinyinEl.style.display = 'block';
  } else if (state.abcdMode === 'hanzi-to-pinyin') {
    promptEl.textContent = 'Hãy chọn PHIÊN ÂM PINYIN chính xác:';
    hanziEl.textContent = curr.hanzi;
    pinyinEl.textContent = '';
    hanziEl.style.display = 'block';
    pinyinEl.style.display = 'none';
  } else if (state.abcdMode === 'pinyin-to-meaning') {
    promptEl.textContent = 'Cho phiên âm Pinyin, chọn NGHĨA TIẾNG VIỆT:';
    hanziEl.textContent = curr.pinyin;
    pinyinEl.textContent = '';
    hanziEl.style.display = 'block';
    pinyinEl.style.display = 'none';
  }

  // Hide feedback
  const feedbackEl = document.getElementById('abcd-feedback');
  feedbackEl.className = 'feedback-box';

  // Render 4 choices
  const choices = generateRandomChoices(curr, state.abcdMode);
  const choicesGrid = document.getElementById('abcd-choices');
  choicesGrid.innerHTML = '';

  const keyLabels = ['A', 'B', 'C', 'D'];
  choices.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.correct = c.isCorrect;

    let displayTxt = '';
    if (state.abcdMode === 'hanzi-to-meaning' || state.abcdMode === 'pinyin-to-meaning') {
      displayTxt = c.word.meaning;
    } else if (state.abcdMode === 'hanzi-to-pinyin') {
      displayTxt = c.word.pinyin;
    }

    btn.innerHTML = `
      <span class="choice-key">${keyLabels[idx]}</span>
      <div class="choice-content">${displayTxt}</div>
    `;

    btn.addEventListener('click', () => handleAbcdAnswer(btn, c.isCorrect, curr));
    choicesGrid.appendChild(btn);
  });
}

function handleAbcdAnswer(clickedBtn, isCorrect, correctWord) {
  if (state.abcdAnswered) return;
  state.abcdAnswered = true;

  const choicesGrid = document.getElementById('abcd-choices');
  const allBtns = choicesGrid.querySelectorAll('.choice-btn');
  allBtns.forEach(btn => btn.disabled = true);

  const feedbackEl = document.getElementById('abcd-feedback');
  const fbTitle = document.getElementById('abcd-fb-title');
  const fbDetail = document.getElementById('abcd-fb-detail');

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    playSfx('correct');
    state.abcdCorrect++;
    state.abcdScore += 10 + state.abcdStreak * 2;
    state.abcdStreak++;
    state.currentStreak++;
    if (state.abcdStreak > state.abcdMaxStreak) state.abcdMaxStreak = state.abcdStreak;
    if (state.abcdStreak % 5 === 0) triggerConfetti();

    feedbackEl.className = 'feedback-box show correct';
    fbTitle.textContent = '🎉 Chính xác! Tuyệt vời lắm Dương ơi!';
    fbDetail.innerHTML = `<strong>${correctWord.hanzi}</strong> (${correctWord.pinyin}): ${correctWord.meaning}`;
  } else {
    clickedBtn.classList.add('wrong');
    playSfx('wrong');
    state.abcdWrong++;
    state.abcdStreak = 0;
    state.currentStreak = 0;

    // Highlight the correct one
    allBtns.forEach(btn => {
      if (btn.dataset.correct === 'true') btn.classList.add('correct');
    });

    feedbackEl.className = 'feedback-box show wrong';
    fbTitle.textContent = '❌ Chưa chính xác rồi!';
    fbDetail.innerHTML = `
      Đáp án đúng là: <strong>${correctWord.hanzi}</strong> [${correctWord.pinyin}] ➔ ${correctWord.meaning}
      <div style="margin-top: 4px; font-style: italic;">Ví dụ: ${correctWord.example.hanzi} (${correctWord.example.meaning})</div>
    `;
  }

  saveStorage();
  const total = state.abcdRound.length;
  const answeredCount = state.abcdCorrect + state.abcdWrong;
  const pct = total === 0 ? '0.0' : ((answeredCount / total) * 100).toFixed(1);
  document.getElementById('abcd-progress').style.width = `${pct}%`;
  document.getElementById('abcd-progress-pct').textContent = `${pct}%`;
  document.getElementById('abcd-stat-correct').textContent = state.abcdCorrect;
  document.getElementById('abcd-stat-wrong').textContent = state.abcdWrong;
  document.getElementById('abcd-stat-remaining').textContent = total - answeredCount;
  document.getElementById('abcd-streak-display').textContent = `🔥 Chuỗi: ${state.abcdStreak}`;
  document.getElementById('abcd-score-display').textContent = `Điểm: ${state.abcdScore}`;
}

function initAbcdQuiz() {
  const modePills = document.querySelectorAll('#abcd-mode-pills .toggle-pill-btn');
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.abcdMode = pill.dataset.qmode;
      startAbcdRound();
    });
  });

  const countPills = document.querySelectorAll('#abcd-count-pills .toggle-pill-btn');
  countPills.forEach(pill => {
    pill.addEventListener('click', () => {
      countPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.abcdCount = parseInt(pill.dataset.count, 10);
      startAbcdRound();
    });
  });

  document.getElementById('abcd-restart-btn').addEventListener('click', startAbcdRound);

  document.getElementById('abcd-next-q-btn').addEventListener('click', () => {
    state.abcdIndex++;
    if (state.abcdIndex < state.abcdRound.length) {
      renderAbcdQuestion();
    } else {
      // Finished round
      showQuizResultModal({
        correct: state.abcdCorrect,
        total: state.abcdRound.length,
        maxStreak: state.abcdMaxStreak,
        onReplay: startAbcdRound,
      });
    }
  });
}

// ==================== 3. NGHE ĐOÁN TỪ LOGIC ====================
function startListenRound() {
  const shuffled = [...state.words].sort(() => Math.random() - 0.5);
  const targetCount = state.listenCount >= state.words.length ? state.words.length : state.listenCount;
  state.listenRound = shuffled.slice(0, targetCount);
  state.listenIndex = 0;
  state.listenScore = 0;
  state.listenCorrect = 0;
  state.listenWrong = 0;
  state.listenStreak = 0;
  state.listenMaxStreak = 0;
  renderListenQuestion();
}

function renderListenQuestion() {
  state.listenAnswered = false;
  const curr = state.listenRound[state.listenIndex];
  const total = state.listenRound.length;
  const answeredCount = state.listenCorrect + state.listenWrong;
  const pct = total === 0 ? '0.0' : ((answeredCount / total) * 100).toFixed(1);

  document.getElementById('listen-question-num').textContent = `Câu ${state.listenIndex + 1} / ${total}`;
  document.getElementById('listen-progress').style.width = `${pct}%`;
  document.getElementById('listen-progress-pct').textContent = `${pct}%`;
  document.getElementById('listen-stat-correct').textContent = state.listenCorrect;
  document.getElementById('listen-stat-wrong').textContent = state.listenWrong;
  document.getElementById('listen-stat-remaining').textContent = total - answeredCount;
  document.getElementById('listen-score-display').textContent = `Điểm: ${state.listenScore}`;
  document.getElementById('listen-streak-display').textContent = `🔥 Chuỗi: ${state.listenStreak}`;

  // Reset feedback
  const feedbackEl = document.getElementById('listen-feedback');
  feedbackEl.className = 'feedback-box';

  // Automatically pronounce the word
  speakChinese(curr.hanzi, state.listenSpeed);

  const playBtn = document.getElementById('listen-play-btn');
  playBtn.onclick = () => speakChinese(curr.hanzi, state.listenSpeed);

  // Generate 4 choices based on state.listenAnsType (meaning, pinyin, hanzi, both)
  const choices = generateRandomChoices(curr);
  const choicesGrid = document.getElementById('listen-choices');
  choicesGrid.innerHTML = '';

  const keyLabels = ['A', 'B', 'C', 'D'];
  choices.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.correct = c.isCorrect;

    let contentHtml = '';
    if (state.listenAnsType === 'meaning') {
      contentHtml = `<div class="choice-content">${c.word.meaning}</div>`;
    } else if (state.listenAnsType === 'pinyin') {
      contentHtml = `<div class="choice-content" style="font-size: 1.2rem; color: var(--primary);">${c.word.pinyin}</div>`;
    } else if (state.listenAnsType === 'hanzi') {
      contentHtml = `<div class="choice-content"><span class="hanzi-text">${c.word.hanzi}</span></div>`;
    } else if (state.listenAnsType === 'both') {
      contentHtml = `
        <div class="choice-content">
          <div style="color: var(--primary); font-weight: 700;">${c.word.pinyin}</div>
          <div style="font-size: 0.95rem; color: var(--text-muted);">${c.word.meaning}</div>
        </div>
      `;
    }

    btn.innerHTML = `
      <span class="choice-key">${keyLabels[idx]}</span>
      ${contentHtml}
    `;

    btn.addEventListener('click', () => handleListenAnswer(btn, c.isCorrect, curr));
    choicesGrid.appendChild(btn);
  });
}

function handleListenAnswer(clickedBtn, isCorrect, correctWord) {
  if (state.listenAnswered) return;
  state.listenAnswered = true;

  const choicesGrid = document.getElementById('listen-choices');
  const allBtns = choicesGrid.querySelectorAll('.choice-btn');
  allBtns.forEach(btn => btn.disabled = true);

  const feedbackEl = document.getElementById('listen-feedback');
  const fbTitle = document.getElementById('listen-fb-title');
  const fbDetail = document.getElementById('listen-fb-detail');

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    playSfx('correct');
    state.listenCorrect++;
    state.listenScore += 10 + state.listenStreak * 2;
    state.listenStreak++;
    state.currentStreak++;
    if (state.listenStreak > state.listenMaxStreak) state.listenMaxStreak = state.listenStreak;
    if (state.listenStreak % 5 === 0) triggerConfetti();

    feedbackEl.className = 'feedback-box show correct';
    fbTitle.textContent = '🎉 Giỏi quá! Đôi tai vàng của Dương!';
    fbDetail.innerHTML = `Từ vừa nghe là: <strong>${correctWord.hanzi}</strong> [${correctWord.pinyin}] ➔ ${correctWord.meaning}`;
  } else {
    clickedBtn.classList.add('wrong');
    playSfx('wrong');
    state.listenWrong++;
    state.listenStreak = 0;
    state.currentStreak = 0;

    allBtns.forEach(btn => {
      if (btn.dataset.correct === 'true') btn.classList.add('correct');
    });

    feedbackEl.className = 'feedback-box show wrong';
    fbTitle.textContent = '❌ Chưa đúng rồi!';
    fbDetail.innerHTML = `Từ vừa nghe là: <strong>${correctWord.hanzi}</strong> [${correctWord.pinyin}] ➔ ${correctWord.meaning}`;
  }

  saveStorage();
  const total = state.listenRound.length;
  const answeredCount = state.listenCorrect + state.listenWrong;
  const pct = total === 0 ? '0.0' : ((answeredCount / total) * 100).toFixed(1);
  document.getElementById('listen-progress').style.width = `${pct}%`;
  document.getElementById('listen-progress-pct').textContent = `${pct}%`;
  document.getElementById('listen-stat-correct').textContent = state.listenCorrect;
  document.getElementById('listen-stat-wrong').textContent = state.listenWrong;
  document.getElementById('listen-stat-remaining').textContent = total - answeredCount;
  document.getElementById('listen-streak-display').textContent = `🔥 Chuỗi: ${state.listenStreak}`;
  document.getElementById('listen-score-display').textContent = `Điểm: ${state.listenScore}`;
}

function initListeningQuiz() {
  const ansPills = document.querySelectorAll('#listen-ans-type-pills .toggle-pill-btn');
  ansPills.forEach(pill => {
    pill.addEventListener('click', () => {
      ansPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.listenAnsType = pill.dataset.anstype;
      renderListenQuestion();
    });
  });

  const countPills = document.querySelectorAll('#listen-count-pills .toggle-pill-btn');
  countPills.forEach(pill => {
    pill.addEventListener('click', () => {
      countPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.listenCount = parseInt(pill.dataset.count, 10);
      startListenRound();
    });
  });

  const normalBtn = document.getElementById('listen-normal-btn');
  const slowBtn = document.getElementById('listen-slow-btn');
  normalBtn.addEventListener('click', () => {
    state.listenSpeed = 0.9;
    normalBtn.style.borderColor = 'var(--primary)';
    normalBtn.style.color = 'var(--primary)';
    slowBtn.style.borderColor = '#cbd5e1';
    slowBtn.style.color = 'var(--text-muted)';
    const curr = state.listenRound[state.listenIndex];
    if (curr) speakChinese(curr.hanzi, 0.9);
  });
  slowBtn.addEventListener('click', () => {
    state.listenSpeed = 0.6;
    slowBtn.style.borderColor = 'var(--primary)';
    slowBtn.style.color = 'var(--primary)';
    normalBtn.style.borderColor = '#cbd5e1';
    normalBtn.style.color = 'var(--text-muted)';
    const curr = state.listenRound[state.listenIndex];
    if (curr) speakChinese(curr.hanzi, 0.6);
  });

  document.getElementById('listen-restart-btn').addEventListener('click', startListenRound);

  document.getElementById('listen-next-q-btn').addEventListener('click', () => {
    state.listenIndex++;
    if (state.listenIndex < state.listenRound.length) {
      renderListenQuestion();
    } else {
      showQuizResultModal({
        correct: state.listenCorrect,
        total: state.listenRound.length,
        maxStreak: state.listenMaxStreak,
        onReplay: startListenRound,
      });
    }
  });
}

// ==================== 4. NHÌN NGHĨA CHỌN CHỮ LOGIC ====================
function startMatchRound() {
  const shuffled = [...state.words].sort(() => Math.random() - 0.5);
  const targetCount = state.matchCount >= state.words.length ? state.words.length : state.matchCount;
  state.matchRound = shuffled.slice(0, targetCount);
  state.matchIndex = 0;
  state.matchScore = 0;
  state.matchCorrect = 0;
  state.matchWrong = 0;
  state.matchStreak = 0;
  state.matchMaxStreak = 0;
  renderMatchQuestion();
}

function renderMatchQuestion() {
  state.matchAnswered = false;
  const curr = state.matchRound[state.matchIndex];
  const total = state.matchRound.length;
  const answeredCount = state.matchCorrect + state.matchWrong;
  const pct = total === 0 ? '0.0' : ((answeredCount / total) * 100).toFixed(1);

  document.getElementById('match-question-num').textContent = `Câu ${state.matchIndex + 1} / ${total}`;
  document.getElementById('match-progress').style.width = `${pct}%`;
  document.getElementById('match-progress-pct').textContent = `${pct}%`;
  document.getElementById('match-stat-correct').textContent = state.matchCorrect;
  document.getElementById('match-stat-wrong').textContent = state.matchWrong;
  document.getElementById('match-stat-remaining').textContent = total - answeredCount;
  document.getElementById('match-score-display').textContent = `Điểm: ${state.matchScore}`;
  document.getElementById('match-streak-display').textContent = `🔥 Chuỗi: ${state.matchStreak}`;

  document.getElementById('match-q-meaning').textContent = curr.meaning;

  const feedbackEl = document.getElementById('match-feedback');
  feedbackEl.className = 'feedback-box';

  const choices = generateRandomChoices(curr);
  const choicesGrid = document.getElementById('match-choices');
  choicesGrid.innerHTML = '';

  const keyLabels = ['A', 'B', 'C', 'D'];
  choices.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.correct = c.isCorrect;

    const pinyinHtml = state.matchHint === 'pinyin' ? `<div class="pinyin-sub">${c.word.pinyin}</div>` : '';

    btn.innerHTML = `
      <span class="choice-key">${keyLabels[idx]}</span>
      <div class="choice-content">
        <span class="hanzi-text">${c.word.hanzi}</span>
        ${pinyinHtml}
      </div>
    `;

    btn.addEventListener('click', () => handleMatchAnswer(btn, c.isCorrect, curr));
    choicesGrid.appendChild(btn);
  });
}

function handleMatchAnswer(clickedBtn, isCorrect, correctWord) {
  if (state.matchAnswered) return;
  state.matchAnswered = true;

  const choicesGrid = document.getElementById('match-choices');
  const allBtns = choicesGrid.querySelectorAll('.choice-btn');
  allBtns.forEach(btn => btn.disabled = true);

  const feedbackEl = document.getElementById('match-feedback');
  const fbTitle = document.getElementById('match-fb-title');
  const fbDetail = document.getElementById('match-fb-detail');

  speakChinese(correctWord.hanzi);

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    playSfx('correct');
    state.matchCorrect++;
    state.matchScore += 10 + state.matchStreak * 2;
    state.matchStreak++;
    state.currentStreak++;
    if (state.matchStreak > state.matchMaxStreak) state.matchMaxStreak = state.matchStreak;
    if (state.matchStreak % 5 === 0) triggerConfetti();

    feedbackEl.className = 'feedback-box show correct';
    fbTitle.textContent = '🎉 Đúng rồi, xuất sắc lắm!';
    fbDetail.innerHTML = `<strong>${correctWord.hanzi}</strong> [${correctWord.pinyin}] ➔ ${correctWord.meaning}`;
  } else {
    clickedBtn.classList.add('wrong');
    playSfx('wrong');
    state.matchWrong++;
    state.matchStreak = 0;
    state.currentStreak = 0;

    allBtns.forEach(btn => {
      if (btn.dataset.correct === 'true') btn.classList.add('correct');
    });

    feedbackEl.className = 'feedback-box show wrong';
    fbTitle.textContent = '❌ Chưa chính xác rồi!';
    fbDetail.innerHTML = `Từ đúng là: <strong>${correctWord.hanzi}</strong> [${correctWord.pinyin}] ➔ ${correctWord.meaning}`;
  }

  saveStorage();
  const total = state.matchRound.length;
  const answeredCount = state.matchCorrect + state.matchWrong;
  const pct = total === 0 ? '0.0' : ((answeredCount / total) * 100).toFixed(1);
  document.getElementById('match-progress').style.width = `${pct}%`;
  document.getElementById('match-progress-pct').textContent = `${pct}%`;
  document.getElementById('match-stat-correct').textContent = state.matchCorrect;
  document.getElementById('match-stat-wrong').textContent = state.matchWrong;
  document.getElementById('match-stat-remaining').textContent = total - answeredCount;
  document.getElementById('match-streak-display').textContent = `🔥 Chuỗi: ${state.matchStreak}`;
  document.getElementById('match-score-display').textContent = `Điểm: ${state.matchScore}`;
}

function initMeaningMatchQuiz() {
  const hintPills = document.querySelectorAll('#match-hint-pills .toggle-pill-btn');
  hintPills.forEach(pill => {
    pill.addEventListener('click', () => {
      hintPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.matchHint = pill.dataset.hint;
      renderMatchQuestion();
    });
  });

  const countPills = document.querySelectorAll('#match-count-pills .toggle-pill-btn');
  countPills.forEach(pill => {
    pill.addEventListener('click', () => {
      countPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.matchCount = parseInt(pill.dataset.count, 10);
      startMatchRound();
    });
  });

  document.getElementById('match-restart-btn').addEventListener('click', startMatchRound);

  document.getElementById('match-next-q-btn').addEventListener('click', () => {
    state.matchIndex++;
    if (state.matchIndex < state.matchRound.length) {
      renderMatchQuestion();
    } else {
      showQuizResultModal({
        correct: state.matchCorrect,
        total: state.matchRound.length,
        maxStreak: state.matchMaxStreak,
        onReplay: startMatchRound,
      });
    }
  });
}

// ==================== 5. DANH SÁCH 150 TỪ VỰNG ====================
function initVocabList() {
  const searchInput = document.getElementById('vocab-search-input');
  searchInput.addEventListener('input', (e) => {
    state.vocabSearch = e.target.value.trim().toLowerCase();
    renderVocabList();
  });

  const chips = document.querySelectorAll('.chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.vocabFilter = chip.dataset.vfilter;
      renderVocabList();
    });
  });

  renderVocabList();
}

function renderVocabList() {
  const container = document.getElementById('vocab-grid-container');
  if (!container) return;

  let list = state.words;

  // Filter
  if (state.vocabFilter === 'mastered') {
    list = list.filter(w => state.masteredIds.has(w.id));
  } else if (state.vocabFilter === 'unlearned') {
    list = list.filter(w => !state.masteredIds.has(w.id));
  } else if (state.vocabFilter === 'starred') {
    list = list.filter(w => state.starredIds.has(w.id));
  }

  // Search
  if (state.vocabSearch) {
    const q = state.vocabSearch;
    list = list.filter(w => 
      w.hanzi.toLowerCase().includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
    );
  }

  updateHeaderBadges();

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
        <p style="font-weight: 600;">Không tìm thấy từ vựng nào phù hợp</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  list.forEach(word => {
    const card = document.createElement('div');
    card.className = 'vocab-card';

    const isMastered = state.masteredIds.has(word.id);
    const isStarred = state.starredIds.has(word.id);

    card.innerHTML = `
      <div>
        <div class="vocab-card-header">
          <div>
            <div class="vocab-hanzi">${word.hanzi}</div>
            <div class="vocab-pinyin">${word.pinyin}</div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="icon-btn btn-speak" title="Nghe phát âm">🔊</button>
            <button class="icon-btn btn-star ${isStarred ? 'starred' : ''}" title="Lưu từ">⭐</button>
            <button class="icon-btn btn-check ${isMastered ? 'mastered' : ''}" title="Đã thuộc">✅</button>
          </div>
        </div>
        <div class="vocab-meaning">${word.meaning}</div>
      </div>
      <div class="vocab-card-footer">
        <span>#${word.id}</span>
        <button class="btn-detail" style="background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; font-size: 0.85rem;">
          Ví dụ & Chi tiết ➔
        </button>
      </div>
    `;

    // Event listeners
    card.querySelector('.btn-speak').addEventListener('click', (e) => {
      e.stopPropagation();
      speakChinese(word.hanzi);
    });

    const starBtn = card.querySelector('.btn-star');
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.starredIds.has(word.id)) {
        state.starredIds.delete(word.id);
        starBtn.classList.remove('starred');
      } else {
        state.starredIds.add(word.id);
        starBtn.classList.add('starred');
      }
      saveStorage();
    });

    const checkBtn = card.querySelector('.btn-check');
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.masteredIds.has(word.id)) {
        state.masteredIds.delete(word.id);
        checkBtn.classList.remove('mastered');
      } else {
        state.masteredIds.add(word.id);
        checkBtn.classList.add('mastered');
        playSfx('correct');
      }
      saveStorage();
    });

    card.querySelector('.btn-detail').addEventListener('click', () => openWordModal(word));
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) openWordModal(word);
    });

    container.appendChild(card);
  });
}

// ==================== WORD DETAIL MODAL ====================
let currentModalWord = null;

function openWordModal(word) {
  currentModalWord = word;
  const modal = document.getElementById('word-detail-modal');

  document.getElementById('modal-word-stt').textContent = `STT: #${word.id}`;
  document.getElementById('modal-hanzi').textContent = word.hanzi;
  document.getElementById('modal-pinyin').textContent = word.pinyin;
  document.getElementById('modal-meaning').textContent = word.meaning;

  if (word.example) {
    document.getElementById('modal-ex-hanzi').textContent = word.example.hanzi || '';
    document.getElementById('modal-ex-pinyin').textContent = word.example.pinyin || '';
    document.getElementById('modal-ex-meaning').textContent = word.example.meaning || '';
  }

  // Update toggle buttons
  updateModalToggleButtons(word);

  modal.classList.add('open');
}

function updateModalToggleButtons(word) {
  const starBtn = document.getElementById('modal-star-toggle');
  const masterBtn = document.getElementById('modal-master-toggle');

  if (state.starredIds.has(word.id)) {
    starBtn.innerHTML = '<span>⭐ Bỏ đánh dấu sao</span>';
    starBtn.classList.add('starred');
  } else {
    starBtn.innerHTML = '<span>⭐ Đánh dấu cần ôn</span>';
    starBtn.classList.remove('starred');
  }

  if (state.masteredIds.has(word.id)) {
    masterBtn.innerHTML = '<span>✅ Đã thuộc từ này</span>';
    masterBtn.classList.add('btn-secondary');
    masterBtn.classList.remove('btn-primary');
  } else {
    masterBtn.innerHTML = '<span>✅ Đánh dấu ĐÃ THUỘC</span>';
    masterBtn.classList.add('btn-primary');
    masterBtn.classList.remove('btn-secondary');
  }
}

function initModal() {
  const modal = document.getElementById('word-detail-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  document.getElementById('modal-speak-btn').addEventListener('click', () => {
    if (currentModalWord) speakChinese(currentModalWord.hanzi);
  });

  document.getElementById('modal-speak-ex-btn').addEventListener('click', () => {
    if (currentModalWord && currentModalWord.example && currentModalWord.example.hanzi) {
      speakChinese(currentModalWord.example.hanzi);
    }
  });

  document.getElementById('modal-star-toggle').addEventListener('click', () => {
    if (!currentModalWord) return;
    if (state.starredIds.has(currentModalWord.id)) {
      state.starredIds.delete(currentModalWord.id);
    } else {
      state.starredIds.add(currentModalWord.id);
    }
    saveStorage();
    updateModalToggleButtons(currentModalWord);
    renderVocabList();
  });

  document.getElementById('modal-master-toggle').addEventListener('click', () => {
    if (!currentModalWord) return;
    if (state.masteredIds.has(currentModalWord.id)) {
      state.masteredIds.delete(currentModalWord.id);
    } else {
      state.masteredIds.add(currentModalWord.id);
      playSfx('correct');
    }
    saveStorage();
    updateModalToggleButtons(currentModalWord);
    renderVocabList();
  });
}

// ==================== QUIZ RESULT MODAL ====================
function showQuizResultModal({ correct, total, maxStreak, onReplay }) {
  const modal = document.getElementById('quiz-result-modal');
  playSfx('fanfare');
  triggerConfetti();

  const accuracy = Math.round((correct / total) * 100);
  document.getElementById('result-correct-count').textContent = `${correct}/${total}`;
  document.getElementById('result-accuracy').textContent = `${accuracy}%`;
  document.getElementById('result-max-streak').textContent = `🔥 ${maxStreak}`;

  const titleEl = document.getElementById('result-title');
  const subtitleEl = document.getElementById('result-subtitle');
  const emojiEl = document.getElementById('result-emoji');

  if (accuracy === 100) {
    emojiEl.textContent = '🏆';
    titleEl.textContent = 'Hoàn hảo 100%! Đỉnh chóp bạn Dương!';
    subtitleEl.textContent = 'Bạn đã ghi nhớ toàn bộ từ vựng trong lượt này mà không hề mắc sai sót!';
  } else if (accuracy >= 80) {
    emojiEl.textContent = '🎉';
    titleEl.textContent = 'Xuất sắc quá Dương ơi!';
    subtitleEl.textContent = 'Điểm số rất cao, tiếp tục giữ vững phong độ nhé!';
  } else if (accuracy >= 50) {
    emojiEl.textContent = '💪';
    titleEl.textContent = 'Rất cố gắng!';
    subtitleEl.textContent = 'Chỉ cần luyện thêm vài lượt nữa là thuộc lòng ngay thôi!';
  } else {
    emojiEl.textContent = '🌱';
    titleEl.textContent = 'Đừng nản lòng nhé!';
    subtitleEl.textContent = 'Hãy quay lại Flashcard lướt qua một lượt rồi thử lại nhé!';
  }

  modal.classList.add('open');

  const closeBtn = document.getElementById('result-close-btn');
  const replayBtn = document.getElementById('result-replay-btn');

  closeBtn.onclick = () => modal.classList.remove('open');
  replayBtn.onclick = () => {
    modal.classList.remove('open');
    if (onReplay) onReplay();
  };
}

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // If typing in input, don't trigger shortcuts
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Flashcard shortcuts
    const isFcActive = document.getElementById('panel-flashcard').classList.contains('active');
    if (isFcActive) {
      if (e.code === 'Space') {
        e.preventDefault();
        document.getElementById('fc-flip-btn').click();
      } else if (e.code === 'ArrowRight') {
        document.getElementById('fc-next-btn').click();
      } else if (e.code === 'ArrowLeft') {
        document.getElementById('fc-prev-btn').click();
      } else if (e.code === 'ArrowUp') {
        document.getElementById('fc-speak-front-btn').click();
      }
      return;
    }

    // Number keys 1, 2, 3, 4 for quiz choices
    const keyChoiceMap = {
      'Digit1': 0, 'KeyA': 0,
      'Digit2': 1, 'KeyB': 1,
      'Digit3': 2, 'KeyC': 2,
      'Digit4': 3, 'KeyD': 3,
    };

    if (keyChoiceMap[e.code] !== undefined) {
      const idx = keyChoiceMap[e.code];
      const activePanel = document.querySelector('.view-panel.active');
      if (activePanel) {
        const choiceBtns = activePanel.querySelectorAll('.choices-grid .choice-btn');
        if (choiceBtns[idx] && !choiceBtns[idx].disabled) {
          choiceBtns[idx].click();
        }
      }
    }

    // Enter for next question
    if (e.code === 'Enter') {
      const activePanel = document.querySelector('.view-panel.active');
      if (activePanel) {
        const nextBtn = activePanel.querySelector('.feedback-box.show .btn');
        if (nextBtn) nextBtn.click();
      }
    }
  });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderBadges();
  initNavigation();
  initFlashcard();
  initAbcdQuiz();
  initListeningQuiz();
  initMeaningMatchQuiz();
  initVocabList();
  initModal();
  initKeyboardShortcuts();
});
