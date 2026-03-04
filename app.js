/* ============================================
   HabitAI - Aqlli Odat Kuzatuvchi (O'zbek tilida)
   ============================================ */

// ============================================
// Ma'lumotlar qatlami
// ============================================

const DEFAULT_API_KEY = '229a9e9d8e4f41e3af2cd43b57d0a73a.QrcnrKDeOTBBWhtY';

const STORAGE_KEYS = {
    HABITS: 'habitai_habits',
    COMPLETIONS: 'habitai_completions',
    API_KEY: 'habitai_api_key',
    CHAT_HISTORY: 'habitai_chat_history',
};

const CATEGORIES = {
    health: { label: '🏃 Salomatlik', color: '#00C9A7' },
    productivity: { label: '💼 Samaradorlik', color: '#6C63FF' },
    mindfulness: { label: '🧘 Hushyorlik', color: '#A78BFA' },
    learning: { label: "📚 O'rganish", color: '#FFD93D' },
    social: { label: '👥 Ijtimoiy', color: '#4ECDC4' },
    other: { label: '✨ Boshqa', color: '#FF9A3C' },
};

const DAY_NAMES_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const DAY_NAMES_WEEKLY = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function getDateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayKey() {
    return getDateKey(new Date());
}

function loadData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ============================================
// Holat
// ============================================

let habits = loadData(STORAGE_KEYS.HABITS) || [];
let completions = loadData(STORAGE_KEYS.COMPLETIONS) || {};
let chatHistory = loadData(STORAGE_KEYS.CHAT_HISTORY) || [];
let currentView = 'dashboard';
let calendarDate = new Date();
let editingHabitId = null;
let currentFilter = 'all';

// API kalitni yuklash - default yoki saqlangan
function getApiKey() {
    const saved = loadData(STORAGE_KEYS.API_KEY);
    if (saved && saved.trim()) return saved;
    return DEFAULT_API_KEY;
}

// ============================================
// DOM havolalar
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    sidebar: $('#sidebar'),
    sidebarToggle: $('#sidebar-toggle'),
    mobileMenuBtn: $('#mobile-menu-btn'),
    navItems: $$('.nav-item[data-view]'),
    pageTitle: $('#page-title'),
    pageSubtitle: $('#page-subtitle'),
    dateDisplay: $('#date-display'),
    addHabitBtn: $('#add-habit-btn'),
    todayHabitsList: $('#today-habits-list'),
    allHabitsList: $('#all-habits-list'),
    weeklyChart: $('#weekly-chart'),
    dailyProgressRing: $('#daily-progress-ring'),
    dailyProgressText: $('#daily-progress-text'),
    statTotalValue: $('#stat-total-value'),
    statCompletedValue: $('#stat-completed-value'),
    statStreakValue: $('#stat-streak-value'),
    statRateValue: $('#stat-rate-value'),
    habitModal: $('#habit-modal'),
    habitForm: $('#habit-form'),
    habitId: $('#habit-id'),
    habitName: $('#habit-name'),
    habitDescription: $('#habit-description'),
    habitCategory: $('#habit-category'),
    habitFrequency: $('#habit-frequency'),
    habitReminder: $('#habit-reminder'),
    customDaysGroup: $('#custom-days-group'),
    modalTitle: $('#modal-title'),
    modalClose: $('#modal-close'),
    modalCancel: $('#modal-cancel'),
    settingsBtn: $('#settings-btn'),
    settingsModal: $('#settings-modal'),
    settingsClose: $('#settings-close'),
    apiKeyInput: $('#api-key-input'),
    exportBtn: $('#export-btn'),
    importBtn: $('#import-btn'),
    importInput: $('#import-input'),
    resetBtn: $('#reset-btn'),
    confirmModal: $('#confirm-modal'),
    confirmTitle: $('#confirm-title'),
    confirmMessage: $('#confirm-message'),
    confirmCancel: $('#confirm-cancel'),
    confirmOk: $('#confirm-ok'),
    chatMessages: $('#chat-messages'),
    chatInput: $('#chat-input'),
    chatSendBtn: $('#chat-send-btn'),
    calMonthYear: $('#cal-month-year'),
    calPrev: $('#cal-prev'),
    calNext: $('#cal-next'),
    calendarDays: $('#calendar-days'),
    heatmapContainer: $('#heatmap-container'),
    streaksList: $('#streaks-list'),
    categoryChart: $('#category-chart'),
    weeklyTrendChart: $('#weekly-trend-chart'),
    toastContainer: $('#toast-container'),
    filterTabs: $$('.filter-tab'),
    suggestionChips: $$('.suggestion-chip'),
};

