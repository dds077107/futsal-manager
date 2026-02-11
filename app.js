/**
 * Futsal Manager - Universal Rotation Engine (Nickname Fix)
 * Supports 5vs5 and 6vs6
 */

const STATE = {
    view: 'setup',
    matchMode: 5,        // 5: 5vs5, 6: 6vs6
    playerCount: 7,
    quarterMinutes: 13.5,
    players: [],
    currentQuarter: 1,
    timerSeconds: 810,
    timerInterval: null,
    alarmInterval: null,
    isTimerRunning: false,
    isAlarmRinging: false
};

// [UPDATE] 닉네임 DB 확장 (12개로 늘림)
const NICKNAMES = [
    '캡틴', '스트라이커', '철벽수비', '패스마스터',
    '스피드레이서', '테크니션', '슈퍼세이브', '플레이메이커',
    '드리블러', '통곡의벽', '캐논슈터', '택배크로스'
];

// Audio Engine
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playWhistle() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
};

// View System
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });

    const target = document.getElementById(`${viewName}-view`);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 50);
        STATE.view = viewName;
    }

    const hud = document.querySelector('.hud-header');
    if (hud) {
        if (viewName === 'match') hud.classList.remove('hidden');
        else hud.classList.add('hidden');
    }
}

// Init & Events
function init() {
    // 경기 방식 선택
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            STATE.matchMode = parseInt(btn.dataset.mode);
            validatePlayerCount();
        });
    });

    // 인원 선택
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            STATE.playerCount = parseInt(btn.dataset.count);
        });
    });

    // 시간 선택
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            STATE.quarterMinutes = parseFloat(btn.dataset.minutes);
        });
    });

    // Actions
    const actions = {
        'start-draw-btn': startDraw,
        'go-to-match-btn': startMatch,
        'timer-control-btn': handleMainButton,
        'next-quarter-btn': nextQuarter,
        'main-menu-btn': () => confirm('처음으로 돌아가시겠습니까?') && location.reload()
    };

    Object.entries(actions).forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    });

    switchView('setup');
}

function validatePlayerCount() {
    if (STATE.matchMode === 6 && STATE.playerCount < 6) {
        STATE.playerCount = 6;
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.count === '6');
        });
    }
}

// [UPDATE] 닉네임 뽑기 로직 수정 (공란 제거)
function startDraw() {
    if (STATE.matchMode === 6 && STATE.playerCount < 6) {
        alert('6vs6 경기는 최소 6명이 필요합니다.');
        return;
    }

    const numbers = Array.from({ length: STATE.playerCount }, (_, i) => i + 1);
    const shuffledNums = numbers.sort(() => Math.random() - 0.5);

    // [수정됨] 닉네임 배열 자체를 섞어서 순서대로 배정 (빈값 섞지 않음)
    const shuffledNicks = [...NICKNAMES].sort(() => Math.random() - 0.5);

    STATE.players = Array.from({ length: STATE.playerCount }, (_, i) => ({
        number: shuffledNums[i],
        // 닉네임이 있으면 쓰고, 혹시라도 모자르면 그때만 P+숫자 사용
        nickname: shuffledNicks[i] || `P${shuffledNums[i]}`
    }));

    const container = document.getElementById('card-stack');
    container.innerHTML = '';

    STATE.players.forEach(p => {
        const card = document.createElement('div');
        card.className = 'draw-item';
        card.innerHTML = `<span class="nick">${p.nickname}</span>`;

        card.onclick = () => {
            if (card.classList.contains('opened')) return;
            card.classList.add('opened');
            card.innerHTML = p.number;
            if (navigator.vibrate) navigator.vibrate(30);

            const openedCount = document.querySelectorAll('.draw-item.opened').length;
            if (openedCount === STATE.playerCount) {
                document.getElementById('go-to-match-btn').classList.remove('hidden');
            }
        };
        container.appendChild(card);
    });

    switchView('draw');
}

// Logic: Match
function startMatch() {
    STATE.currentQuarter = 1;
    STATE.timerSeconds = Math.floor(STATE.quarterMinutes * 60);
    updateMatchBoard();
    switchView('match');
}

