/**
 * Countdown Timer Application
 * A modern, feature-rich countdown timer with multiple timers, notifications, and themes.
 * 
 * @author Serkanby
 * @version 2.0.0
 */

// ============================================
// CONSTANTS
// ============================================

const UPDATE_INTERVAL = 1000;
const TOAST_DURATION = 3000;

const ALERT_SOUND = {
    frequency: 800,
    type: 'sine',
    duration: 0.5,
    volume: 0.3
};

const TIME = {
    SECOND: 1000,
    MINUTE: 1000 * 60,
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24
};

const STORAGE_KEYS = {
    TIMERS: 'countdownTimers',
    THEME: 'darkTheme',
    NOTIFICATIONS_ENABLED: 'notificationsEnabled'
};

const SORT_OPTIONS = {
    DATE_ASC: 'date-asc',
    DATE_DESC: 'date-desc',
    NAME_ASC: 'name-asc',
    NAME_DESC: 'name-desc'
};

const FILTER_OPTIONS = {
    ALL: 'all',
    ACTIVE: 'active',
    EXPIRED: 'expired'
};

const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escapes HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generates a unique ID
 */
function generateId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats a number with leading zero
 */
function padZero(value) {
    return value.toString().padStart(2, '0');
}

/**
 * Converts milliseconds to time components
 */
function msToTimeComponents(ms) {
    if (ms <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, expired: true };
    }

    const days = Math.floor(ms / TIME.DAY);
    const hours = Math.floor((ms % TIME.DAY) / TIME.HOUR);
    const minutes = Math.floor((ms % TIME.HOUR) / TIME.MINUTE);
    const seconds = Math.floor((ms % TIME.MINUTE) / TIME.SECOND);
    const totalSeconds = Math.floor(ms / TIME.SECOND);

    return { days, hours, minutes, seconds, totalSeconds, expired: false };
}

/**
 * Formats a Date object to localized string
 */
function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Checks if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if user prefers dark mode
 */
function prefersDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Saves timers to LocalStorage
 */
function saveTimers(timers) {
    const toSave = timers.map(t => ({
        id: t.id,
        name: t.name,
        targetDate: t.targetDate,
        targetTime: t.targetTime,
        alertBefore: t.alertBefore || 0,
        createdAt: t.createdAt,
        isPaused: t.isPaused || false,
        pausedTimeRemaining: t.pausedTimeRemaining || null
    }));
    localStorage.setItem(STORAGE_KEYS.TIMERS, JSON.stringify(toSave));
}

/**
 * Loads timers from LocalStorage
 */
function loadTimersData() {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMERS);
    if (!saved) return null;
    
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.error('Error parsing timers:', e);
        return null;
    }
}

/**
 * Saves theme preference
 */
function saveTheme(isDark) {
    localStorage.setItem(STORAGE_KEYS.THEME, isDark);
}

/**
 * Loads theme preference
 */
function loadTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) === 'true';
}

/**
 * Saves notification preference
 */
function saveNotificationPreference(enabled) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled);
}

/**
 * Loads notification preference
 */
function loadNotificationPreference() {
    return localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) === 'true';
}

/**
 * Exports timers to JSON file
 */