// ============================================
// Navigatsiya
// ============================================

const viewTitles = {
    dashboard: { title: 'Boshqaruv paneli', subtitle: "Xush kelibsiz! Odatlaringiz umumiy ko'rinishi." },
    habits: { title: 'Odatlarim', subtitle: 'Barcha odatlaringizni boshqaring va tartibga soling.' },
    calendar: { title: 'Kalendar', subtitle: "Bajarilish tarixini ko'ring." },
    stats: { title: 'Statistika', subtitle: 'Rivojlanish va trendlarni kuzating.' },
    chatbot: { title: 'AI Maslahatchi', subtitle: 'Shaxsiy odat maslahatlari oling.' },
};

function switchView(view) {
    currentView = view;

    DOM.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    $('#nav-chatbot').classList.toggle('active', view === 'chatbot');

    $$('.view').forEach(v => v.classList.remove('active'));
    const viewEl = $(`#view-${view}`);
    if (viewEl) viewEl.classList.add('active');

    const info = viewTitles[view];
    if (info) {
        DOM.pageTitle.textContent = info.title;
        DOM.pageSubtitle.textContent = info.subtitle;
    }

    if (view === 'dashboard') renderDashboard();
    if (view === 'habits') renderHabitsView();
    if (view === 'calendar') renderCalendar();
    if (view === 'stats') renderStats();

    DOM.sidebar.classList.remove('mobile-open');
    const overlay = $('.sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ============================================
// Odat CRUD
// ============================================

function getHabitById(id) {
    return habits.find(h => h.id === id);
}

function addHabit(data) {
    const habit = {
        id: generateId(),
        name: data.name,
        description: data.description || '',
        category: data.category || 'other',
        color: data.color || '#6C63FF',
        frequency: data.frequency || 'daily',
        customDays: data.customDays || [],
        reminder: data.reminder || '',
        createdAt: new Date().toISOString(),
    };
    habits.push(habit);
    saveData(STORAGE_KEYS.HABITS, habits);
    return habit;
}

function updateHabit(id, data) {
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) return null;
    habits[idx] = { ...habits[idx], ...data };
    saveData(STORAGE_KEYS.HABITS, habits);
    return habits[idx];
}

function deleteHabit(id) {
    habits = habits.filter(h => h.id !== id);
    Object.keys(completions).forEach(dateKey => {
        if (completions[dateKey]) {
            delete completions[dateKey][id];
        }
    });
    saveData(STORAGE_KEYS.HABITS, habits);
    saveData(STORAGE_KEYS.COMPLETIONS, completions);
}

function toggleCompletion(habitId, dateKey) {
    if (!completions[dateKey]) completions[dateKey] = {};
    completions[dateKey][habitId] = !completions[dateKey][habitId];
    saveData(STORAGE_KEYS.COMPLETIONS, completions);
}

function isCompleted(habitId, dateKey) {
    return completions[dateKey] && completions[dateKey][habitId] === true;
}

function isHabitScheduledForDate(habit, date) {
    const d = new Date(date);
    const day = d.getDay();

    switch (habit.frequency) {
        case 'daily': return true;
        case 'weekdays': return day >= 1 && day <= 5;
        case 'weekends': return day === 0 || day === 6;
        case 'custom':
            return habit.customDays && habit.customDays.includes(day);
        default: return true;
    }
}

function getTodayHabits() {
    const today = new Date();
    return habits.filter(h => isHabitScheduledForDate(h, today));
}

function getHabitStreak(habitId) {
    let streak = 0;
    const d = new Date();
    const habit = getHabitById(habitId);
    if (!habit) return 0;

    const todayKey = getDateKey(d);
    if (!isCompleted(habitId, todayKey)) {
        d.setDate(d.getDate() - 1);
    }

    while (true) {
        const key = getDateKey(d);
        if (!isHabitScheduledForDate(habit, d)) {
            d.setDate(d.getDate() - 1);
            continue;
        }
        if (isCompleted(habitId, key)) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
        if (streak > 365) break;
    }
    return streak;
}

function getBestStreak(habitId) {
    const habit = getHabitById(habitId);
    if (!habit) return 0;

    let bestStreak = 0;
    let currentStreak = 0;

    for (let i = 365; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = getDateKey(d);

        if (!isHabitScheduledForDate(habit, d)) continue;

        if (isCompleted(habitId, key)) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }
    return bestStreak;
}

// ============================================
// Render - Boshqaruv paneli
// ============================================

function renderDashboard() {
    renderDashboardStats();
    renderTodayHabits();
    renderWeeklyChart();
}

function renderDashboardStats() {
    const todayHabits = getTodayHabits();
    const todayKey = getTodayKey();
    const completedCount = todayHabits.filter(h => isCompleted(h.id, todayKey)).length;
    const rate = todayHabits.length > 0 ? Math.round((completedCount / todayHabits.length) * 100) : 0;

    const bestStreak = habits.reduce((max, h) => Math.max(max, getBestStreak(h.id)), 0);

    animateValue(DOM.statTotalValue, parseInt(DOM.statTotalValue.textContent) || 0, habits.length, 500);
    animateValue(DOM.statCompletedValue, parseInt(DOM.statCompletedValue.textContent) || 0, completedCount, 500);
    animateValue(DOM.statStreakValue, parseInt(DOM.statStreakValue.textContent) || 0, bestStreak, 500);

    DOM.statRateValue.textContent = rate + '%';

    const circumference = 2 * Math.PI * 20;
    const offset = circumference - (rate / 100) * circumference;
    DOM.dailyProgressRing.style.strokeDashoffset = offset;
    DOM.dailyProgressText.textContent = rate + '%';
}

function animateValue(el, start, end, duration) {
    if (start === end) { el.textContent = end; return; }
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range)) || 20;
    const timer = setInterval(() => {
        current += increment;
        el.textContent = current;
        if (current === end) clearInterval(timer);
    }, stepTime);
}