function updateMatchBoard() {
    document.getElementById('quarter-display').textContent = `Q${STATE.currentQuarter}`;
    updateTimerDisplay();

    const { active, resting } = calculateRotation(STATE.playerCount, STATE.currentQuarter);
    renderList(active, 'active-players');
    renderList(resting, 'resting-players');
}

function calculateRotation(total, quarter) {
    const activeCount = STATE.matchMode;
    const restingCount = total - activeCount;

    if (restingCount <= 0) {
        return {
            active: [...STATE.players].sort((a, b) => a.number - b.number),
            resting: []
        };
    }

    const sortedPlayers = [...STATE.players].sort((a, b) => a.number - b.number);
    const startIndex = ((quarter - 1) * restingCount) % total;

    let restingIndices = [];
    for (let i = 0; i < restingCount; i++) {
        restingIndices.push((startIndex + i) % total);
    }

    const resting = restingIndices.map(i => sortedPlayers[i]);
    const active = sortedPlayers.filter(p => !resting.includes(p));

    return { active, resting };
}

function renderList(players, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (players.length === 0) {
        container.innerHTML = '<div style="color:#555; font-size:0.8rem; text-align:center; padding:10px;">휴식 인원 없음</div>';
        return;
    }

    players.forEach(p => {
        const badge = document.createElement('div');
        badge.className = 'player-badge';
        badge.innerHTML = `<span class="p-num">${p.number}</span><span class="p-nick">${p.nickname}</span>`;
        container.appendChild(badge);
    });
}

// Timer & Alarm Logic
function handleMainButton() {
    if (STATE.isAlarmRinging) {
        stopAlarm();
        return;
    }
    if (STATE.isTimerRunning) pauseTimer();
    else startTimer();
}

function startTimer() {
    STATE.isTimerRunning = true;
    const btn = document.getElementById('timer-control-btn');
    btn.textContent = 'PAUSE';
    btn.style.background = '#ff4757';
    btn.style.color = '#fff';

    STATE.timerInterval = setInterval(() => {
        STATE.timerSeconds--;
        updateTimerDisplay();
        if (STATE.timerSeconds <= 0) timeOver();
    }, 1000);
}

function pauseTimer() {
    clearInterval(STATE.timerInterval);
    STATE.isTimerRunning = false;
    const btn = document.getElementById('timer-control-btn');
    btn.textContent = 'RESUME';
    btn.style.background = 'var(--primary)';
    btn.style.color = '#000';
}

function timeOver() {
    clearInterval(STATE.timerInterval);
    STATE.isTimerRunning = false;
    STATE.isAlarmRinging = true;

    const btn = document.getElementById('timer-control-btn');
    btn.textContent = 'STOP ALARM';
    btn.style.background = '#ff0000';
    btn.style.animation = 'pulse 1s infinite';

    AudioEngine.playWhistle();
    if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

    STATE.alarmInterval = setInterval(() => {
        AudioEngine.playWhistle();
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    }, 1800);
}

function stopAlarm() {
    clearInterval(STATE.alarmInterval);
    STATE.isAlarmRinging = false;

    const btn = document.getElementById('timer-control-btn');
    btn.textContent = 'START';
    btn.style.background = 'var(--primary)';
    btn.style.color = '#000';
    btn.style.animation = 'none';
}

function updateTimerDisplay() {
    const min = Math.floor(STATE.timerSeconds / 60);
    const sec = STATE.timerSeconds % 60;
    document.getElementById('timer-display').textContent =
        `${min}:${sec.toString().padStart(2, '0')}`;
}

function nextQuarter() {
    if (STATE.isAlarmRinging) {
        if (!confirm('알람을 끄고 다음 쿼터로 갈까요?')) return;
        stopAlarm();
    }
    if (confirm('다음 쿼터로 넘어가시겠습니까?')) {
        clearInterval(STATE.timerInterval);
        STATE.isTimerRunning = false;
        STATE.currentQuarter++;
        STATE.timerSeconds = Math.floor(STATE.quarterMinutes * 60);
        const btn = document.getElementById('timer-control-btn');
        btn.textContent = 'START';
        btn.style.background = 'var(--primary)';
        btn.style.color = '#000';
        updateMatchBoard();
    }
}

document.addEventListener('DOMContentLoaded', init);