function exportTimersToFile(timers) {
    const data = timers.map(t => ({
        name: t.name,
        targetDate: t.targetDate,
        targetTime: t.targetTime,
        alertBefore: t.alertBefore || 0
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `countdown-timers-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Imports timers from JSON file
 */
function importTimersFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) {
                    throw new Error('Invalid file format');
                }
                resolve(imported);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

let notificationPermission = 'default';
let notificationsEnabled = false;

/**
 * Initializes the notification system
 */
async function initNotifications() {
    notificationsEnabled = loadNotificationPreference();
    
    if ('Notification' in window) {
        notificationPermission = Notification.permission;
        
        if (notificationPermission === 'default' && notificationsEnabled) {
            await requestNotificationPermission();
        }
    }
    
    return notificationsEnabled && notificationPermission === 'granted';
}

/**
 * Requests notification permission
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Enables or disables notifications
 */
async function setNotificationsEnabled(enabled) {
    if (enabled && notificationPermission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
            return false;
        }
    }
    
    notificationsEnabled = enabled;
    saveNotificationPreference(enabled);
    return true;
}

/**
 * Checks if notifications are enabled
 */
function areNotificationsEnabled() {
    return notificationsEnabled && notificationPermission === 'granted';
}

/**
 * Shows a browser notification
 */
function showBrowserNotification(title, options = {}) {
    if (!areNotificationsEnabled()) {
        return null;
    }

    try {
        const notification = new Notification(title, {
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-72.svg',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        setTimeout(() => notification.close(), 10000);
        return notification;
    } catch (error) {
        console.error('Error showing notification:', error);
        return null;
    }
}

/**
 * Shows timer completion notification
 */
function showTimerCompleteNotification(timerName) {
    showBrowserNotification('⏰ Time\'s Up!', {
        body: `Countdown for "${timerName}" is complete!`,
        tag: `timer-complete-${timerName}`,
        renotify: true
    });
}

/**
 * Shows timer warning notification
 */
function showTimerWarningNotification(timerName, minutesLeft) {
    showBrowserNotification('⚠️ Timer Alert', {
        body: `"${timerName}" has ${minutesLeft} minute(s) remaining!`,
        tag: `timer-warning-${timerName}`,
        renotify: true
    });
}

/**
 * Plays alert sound
 */
function playAlertSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = ALERT_SOUND.frequency;
        oscillator.type = ALERT_SOUND.type;

        gainNode.gain.setValueAtTime(ALERT_SOUND.volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + ALERT_SOUND.duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + ALERT_SOUND.duration);
    } catch (e) {
        console.log('Audio not supported or blocked');
    }
}

// ============================================
// TIMER CLASS
// ============================================

class Timer {
    constructor(name, targetDate, targetTime, alertBefore = 0) {
        this.id = generateId();
        this.name = name || 'Unnamed Timer';
        this.targetDate = targetDate;
        this.targetTime = targetTime;
        this.alertBefore = alertBefore;
        this.isExpired = false;
        this.isPaused = false;
        this.alertShown = false;
        this.createdAt = new Date().toISOString();
        this.initialDuration = null;
        this.pausedTimeRemaining = null;
    }

    getTargetDateTime() {
        return new Date(`${this.targetDate}T${this.targetTime}`);
    }

    calculateTimeRemaining() {
        if (this.isPaused && this.pausedTimeRemaining) {
            return this.pausedTimeRemaining;
        }

        const now = new Date();
        const target = this.getTargetDateTime();
        const difference = target - now;

        return msToTimeComponents(difference);
    }

    calculateProgress() {
        if (this.isPaused && this.pausedTimeRemaining) {
            if (!this.initialDuration) {
                const target = this.getTargetDateTime();
                const created = new Date(this.createdAt);
                this.initialDuration = Math.floor((target - created) / TIME.SECOND);
            }
            if (this.initialDuration <= 0) return 0;
            const elapsed = this.initialDuration - this.pausedTimeRemaining.totalSeconds;
            return Math.max(0, Math.min(100, (elapsed / this.initialDuration) * 100));
        }

        if (!this.initialDuration) {
            const target = this.getTargetDateTime();
            const created = new Date(this.createdAt);
            this.initialDuration = Math.floor((target - created) / TIME.SECOND);
        }

        const timeRemaining = this.calculateTimeRemaining();
        if (this.initialDuration <= 0) return 0;
        
        const elapsed = this.initialDuration - timeRemaining.totalSeconds;
        return Math.max(0, Math.min(100, (elapsed / this.initialDuration) * 100));
    }

    formatTime(value) {
        return padZero(value);
    }

    pause() {
        this.pausedTimeRemaining = this.calculateTimeRemaining();
        this.isPaused = true;
    }

    resume() {
        if (this.pausedTimeRemaining && !this.pausedTimeRemaining.expired) {
            const now = new Date();
            const remainingMs = 
                (this.pausedTimeRemaining.days * TIME.DAY) +
                (this.pausedTimeRemaining.hours * TIME.HOUR) +
                (this.pausedTimeRemaining.minutes * TIME.MINUTE) +
                (this.pausedTimeRemaining.seconds * TIME.SECOND);
            
            const newTarget = new Date(now.getTime() + remainingMs);
            this.targetDate = newTarget.toISOString().split('T')[0];
            
            const hours = padZero(newTarget.getHours());
            const minutes = padZero(newTarget.getMinutes());
            const seconds = padZero(newTarget.getSeconds());
            this.targetTime = `${hours}:${minutes}:${seconds}`;
            
            this.createdAt = now.toISOString();
            this.initialDuration = null;
        }
        
        this.pausedTimeRemaining = null;
        this.isPaused = false;
    }

    getFormattedTarget() {
        return formatDateTime(this.getTargetDateTime());
    }

    update(name, targetDate, targetTime, alertBefore) {
        this.name = name || this.name;
        this.targetDate = targetDate || this.targetDate;
        this.targetTime = targetTime || this.targetTime;
        this.alertBefore = alertBefore !== undefined ? alertBefore : this.alertBefore;
        this.alertShown = false;
        this.initialDuration = null;
        this.isExpired = false;
        this.createdAt = new Date().toISOString();
        this.pausedTimeRemaining = null;
        this.isPaused = false;
    }

    markExpired() {
        this.isExpired = true;
    }

    shouldShowAlert() {
        if (this.alertShown || this.alertBefore === 0) return false;
        
        const timeRemaining = this.calculateTimeRemaining();
        if (timeRemaining.expired) return false;
        
        const totalMinutes = Math.floor(timeRemaining.totalSeconds / 60);
        return totalMinutes <= this.alertBefore;
    }

    markAlertShown() {
        this.alertShown = true;
    }

    static fromJSON(data) {
        const timer = new Timer(
            data.name,
            data.targetDate,
            data.targetTime,
            data.alertBefore || 0
        );
        timer.id = data.id;
        timer.createdAt = data.createdAt || new Date().toISOString();
        timer.isPaused = data.isPaused || false;
        timer.pausedTimeRemaining = data.pausedTimeRemaining || null;
        return timer;
    }
}

// ============================================
// UI FUNCTIONS
// ============================================

let elements = {};

/**
 * Initializes UI element references
 */
function initUI() {
    elements = {
        timersContainer: document.getElementById('timersContainer'),
        emptyState: document.getElementById('emptyState'),
        controlsBar: document.getElementById('controlsBar'),
        toastContainer: document.getElementById('toastContainer'),
        alertModal: document.getElementById('alertModal'),
        modalBody: document.querySelector('.modal-body'),
        sortSelect: document.getElementById('sortSelect'),
        filterSelect: document.getElementById('filterSelect'),
        sortFilterMenu: document.getElementById('sortFilterMenu'),
        timerName: document.getElementById('timerName'),
        targetDate: document.getElementById('targetDate'),
        targetTime: document.getElementById('targetTime'),
        alertBefore: document.getElementById('alertBefore'),
        themeToggle: document.getElementById('themeToggle'),
        moonIcon: document.getElementById('moonIcon'),
        sunIcon: document.getElementById('sunIcon'),
        notificationToggle: document.getElementById('notificationToggle')
    };

    if (elements.targetDate) {
        elements.targetDate.setAttribute('min', getTodayDateString());
    }
}

/**
 * Shows a toast notification
 */
function showToast(message, type = TOAST_TYPES.SUCCESS, duration = TOAST_DURATION) {
    const container = elements.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const icon = type === TOAST_TYPES.SUCCESS ? '✅' : type === TOAST_TYPES.ERROR ? '❌' : '⚠️';
    const title = type === TOAST_TYPES.SUCCESS ? 'Success' : type === TOAST_TYPES.ERROR ? 'Error' : 'Warning';

    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-title">${icon} ${title}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" aria-label="Close notification">×</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    container.appendChild(toast);

    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

/**
 * Removes a toast with animation
 */
function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    if (!prefersReducedMotion()) {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    } else {
        toast.remove();
    }
}

/**
 * Renders timers to the DOM
 */
function renderTimersUI(timersToRender, callbacks) {
    const container = elements.timersContainer;
    const emptyState = elements.emptyState;
    const controlsBar = elements.controlsBar;

    if (!container) return;

    if (timersToRender.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (controlsBar) controlsBar.style.display = timers.length > 0 ? 'flex' : 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (controlsBar) controlsBar.style.display = 'flex';

    container.innerHTML = '';

    timersToRender.forEach(timer => {
        const card = createTimerCard(timer);
        container.appendChild(card);
    });

    setupTimerEventDelegation(container, callbacks);
}

/**
 * Creates a timer card element
 */
function createTimerCard(timer) {
    const timeRemaining = timer.calculateTimeRemaining();
    const progress = timer.calculateProgress();
    const isExpired = timeRemaining.expired;
    const finalProgress = isExpired ? 100 : Math.round(progress);

    const card = document.createElement('article');
    card.className = `timer-card ${isExpired ? 'expired' : 'running'}`;
    card.setAttribute('data-timer-id', timer.id);
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `Timer: ${timer.name}`);

    card.innerHTML = `
        <div class="timer-header">
            <h2 class="timer-name">${escapeHtml(timer.name)}</h2>
            <button 
                class="delete-btn" 
                data-action="delete" 
                data-timer-id="${timer.id}"
                aria-label="Delete timer ${escapeHtml(timer.name)}"
                title="Delete timer"
            >×</button>
        </div>
        ${isExpired ? '<div class="timer-completed-badge" role="status">✓ Completed</div>' : ''}
        <div class="timer-display ${isExpired ? 'expired-display' : ''}" aria-live="polite" aria-atomic="true">
            <div class="time-unit time-days">
                <div class="time-value" aria-label="Days">${timer.formatTime(timeRemaining.days)}</div>
                <div class="time-label">Days</div>
            </div>
            <div class="time-unit time-hours">
                <div class="time-value" aria-label="Hours">${timer.formatTime(timeRemaining.hours)}</div>
                <div class="time-label">Hours</div>
            </div>
            <div class="time-unit time-minutes">
                <div class="time-value" aria-label="Minutes">${timer.formatTime(timeRemaining.minutes)}</div>
                <div class="time-label">Minutes</div>
            </div>
            <div class="time-unit time-seconds">
                <div class="time-value" aria-label="Seconds">${timer.formatTime(timeRemaining.seconds)}</div>
                <div class="time-label">Seconds</div>
            </div>
        </div>
        <div class="timer-progress">
            <div class="progress-label" aria-hidden="true">${isExpired ? 'Completed' : `Progress: ${finalProgress}%`}</div>
            <div 
                class="progress-bar-container ${isExpired ? 'expired-progress' : ''}"
                role="progressbar"
                aria-valuenow="${finalProgress}"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Timer progress"
            >
                <div class="progress-bar ${isExpired ? 'expired-progress-bar' : ''}" style="width: ${finalProgress}%"></div>
            </div>
        </div>
        <div class="timer-target ${isExpired ? 'expired-target' : ''}">
            ${isExpired ? '✓ ' : ''}Target: ${timer.getFormattedTarget()}
        </div>
        ${!isExpired ? `
        <div class="timer-actions">
            <button 
                class="btn btn-edit" 
                data-action="edit" 
                data-timer-id="${timer.id}"
                aria-label="Edit timer ${escapeHtml(timer.name)}"
            >
                ✏️ Edit
            </button>
            ${timer.isPaused 
                ? `<button class="btn btn-primary" data-action="resume" data-timer-id="${timer.id}" aria-label="Resume timer">▶️ Resume</button>`
                : `<button class="btn btn-pause" data-action="pause" data-timer-id="${timer.id}" aria-label="Pause timer">⏸️ Pause</button>`
            }
        </div>
        ` : ''}
    `;

    return card;
}

/**
 * Flag to track if global timer event delegation is set up
 */
let isTimerEventDelegationSetup = false;

/**
 * Sets up global event delegation for timer actions (called once)
 */
function setupGlobalTimerEventDelegation() {
    if (isTimerEventDelegationSetup) return;

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        // Ensure the button is inside timers container
        const container = document.getElementById('timersContainer');
        if (!container || !container.contains(btn)) return;

        const action = btn.dataset.action;
        const timerId = btn.dataset.timerId;

        if (!timerId) return;

        switch (action) {
            case 'delete':
                deleteTimer(timerId);
                break;
            case 'edit':
                editTimer(timerId);
                break;
            case 'pause':
                pauseTimer(timerId);
                break;
            case 'resume':
                resumeTimer(timerId);
                break;
        }
    });

    isTimerEventDelegationSetup = true;
}

/**
 * Sets up event delegation for timer actions (legacy, now calls global setup)
 */
function setupTimerEventDelegation(container, callbacks) {
    // Use global event delegation instead
    setupGlobalTimerEventDelegation();
}

/**
 * Updates a single timer card display
 */
function updateTimerDisplay(timer) {
    const card = document.querySelector(`[data-timer-id="${timer.id}"]`);
    if (!card) return;

    const timeRemaining = timer.calculateTimeRemaining();

    const daysEl = card.querySelector('.time-days .time-value');
    const hoursEl = card.querySelector('.time-hours .time-value');
    const minutesEl = card.querySelector('.time-minutes .time-value');
    const secondsEl = card.querySelector('.time-seconds .time-value');
    const progressBar = card.querySelector('.progress-bar');
    const progressLabel = card.querySelector('.progress-label');
    const progressContainer = card.querySelector('.progress-bar-container');

    if (daysEl) daysEl.textContent = timer.formatTime(timeRemaining.days);
    if (hoursEl) hoursEl.textContent = timer.formatTime(timeRemaining.hours);
    if (minutesEl) minutesEl.textContent = timer.formatTime(timeRemaining.minutes);
    if (secondsEl) secondsEl.textContent = timer.formatTime(timeRemaining.seconds);

    if (!timeRemaining.expired) {
        const progress = timer.calculateProgress();
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressLabel) progressLabel.textContent = `Progress: ${Math.round(progress)}%`;
        if (progressContainer) progressContainer.setAttribute('aria-valuenow', Math.round(progress));
    }

    if (timeRemaining.expired && !card.classList.contains('expired')) {
        card.classList.add('expired');
        card.classList.remove('running');
        if (progressBar) progressBar.style.width = '100%';
        if (progressContainer) progressContainer.setAttribute('aria-valuenow', 100);
    }
}

/**
 * Shows the alert modal
 */
function showAlertModal(timerName, onClose) {
    const modal = elements.alertModal;
    const modalBody = elements.modalBody;
    
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <h2 id="modalTitle">🎉 Time's Up!</h2>
        <p>Countdown for "${escapeHtml(timerName)}" is complete!</p>
        <button id="closeAlertBtn" class="btn btn-primary" autofocus>OK</button>
    `;

    modal.classList.add('show');
    
    document.getElementById('closeAlertBtn')?.addEventListener('click', () => {
        closeModal();
        onClose?.();
    });
}

/**
 * Shows the edit timer modal
 */
function showEditModal(timer, onSave) {
    const modal = elements.alertModal;
    const modalBody = elements.modalBody;
    
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <h2 id="modalTitle">✏️ Edit Timer</h2>
        <form class="edit-form" id="editForm" novalidate>
            <div class="form-group">
                <label for="editName">Timer Name</label>
                <input type="text" id="editName" value="${escapeHtml(timer.name)}" maxlength="50" required>
            </div>
            <div class="form-group">
                <label for="editDate">Target Date</label>
                <input type="date" id="editDate" value="${timer.targetDate}" required min="${getTodayDateString()}">
            </div>
            <div class="form-group">
                <label for="editTime">Target Time</label>
                <input type="time" id="editTime" value="${timer.targetTime}" required>
            </div>
            <div class="form-group">
                <label for="editAlertBefore">Alert Before</label>
                <select id="editAlertBefore" class="form-select">
                    <option value="0" ${timer.alertBefore === 0 ? 'selected' : ''}>Only when finished</option>
                    <option value="60" ${timer.alertBefore === 60 ? 'selected' : ''}>1 hour before</option>
                    <option value="30" ${timer.alertBefore === 30 ? 'selected' : ''}>30 minutes before</option>
                    <option value="10" ${timer.alertBefore === 10 ? 'selected' : ''}>10 minutes before</option>
                    <option value="5" ${timer.alertBefore === 5 ? 'selected' : ''}>5 minutes before</option>
                    <option value="1" ${timer.alertBefore === 1 ? 'selected' : ''}>1 minute before</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Save</button>
                <button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>
            </div>
        </form>
    `;

    modal.classList.add('show');

    const form = document.getElementById('editForm');
    const cancelBtn = document.getElementById('cancelEditBtn');

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('editName').value.trim() || 'Unnamed Timer',
            targetDate: document.getElementById('editDate').value,
            targetTime: document.getElementById('editTime').value,
            alertBefore: parseInt(document.getElementById('editAlertBefore').value)
        };

        if (!data.targetDate || !data.targetTime) {
            showToast('Please select date and time!', TOAST_TYPES.ERROR);
            return;
        }

        const targetDateTime = new Date(`${data.targetDate}T${data.targetTime}`);
        if (targetDateTime <= new Date()) {
            showToast('Please select a future date and time!', TOAST_TYPES.ERROR);
            return;
        }

        closeModal();
        onSave?.(data);
    });

    cancelBtn?.addEventListener('click', closeModal);
}

/**
 * Closes the modal
 */
function closeModal() {
    const modal = elements.alertModal;
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Updates theme icons
 */
function updateThemeIcon(isDark) {
    if (elements.moonIcon && elements.sunIcon) {
        elements.moonIcon.style.display = isDark ? 'none' : 'block';
        elements.sunIcon.style.display = isDark ? 'block' : 'none';
    }
}

/**
 * Updates notification toggle button
 */
function updateNotificationToggle(enabled) {
    const toggle = elements.notificationToggle;
    if (toggle) {
        toggle.setAttribute('aria-pressed', enabled);
        toggle.classList.toggle('active', enabled);
    }
}

/**
 * Gets form values
 */
function getFormValues() {
    return {
        name: elements.timerName?.value.trim() || 'Unnamed Timer',
        targetDate: elements.targetDate?.value,
        targetTime: elements.targetTime?.value,
        alertBefore: parseInt(elements.alertBefore?.value) || 0
    };
}

/**
 * Resets the form
 */
function resetForm() {
    if (elements.timerName) elements.timerName.value = '';
    if (elements.targetDate) elements.targetDate.value = '';
    if (elements.targetTime) elements.targetTime.value = '';
    if (elements.alertBefore) elements.alertBefore.value = '0';
}

/**
 * Toggles sort/filter menu
 */
function toggleSortFilterMenu(show) {
    const menu = elements.sortFilterMenu;
    if (menu) {
        menu.style.display = show ? 'grid' : 'none';
    }
}

// ============================================
// APPLICATION STATE
// ============================================

let timers = [];
let globalInterval = null;
let currentSort = SORT_OPTIONS.DATE_ASC;
let currentFilter = FILTER_OPTIONS.ALL;
let sortFilterMenuVisible = false;

// ============================================
// MAIN APPLICATION FUNCTIONS
// ============================================

/**
 * Initializes the application
 */
async function init() {
    initUI();

    await initNotifications();
    updateNotificationToggle(areNotificationsEnabled());

    const savedTheme = loadTheme();
    const systemPrefersDark = prefersDarkMode();
    const isDark = savedTheme || systemPrefersDark;
    
    if (isDark) {
        document.body.classList.add('dark-theme');
    }
    updateThemeIcon(isDark);

    // Setup global timer event delegation before loading timers
    setupGlobalTimerEventDelegation();

    loadTimers();
    setupEventListeners();
    startGlobalInterval();
    registerServiceWorker();
}

/**
 * Loads timers from storage
 */
function loadTimers() {
    const savedData = loadTimersData();
    if (!savedData) return;

    try {
        timers = savedData.map(data => Timer.fromJSON(data));
        renderTimersList();
    } catch (e) {
        console.error('Error loading timers:', e);
        showToast('Error loading timers', TOAST_TYPES.ERROR);
    }
}

/**
 * Starts the global interval
 */
function startGlobalInterval() {
    if (globalInterval) {
        clearInterval(globalInterval);
    }

    globalInterval = setInterval(() => {
        timers.forEach(timer => {
            if (timer.isPaused || timer.isExpired) return;

            updateTimerDisplay(timer);

            const timeRemaining = timer.calculateTimeRemaining();

            if (timer.shouldShowAlert()) {
                timer.markAlertShown();
                showToast(`"${timer.name}" has ${timer.alertBefore} minutes remaining!`, TOAST_TYPES.WARNING);
                showTimerWarningNotification(timer.name, timer.alertBefore);
                playAlertSound();
            }

            if (timeRemaining.expired && !timer.isExpired) {
                handleTimerExpiration(timer);
            }
        });
    }, UPDATE_INTERVAL);
}

/**
 * Handles timer expiration
 */
function handleTimerExpiration(timer) {
    timer.markExpired();
    saveTimers(timers);

    showAlertModal(timer.name, () => {});
    showTimerCompleteNotification(timer.name);
    playAlertSound();

    setTimeout(() => {
        renderTimersList();
    }, 500);
}

/**
 * Renders the timer list
 */
function renderTimersList() {
    const displayTimers = getFilteredAndSortedTimers();
    
    renderTimersUI(displayTimers, {
        onDelete: deleteTimer,
        onEdit: editTimer,
        onPause: pauseTimer,
        onResume: resumeTimer
    });

    if (elements.controlsBar) {
        elements.controlsBar.style.display = timers.length > 0 ? 'flex' : 'none';
    }
}

/**
 * Gets filtered and sorted timers
 */
function getFilteredAndSortedTimers() {
    let filtered = [...timers];

    if (currentFilter === FILTER_OPTIONS.ACTIVE) {
        filtered = filtered.filter(t => !t.isExpired && !t.calculateTimeRemaining().expired);
    } else if (currentFilter === FILTER_OPTIONS.EXPIRED) {
        filtered = filtered.filter(t => t.isExpired || t.calculateTimeRemaining().expired);
    }

    filtered.sort((a, b) => {
        const aExpired = a.isExpired || a.calculateTimeRemaining().expired;
        const bExpired = b.isExpired || b.calculateTimeRemaining().expired;

        if (aExpired && !bExpired) return 1;
        if (!aExpired && bExpired) return -1;

        switch (currentSort) {
            case SORT_OPTIONS.DATE_ASC:
                return a.getTargetDateTime() - b.getTargetDateTime();
            case SORT_OPTIONS.DATE_DESC:
                return b.getTargetDateTime() - a.getTargetDateTime();
            case SORT_OPTIONS.NAME_ASC:
                return a.name.localeCompare(b.name, 'en');
            case SORT_OPTIONS.NAME_DESC:
                return b.name.localeCompare(a.name, 'en');
            default:
                return 0;
        }
    });

    return filtered;
}

/**
 * Adds a new timer
 */
function addTimer(name, targetDate, targetTime, alertBefore = 0) {
    const timer = new Timer(name, targetDate, targetTime, alertBefore);
    timers.push(timer);
    saveTimers(timers);
    renderTimersList();
    showToast(`"${name}" added`, TOAST_TYPES.SUCCESS);
}

/**
 * Deletes a timer
 */
function deleteTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    if (!confirm(`Are you sure you want to delete "${timer.name}"?`)) {
        return;
    }

    timers = timers.filter(t => t.id !== id);
    saveTimers(timers);
    renderTimersList();
    showToast(`"${timer.name}" deleted`, TOAST_TYPES.SUCCESS);
}

/**
 * Edits a timer
 */
function editTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    showEditModal(timer, (data) => {
        timer.update(data.name, data.targetDate, data.targetTime, data.alertBefore);
        saveTimers(timers);
        renderTimersList();
        showToast(`"${data.name}" updated`, TOAST_TYPES.SUCCESS);
    });
}

/**
 * Pauses a timer
 */
function pauseTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    const timeRemaining = timer.calculateTimeRemaining();
    if (timeRemaining.expired) {
        showToast('Expired timers cannot be paused', TOAST_TYPES.WARNING);
        return;
    }

    timer.pause();
    saveTimers(timers);
    renderTimersList();
    showToast(`"${timer.name}" paused`, TOAST_TYPES.SUCCESS);
}

/**
 * Resumes a timer
 */
function resumeTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    const timeRemaining = timer.calculateTimeRemaining();
    if (timeRemaining.expired) {
        showToast('Expired timers cannot be resumed', TOAST_TYPES.WARNING);
        return;
    }

    timer.resume();
    saveTimers(timers);
    renderTimersList();
    showToast(`"${timer.name}" resumed`, TOAST_TYPES.SUCCESS);
}

/**
 * Handles form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const { name, targetDate, targetTime, alertBefore } = getFormValues();

    if (!targetDate || !targetTime) {
        showToast('Please select date and time!', TOAST_TYPES.ERROR);
        return;
    }

    const targetDateTime = new Date(`${targetDate}T${targetTime}`);
    if (targetDateTime <= new Date()) {
        showToast('Please select a future date and time!', TOAST_TYPES.ERROR);
        return;
    }

    addTimer(name, targetDate, targetTime, alertBefore);
    resetForm();
}

/**
 * Toggles theme
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    saveTheme(isDark);
    updateThemeIcon(isDark);
}

/**
 * Toggles notifications
 */
async function toggleNotifications() {
    const currentlyEnabled = areNotificationsEnabled();
    const success = await setNotificationsEnabled(!currentlyEnabled);
    
    if (success) {
        updateNotificationToggle(!currentlyEnabled);
        showToast(
            !currentlyEnabled ? 'Notifications enabled' : 'Notifications disabled',
            TOAST_TYPES.SUCCESS
        );
    } else {
        showToast('Could not enable notifications. Please check browser permissions.', TOAST_TYPES.ERROR);
    }
}

/**
 * Exports timers
 */
function handleExport() {
    if (timers.length === 0) {
        showToast('No timers to export', TOAST_TYPES.WARNING);
        return;
    }
    exportTimersToFile(timers);
    showToast('Timers exported', TOAST_TYPES.SUCCESS);
}

/**
 * Handles file import
 */
async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const imported = await importTimersFromFile(file);
        let addedCount = 0;

        imported.forEach(item => {
            if (item.name && item.targetDate && item.targetTime) {
                const targetDateTime = new Date(`${item.targetDate}T${item.targetTime}`);
                if (targetDateTime > new Date()) {
                    addTimer(item.name, item.targetDate, item.targetTime, item.alertBefore || 0);
                    addedCount++;
                }
            }
        });

        showToast(`${addedCount} timer(s) imported`, TOAST_TYPES.SUCCESS);
    } catch (error) {
        showToast('Failed to import: ' + error.message, TOAST_TYPES.ERROR);
    }

    e.target.value = '';
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
    // Form submission
    document.getElementById('timerForm')?.addEventListener('submit', handleFormSubmit);

    // Modal close
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    elements.alertModal?.addEventListener('click', (e) => {
        if (e.target.id === 'alertModal') closeModal();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            if (sortFilterMenuVisible) {
                toggleSortFilterMenu(false);
                sortFilterMenuVisible = false;
            }
        }
    });

    // Sort/Filter
    elements.sortSelect?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTimersList();
    });

    elements.filterSelect?.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderTimersList();
    });

    // Sort/Filter menu toggle
    document.getElementById('sortBtn')?.addEventListener('click', () => {
        sortFilterMenuVisible = !sortFilterMenuVisible;
        toggleSortFilterMenu(sortFilterMenuVisible);
    });

    document.getElementById('filterBtn')?.addEventListener('click', () => {
        sortFilterMenuVisible = !sortFilterMenuVisible;
        toggleSortFilterMenu(sortFilterMenuVisible);
    });

    // Export/Import
    document.getElementById('exportBtn')?.addEventListener('click', handleExport);
    document.getElementById('importBtn')?.addEventListener('click', () => {
        document.getElementById('importInput')?.click();
    });
    document.getElementById('importInput')?.addEventListener('change', handleImport);

    // Theme toggle
    elements.themeToggle?.addEventListener('click', toggleTheme);

    // Notification toggle
    document.getElementById('notificationToggle')?.addEventListener('click', toggleNotifications);

    // Visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            renderTimersList();
        }
    });

    // Save on beforeunload
    window.addEventListener('beforeunload', () => {
        saveTimers(timers);
    });
}

/**
 * Registers service worker
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('ServiceWorker registered:', registration.scope);
        } catch (error) {
            console.log('ServiceWorker registration failed:', error);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