function renderTodayHabits() {
    const todayHabits = getTodayHabits();
    const todayKey = getTodayKey();

    if (todayHabits.length === 0) {
        DOM.todayHabitsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>Bugun odatlar rejalashtirilmagan</h3>
                <p>Boshlash uchun yangi odat yarating!</p>
            </div>
        `;
        return;
    }

    const sorted = [...todayHabits].sort((a, b) => {
        const ac = isCompleted(a.id, todayKey);
        const bc = isCompleted(b.id, todayKey);
        if (ac && !bc) return 1;
        if (!ac && bc) return -1;
        return 0;
    });

    DOM.todayHabitsList.innerHTML = sorted.map(habit => {
        const completed = isCompleted(habit.id, todayKey);
        const streak = getHabitStreak(habit.id);
        const cat = CATEGORIES[habit.category] || CATEGORIES.other;

        return `
            <div class="habit-item ${completed ? 'completed' : ''}" data-id="${habit.id}">
                <button class="habit-check" onclick="handleToggle('${habit.id}')" aria-label="Bajarilishni belgilash">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 7L5.5 10.5L12 4"/>
                    </svg>
                </button>
                <div class="habit-color-bar" style="background: ${habit.color};"></div>
                <div class="habit-info">
                    <div class="habit-name">${escapeHtml(habit.name)}</div>
                    <div class="habit-meta">
                        <span class="habit-category-badge">${cat.label}</span>
                        ${streak > 0 ? `<span class="habit-streak">🔥 ${streak} kun</span>` : ''}
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="habit-action-btn" onclick="openEditHabit('${habit.id}')" aria-label="Tahrirlash">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M11 2L14 5L5 14H2V11L11 2Z"/>
                        </svg>
                    </button>
                    <button class="habit-action-btn delete" onclick="confirmDeleteHabit('${habit.id}')" aria-label="O'chirish">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M2 4H14M5 4V2H11V4M6 7V12M10 7V12M3 4L4 14H12L13 4"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderWeeklyChart() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const days = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        const mondayOffset = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        d.setDate(today.getDate() + mondayOffset + i);
        days.push(d);
    }

    DOM.weeklyChart.innerHTML = days.map(d => {
        const key = getDateKey(d);
        const isToday = key === getTodayKey();
        const scheduled = habits.filter(h => isHabitScheduledForDate(h, d));
        const completed = scheduled.filter(h => isCompleted(h.id, key));
        const percent = scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : 0;
        const dayName = DAY_NAMES_SHORT[d.getDay()];

        return `
            <div class="weekly-day ${isToday ? 'today' : ''}">
                <div class="weekly-day-name">${dayName}</div>
                <div class="weekly-day-bar">
                    <div class="weekly-day-fill" style="height: ${percent}%;"></div>
                </div>
                <div class="weekly-day-percent">${percent}%</div>
            </div>
        `;
    }).join('');
}

// ============================================
// Render - Odatlar ko'rinishi
// ============================================

function renderHabitsView() {
    let filtered = habits;
    if (currentFilter !== 'all') {
        filtered = habits.filter(h => h.category === currentFilter);
    }

    if (filtered.length === 0) {
        DOM.allHabitsList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">📋</div>
                <h3>${currentFilter !== 'all' ? 'Bu kategoriyada odatlar yo\'q' : 'Hali odatlar yo\'q'}</h3>
                <p>Birinchi odatingizni yarating va sayohatni boshlang!</p>
            </div>
        `;
        return;
    }

    DOM.allHabitsList.innerHTML = filtered.map(habit => {
        const streak = getHabitStreak(habit.id);
        const bestStreak = getBestStreak(habit.id);
        const cat = CATEGORIES[habit.category] || CATEGORIES.other;

        let scheduledDays = 0;
        let completedDays = 0;
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            if (isHabitScheduledForDate(habit, d)) {
                scheduledDays++;
                if (isCompleted(habit.id, getDateKey(d))) completedDays++;
            }
        }
        const completionRate = scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0;

        const freqLabel = habit.frequency === 'daily' ? 'Har kuni' :
            habit.frequency === 'weekdays' ? 'Ish kunlari' :
                habit.frequency === 'weekends' ? 'Dam olish kunlari' : 'Maxsus';

        return `
            <div class="habit-card" style="--card-color: ${habit.color};">
                <div class="habit-card-header">
                    <div>
                        <div class="habit-card-title">${escapeHtml(habit.name)}</div>
                        <span class="habit-category-badge">${cat.label}</span>
                    </div>
                    <div class="habit-card-actions">
                        <button class="habit-action-btn" onclick="openEditHabit('${habit.id}')" aria-label="Tahrirlash">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M11 2L14 5L5 14H2V11L11 2Z"/>
                            </svg>
                        </button>
                        <button class="habit-action-btn delete" onclick="confirmDeleteHabit('${habit.id}')" aria-label="O'chirish">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M2 4H14M5 4V2H11V4M6 7V12M10 7V12M3 4L4 14H12L13 4"/>
                            </svg>
                        </button>
                    </div>
                </div>
                ${habit.description ? `<div class="habit-card-desc">${escapeHtml(habit.description)}</div>` : ''}
                <div class="habit-card-stats">
                    <div class="habit-card-stat">
                        <span class="habit-card-stat-value" style="color: ${habit.color};">🔥 ${streak}</span>
                        <span class="habit-card-stat-label">Hozirgi davomiylik</span>
                    </div>
                    <div class="habit-card-stat">
                        <span class="habit-card-stat-value">⭐ ${bestStreak}</span>
                        <span class="habit-card-stat-label">Eng yaxshi</span>
                    </div>
                    <div class="habit-card-stat">
                        <span class="habit-card-stat-value">${completionRate}%</span>
                        <span class="habit-card-stat-label">30 kunlik</span>
                    </div>
                </div>
                <div class="habit-card-progress">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${completionRate}%; background: ${habit.color};"></div>
                    </div>
                </div>
                <div class="habit-card-footer">
                    <span class="habit-meta">${freqLabel}</span>
                    ${habit.reminder ? `<span class="habit-meta">⏰ ${habit.reminder}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// Kalendar
// ============================================

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    DOM.calMonthYear.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - offset);

    let html = '';
    const todayKey = getTodayKey();

    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const key = getDateKey(d);
        const isToday = key === todayKey;
        const isOtherMonth = d.getMonth() !== month;

        const scheduled = habits.filter(h => isHabitScheduledForDate(h, d));
        const completed = scheduled.filter(h => isCompleted(h.id, key));
        const percent = scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : -1;

        let dotColor = 'transparent';
        if (percent >= 0) {
            if (percent === 0) dotColor = 'var(--accent-muted)';
            else if (percent < 50) dotColor = '#FF6584';
            else if (percent < 100) dotColor = '#FFD93D';
            else dotColor = '#00C9A7';
        }

        html += `
            <div class="cal-day ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}"
                 title="${key}: ${percent >= 0 ? percent + '% bajarilgan' : 'Odatsiz'}">
                <span>${d.getDate()}</span>
                ${percent >= 0 ? `<div class="cal-day-dot" style="background: ${dotColor};"></div>` : ''}
            </div>
        `;
    }

    DOM.calendarDays.innerHTML = html;
}

// ============================================
// Statistika
// ============================================

function renderStats() {
    renderHeatmap();
    renderStreaks();
    renderCategoryChart();
    renderWeeklyTrend();
}

function renderHeatmap() {
    const today = new Date();
    let html = '<div class="heatmap">';

    for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = getDateKey(d);
        const scheduled = habits.filter(h => isHabitScheduledForDate(h, d));
        const completed = scheduled.filter(h => isCompleted(h.id, key));
        const percent = scheduled.length > 0 ? (completed.length / scheduled.length) * 100 : 0;

        let level = 0;
        if (percent > 0) level = 1;
        if (percent >= 25) level = 2;
        if (percent >= 50) level = 3;
        if (percent >= 75) level = 4;

        html += `<div class="heatmap-cell" data-level="${scheduled.length > 0 ? level : 0}" title="${key}: ${Math.round(percent)}%"></div>`;
    }

    html += '</div>';
    DOM.heatmapContainer.innerHTML = html;
}

function renderStreaks() {
    if (habits.length === 0) {
        DOM.streaksList.innerHTML = '<div class="empty-state"><p>Davomiylik ko\'rsatish uchun odatlar yo\'q.</p></div>';
        return;
    }

    const sorted = [...habits].sort((a, b) => getHabitStreak(b.id) - getHabitStreak(a.id));

    DOM.streaksList.innerHTML = sorted.map(habit => {
        const streak = getHabitStreak(habit.id);
        const best = getBestStreak(habit.id);
        return `
            <div class="streak-item">
                <div class="streak-bar" style="background: ${habit.color};"></div>
                <div class="streak-info">
                    <div class="streak-name">${escapeHtml(habit.name)}</div>
                    <div class="streak-days">Eng yaxshi: ${best} kun</div>
                </div>
                <div style="text-align: center;">
                    <div class="streak-value">${streak}</div>
                    <div class="streak-value-label">kun</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCategoryChart() {
    const counts = {};
    habits.forEach(h => {
        counts[h.category] = (counts[h.category] || 0) + 1;
    });

    const max = Math.max(...Object.values(counts), 1);

    if (Object.keys(counts).length === 0) {
        DOM.categoryChart.innerHTML = '<div class="empty-state"><p>Kategoriyalash uchun odatlar yo\'q.</p></div>';
        return;
    }

    const categoryColors = {
        health: '#00C9A7',
        productivity: '#6C63FF',
        mindfulness: '#A78BFA',
        learning: '#FFD93D',
        social: '#4ECDC4',
        other: '#FF9A3C',
    };

    DOM.categoryChart.innerHTML = Object.entries(counts).map(([cat, count]) => {
        const label = CATEGORIES[cat] ? CATEGORIES[cat].label : cat;
        const color = categoryColors[cat] || '#6C63FF';
        const width = (count / max) * 100;
        return `
            <div class="category-item">
                <span class="category-label">${label}</span>
                <div class="category-bar-bg">
                    <div class="category-bar-fill" style="width: ${width}%; background: ${color};"></div>
                </div>
                <span class="category-count">${count}</span>
            </div>
        `;
    }).join('');
}

function renderWeeklyTrend() {
    const weeks = [];
    const today = new Date();

    for (let w = 7; w >= 0; w--) {
        let totalScheduled = 0;
        let totalCompleted = 0;

        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (w * 7 + (6 - d)));
            const key = getDateKey(date);

            habits.forEach(h => {
                if (isHabitScheduledForDate(h, date)) {
                    totalScheduled++;
                    if (isCompleted(h.id, key)) totalCompleted++;
                }
            });
        }

        const percent = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
        const label = w === 0 ? 'Bu hafta' : w === 1 ? "O'tgan hafta" : `${w} hafta oldin`;

        weeks.push({ label, percent });
    }

    DOM.weeklyTrendChart.innerHTML = weeks.map(w => `
        <div class="trend-bar-wrapper">
            <span class="trend-bar-value">${w.percent}%</span>
            <div class="trend-bar" style="height: ${(w.percent / 100) * 160}px;"></div>
            <span class="trend-bar-label">${w.label}</span>
        </div>
    `).join('');
}

// ============================================
// Modal boshqaruvi
// ============================================

function openAddHabit() {
    editingHabitId = null;
    DOM.modalTitle.textContent = 'Yangi odat';
    DOM.habitForm.reset();
    DOM.habitId.value = '';
    DOM.customDaysGroup.style.display = 'none';
    $('input[name="habit-color"][value="#6C63FF"]').checked = true;
    openModal(DOM.habitModal);
}

function openEditHabit(id) {
    const habit = getHabitById(id);
    if (!habit) return;

    editingHabitId = id;
    DOM.modalTitle.textContent = 'Odatni tahrirlash';
    DOM.habitId.value = id;
    DOM.habitName.value = habit.name;
    DOM.habitDescription.value = habit.description || '';
    DOM.habitCategory.value = habit.category;
    DOM.habitFrequency.value = habit.frequency;
    DOM.habitReminder.value = habit.reminder || '';

    const colorInput = $(`input[name="habit-color"][value="${habit.color}"]`);
    if (colorInput) colorInput.checked = true;

    if (habit.frequency === 'custom') {
        DOM.customDaysGroup.style.display = 'block';
        $$('#custom-days-group input[type="checkbox"]').forEach(cb => {
            cb.checked = habit.customDays && habit.customDays.includes(parseInt(cb.value));
        });
    } else {
        DOM.customDaysGroup.style.display = 'none';
    }

    openModal(DOM.habitModal);
}

function handleHabitSubmit(e) {
    e.preventDefault();

    const data = {
        name: DOM.habitName.value.trim(),
        description: DOM.habitDescription.value.trim(),
        category: DOM.habitCategory.value,
        frequency: DOM.habitFrequency.value,
        color: $('input[name="habit-color"]:checked').value,
        reminder: DOM.habitReminder.value,
        customDays: [],
    };

    if (data.frequency === 'custom') {
        data.customDays = [...$$('#custom-days-group input[type="checkbox"]:checked')]
            .map(cb => parseInt(cb.value));
    }

    if (!data.name) {
        showToast('Iltimos, odat nomini kiriting.', 'error');
        return;
    }

    if (editingHabitId) {
        updateHabit(editingHabitId, data);
        showToast('Odat muvaffaqiyatli yangilandi!', 'success');
    } else {
        addHabit(data);
        showToast('Odat yaratildi! Boshlaylik! 🚀', 'success');
    }

    closeModal(DOM.habitModal);
    renderDashboard();
    if (currentView === 'habits') renderHabitsView();
}

function confirmDeleteHabit(id) {
    const habit = getHabitById(id);
    if (!habit) return;

    DOM.confirmTitle.textContent = "Odatni o'chirish";
    DOM.confirmMessage.textContent = `"${habit.name}" odatini o'chirishni xohlaysizmi? Barcha rivojlanish yo'qoladi.`;
    DOM.confirmOk.onclick = () => {
        deleteHabit(id);
        closeModal(DOM.confirmModal);
        showToast("Odat o'chirildi.", 'info');
        renderDashboard();
        if (currentView === 'habits') renderHabitsView();
    };
    openModal(DOM.confirmModal);
}

function handleToggle(habitId) {
    toggleCompletion(habitId, getTodayKey());
    renderDashboard();
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// AI Chatbot
// ============================================

async function sendChatMessage(message) {
    if (!message.trim()) return;

    const welcome = $('.chat-welcome');
    if (welcome) welcome.remove();

    appendChatMessage('user', message);
    DOM.chatInput.value = '';
    DOM.chatInput.style.height = 'auto';

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg ai';
    typingEl.innerHTML = `
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    DOM.chatMessages.appendChild(typingEl);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

    try {
        const apiKey = getApiKey();
        if (!apiKey) {
            typingEl.remove();
            appendChatMessage('ai', '⚠️ **API kalit topilmadi.** Iltimos, Sozlamalarga o\'ting va Gemini API kalitini kiriting.\n\nBepul API kalitni [Google AI Studio](https://aistudio.google.com/apikey) dan oling.');
            return;
        }

        const habitContext = buildHabitContext();
        const response = await callGeminiAPI(apiKey, message, habitContext);
        typingEl.remove();
        appendChatMessage('ai', response);

        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'ai', content: response });
        if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
        saveData(STORAGE_KEYS.CHAT_HISTORY, chatHistory);

    } catch (error) {
        typingEl.remove();
        appendChatMessage('ai', `❌ **Xatolik:** ${error.message}\n\nIltimos, Sozlamalardagi API kalitni tekshiring va qaytadan urinib ko'ring.`);
    }
}

function buildHabitContext() {
    const todayKey = getTodayKey();
    const todayHabits = getTodayHabits();
    const completedToday = todayHabits.filter(h => isCompleted(h.id, todayKey));

    let context = `Foydalanuvchining odat ma'lumotlari:\n`;
    context += `- Jami odatlar: ${habits.length}\n`;
    context += `- Bugungi rejalashtirilgan odatlar: ${todayHabits.length}\n`;
    context += `- Bugun bajarilgan: ${completedToday.length}\n`;
    context += `- Bugungi bajarilish darajasi: ${todayHabits.length > 0 ? Math.round((completedToday.length / todayHabits.length) * 100) : 0}%\n\n`;

    if (habits.length > 0) {
        context += `Odatlar:\n`;
        habits.forEach(h => {
            const streak = getHabitStreak(h.id);
            const best = getBestStreak(h.id);
            const completed = isCompleted(h.id, todayKey);
            context += `- "${h.name}" (${h.category}, ${h.frequency}) — Hozirgi davomiylik: ${streak} kun, Eng yaxshi: ${best} kun, Bugun: ${completed ? '✅' : '❌'}\n`;
        });
    }

    return context;
}

async function callGeminiAPI(apiKey, message, context) {
    const systemPrompt = `Siz HabitAI Maslahatchi - do'stona va qo'llab-quvvatlovchi AI odat maslahatchi. Siz foydalanuvchilarga odatlarni shakllantirish, ushlab turish va yaxshilashga yordam berasiz. Sizda foydalanuvchining odat kuzatuv ma'lumotlariga kirish imkoni bor.

Sizning shaxsiyatingiz:
- Rag'batlantiruvchi va ijobiy
- Dalillarga asoslangan maslahatlar (odat fani, James Clear'ning Atomic Habits, BJ Fogg'ning Tiny Habits va boshqalar)
- Amaliy va harakatga yo'naltirilgan maslahatlar
- Muvaffaqiyatlarni nishonlash va qiyinchiliklarda rag'batlantirish
- Javoblar qisqa lekin foydali bo'lsin (2-4 xat boshi max)

MUHIM: Har doim O'ZBEK TILIDA javob bering!

Javoblarni formatlang:
- Asosiy fikrlar uchun **qalin** matn
- Ro'yxatlar uchun nuqtali belgilar
- Tegishli emojilarni kamroq ishlatish

${context}`;

    const contents = [];

    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach(msg => {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    });

    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API xatolik (${response.status})`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("AI'dan javob kelmadi");

    return text;
}

function appendChatMessage(role, content) {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${role}`;

    const avatar = role === 'ai' ? '🤖' : '👤';
    const formattedContent = formatMarkdown(content);

    msgEl.innerHTML = `
        <div class="chat-avatar">${avatar}</div>
        <div class="chat-bubble">${formattedContent}</div>
    `;

    DOM.chatMessages.appendChild(msgEl);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function formatMarkdown(text) {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--accent);">$1</a>');

    const lines = html.split('\n');
    let result = '';
    let inList = false;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            if (!inList) { result += '<ul>'; inList = true; }
            result += `<li>${trimmed.substring(2)}</li>`;
        } else if (/^\d+\.\s/.test(trimmed)) {
            if (!inList) { result += '<ol>'; inList = true; }
            result += `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`;
        } else {
            if (inList) { result += '</ul>'; inList = false; }
            if (trimmed) result += `<p>${trimmed}</p>`;
        }
    });

    if (inList) result += '</ul>';
    return result;
}

// ============================================
// Sozlamalar
// ============================================

function initSettings() {
    // API kalitni ko'rsatish
    const storedKey = loadData(STORAGE_KEYS.API_KEY);
    DOM.apiKeyInput.value = storedKey || DEFAULT_API_KEY;

    DOM.apiKeyInput.addEventListener('change', () => {
        const key = DOM.apiKeyInput.value.trim();
        saveData(STORAGE_KEYS.API_KEY, key);
        showToast('API kalit saqlandi!', 'success');
    });

    DOM.exportBtn.addEventListener('click', exportData);
    DOM.importBtn.addEventListener('click', () => DOM.importInput.click());
    DOM.importInput.addEventListener('change', importData);
    DOM.resetBtn.addEventListener('click', () => {
        DOM.confirmTitle.textContent = "Barcha ma'lumotlarni o'chirish";
        DOM.confirmMessage.textContent = "Bu barcha odatlar, rivojlanish va suhbat tarixini butunlay o'chirib tashlaydi. Bu amalni qaytarib bo'lmaydi.";
        DOM.confirmOk.onclick = () => {
            localStorage.removeItem(STORAGE_KEYS.HABITS);
            localStorage.removeItem(STORAGE_KEYS.COMPLETIONS);
            localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
            habits = [];
            completions = {};
            chatHistory = [];
            closeModal(DOM.confirmModal);
            closeModal(DOM.settingsModal);
            showToast("Barcha ma'lumotlar o'chirildi.", 'info');
            switchView('dashboard');
        };
        openModal(DOM.confirmModal);
    });
}

function exportData() {
    const data = {
        habits,
        completions,
        exportedAt: new Date().toISOString(),
        version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitai-eksport-${getDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Ma'lumotlar muvaffaqiyatli eksport qilindi!", 'success');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.habits && data.completions) {
                habits = data.habits;
                completions = data.completions;
                saveData(STORAGE_KEYS.HABITS, habits);
                saveData(STORAGE_KEYS.COMPLETIONS, completions);
                showToast("Ma'lumotlar muvaffaqiyatli import qilindi!", 'success');
                switchView('dashboard');
            } else {
                showToast("Noto'g'ri ma'lumot fayli.", 'error');
            }
        } catch {
            showToast("Import faylini o'qib bo'lmadi.", 'error');
        }
    };
    reader.readAsText(file);
    DOM.importInput.value = '';
}

// ============================================
// Yordamchi funksiyalar
// ============================================

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateDateDisplay() {
    const now = new Date();
    const kunlar = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const oylar = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
    DOM.dateDisplay.textContent = `${kunlar[now.getDay()]}, ${now.getDate()}-${oylar[now.getMonth()]} ${now.getFullYear()}`;
}

// ============================================
// Hodisa tinglovchilar
// ============================================

function initEventListeners() {
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
    $('#nav-chatbot').addEventListener('click', () => switchView('chatbot'));

    DOM.sidebarToggle.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('collapsed');
    });

    DOM.mobileMenuBtn.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('mobile-open');
        toggleMobileOverlay();
    });

    DOM.addHabitBtn.addEventListener('click', openAddHabit);

    DOM.habitForm.addEventListener('submit', handleHabitSubmit);
    DOM.habitFrequency.addEventListener('change', () => {
        DOM.customDaysGroup.style.display =
            DOM.habitFrequency.value === 'custom' ? 'block' : 'none';
    });

    DOM.modalClose.addEventListener('click', () => closeModal(DOM.habitModal));
    DOM.modalCancel.addEventListener('click', () => closeModal(DOM.habitModal));
    DOM.settingsBtn.addEventListener('click', () => openModal(DOM.settingsModal));
    DOM.settingsClose.addEventListener('click', () => closeModal(DOM.settingsModal));
    DOM.confirmCancel.addEventListener('click', () => closeModal(DOM.confirmModal));

    [DOM.habitModal, DOM.settingsModal, DOM.confirmModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    DOM.calPrev.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });
    DOM.calNext.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    DOM.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            DOM.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderHabitsView();
        });
    });

    DOM.chatSendBtn.addEventListener('click', () => {
        sendChatMessage(DOM.chatInput.value);
    });

    DOM.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage(DOM.chatInput.value);
        }
    });

    DOM.chatInput.addEventListener('input', () => {
        DOM.chatInput.style.height = 'auto';
        DOM.chatInput.style.height = Math.min(DOM.chatInput.scrollHeight, 120) + 'px';
    });

    DOM.suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            sendChatMessage(chip.dataset.msg);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(DOM.habitModal);
            closeModal(DOM.settingsModal);
            closeModal(DOM.confirmModal);
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openAddHabit();
        }
    });
}

function toggleMobileOverlay() {
    let overlay = $('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
            DOM.sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
    overlay.classList.toggle('active', DOM.sidebar.classList.contains('mobile-open'));
}

// ============================================
// Ishga tushirish
// ============================================

function init() {
    updateDateDisplay();
    setInterval(updateDateDisplay, 60000);
    initEventListeners();
    initSettings();
    renderDashboard();

    if (chatHistory.length > 0) {
        const welcome = $('.chat-welcome');
        if (welcome) welcome.remove();
        chatHistory.forEach(msg => appendChatMessage(msg.role, msg.content));
    }
}

document.addEventListener('DOMContentLoaded', init);

window.handleToggle = handleToggle;
window.openEditHabit = openEditHabit;
window.confirmDeleteHabit = confirmDeleteHabit;
