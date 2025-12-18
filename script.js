// Timer Management
class CountdownTimer {
    constructor(name, targetDate, targetTime, alertBefore = 0) {
        this.id = Date.now() + Math.random();
        this.name = name || 'Unnamed Timer';
        this.targetDate = targetDate;
        this.targetTime = targetTime;
        this.alertBefore = alertBefore; // minutes before target
        this.intervalId = null;
        this.isExpired = false;
        this.isPaused = false;
        this.alertShown = false;
        this.createdAt = new Date().toISOString();
        this.initialDuration = null;
        this.pausedTimeRemaining = null; // Store remaining time when paused
    }

    getTargetDateTime() {
        const dateStr = this.targetDate;
        const timeStr = this.targetTime;
        return new Date(`${dateStr}T${timeStr}`);
    }

    calculateTimeRemaining() {
        // If paused, return the saved remaining time
        if (this.isPaused && this.pausedTimeRemaining) {
            return this.pausedTimeRemaining;
        }

        const now = new Date();
        const target = this.getTargetDateTime();
        const difference = target - now;

        if (difference <= 0) {
            return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                expired: true,
                totalSeconds: 0
            };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        const totalSeconds = Math.floor(difference / 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            expired: false,
            totalSeconds
        };
    }

    calculateProgress() {
        // If paused, calculate progress based on paused remaining time
        if (this.isPaused && this.pausedTimeRemaining) {
            if (!this.initialDuration) {
                const target = this.getTargetDateTime();
                const created = new Date(this.createdAt);
                this.initialDuration = Math.floor((target - created) / 1000);
            }
            if (this.initialDuration <= 0) return 0;
            const elapsed = this.initialDuration - this.pausedTimeRemaining.totalSeconds;
            return Math.max(0, Math.min(100, (elapsed / this.initialDuration) * 100));
        }

        if (!this.initialDuration) {
            const target = this.getTargetDateTime();
            const created = new Date(this.createdAt);
            this.initialDuration = Math.floor((target - created) / 1000);
        }

        const timeRemaining = this.calculateTimeRemaining();
        if (this.initialDuration <= 0) return 0;
        
        const elapsed = this.initialDuration - timeRemaining.totalSeconds;
        return Math.max(0, Math.min(100, (elapsed / this.initialDuration) * 100));
    }

    formatTime(value) {
        return value.toString().padStart(2, '0');
    }

    start() {
        if (this.isPaused) return;
        // Stop any existing interval first to prevent duplicates
        this.stop();
        this.updateDisplay();
        this.intervalId = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    pause() {
        // Save current remaining time before pausing
        this.pausedTimeRemaining = this.calculateTimeRemaining();
        this.isPaused = true;
        this.stop();
    }

    resume() {
        // Calculate new target date based on saved remaining time
        if (this.pausedTimeRemaining && !this.pausedTimeRemaining.expired) {
            const now = new Date();
            const remainingMs = 
                (this.pausedTimeRemaining.days * 24 * 60 * 60 * 1000) +
                (this.pausedTimeRemaining.hours * 60 * 60 * 1000) +
                (this.pausedTimeRemaining.minutes * 60 * 1000) +
                (this.pausedTimeRemaining.seconds * 1000);
            
            const newTarget = new Date(now.getTime() + remainingMs);
            this.targetDate = newTarget.toISOString().split('T')[0];
            
            // Include seconds in target time (HH:MM:SS format)
            const hours = String(newTarget.getHours()).padStart(2, '0');
            const minutes = String(newTarget.getMinutes()).padStart(2, '0');
            const seconds = String(newTarget.getSeconds()).padStart(2, '0');
            this.targetTime = `${hours}:${minutes}:${seconds}`;
            
            // Reset initial duration for progress calculation
            this.createdAt = now.toISOString();
            this.initialDuration = null;
        }
        
        this.pausedTimeRemaining = null;
        this.isPaused = false;
        this.start();
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateDisplay() {
        if (this.isPaused) return;

        const timeRemaining = this.calculateTimeRemaining();
        const cardElement = document.querySelector(`[data-timer-id="${this.id}"]`);

        if (!cardElement) return;

        const daysEl = cardElement.querySelector('.time-days .time-value');
        const hoursEl = cardElement.querySelector('.time-hours .time-value');
        const minutesEl = cardElement.querySelector('.time-minutes .time-value');
        const secondsEl = cardElement.querySelector('.time-seconds .time-value');
        const progressBar = cardElement.querySelector('.progress-bar');
        const progressLabel = cardElement.querySelector('.progress-label');

        if (daysEl) daysEl.textContent = this.formatTime(timeRemaining.days);
        if (hoursEl) hoursEl.textContent = this.formatTime(timeRemaining.hours);
        if (minutesEl) minutesEl.textContent = this.formatTime(timeRemaining.minutes);
        if (secondsEl) secondsEl.textContent = this.formatTime(timeRemaining.seconds);

        // Update progress bar
        if (progressBar && !timeRemaining.expired) {
            const progress = this.calculateProgress();
            progressBar.style.width = `${progress}%`;
        }

        if (progressLabel && !timeRemaining.expired) {
            const progress = this.calculateProgress();
            progressLabel.textContent = `Progress: ${Math.round(progress)}%`;
        }

        // Check for alert before expiration
        if (!this.alertShown && this.alertBefore > 0 && !timeRemaining.expired) {
            const totalMinutes = Math.floor(timeRemaining.totalSeconds / 60);
            if (totalMinutes <= this.alertBefore) {
                this.alertShown = true;
                showToast(`"${this.name}" has ${this.alertBefore} minutes remaining!`, 'warning');
                playAlertSound();
            }
        }

        if (timeRemaining.expired && !this.isExpired) {
            this.isExpired = true;
            this.handleExpiration();
        }

        if (timeRemaining.expired) {
            cardElement.classList.add('expired');
            cardElement.classList.remove('running');
            if (progressBar) progressBar.style.width = '100%';
        } else {
            cardElement.classList.add('running');
            cardElement.classList.remove('expired');
        }
    }

    handleExpiration() {
        this.stop();
        showAlert(this.name);
        playAlertSound();
        // Re-render to move expired timer to the end
        setTimeout(() => {
            renderTimers();
            startAllTimers();
        }, 500);
    }

    getFormattedTarget() {
        const target = this.getTargetDateTime();
        return target.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
        // Restart timer if it was paused or stopped
        if (this.isPaused) {
            this.isPaused = false;
        }
        this.stop();
        this.start();
    }
}

// Timer Storage
let timers = [];
let currentSort = 'date-asc';
let currentFilter = 'all';

function loadTimers() {
    const saved = localStorage.getItem('countdownTimers');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            timers = parsed.map(t => {
                const timer = new CountdownTimer(
                    t.name,
                    t.targetDate,
                    t.targetTime,
                    t.alertBefore || 0
                );
                timer.id = t.id;
                timer.createdAt = t.createdAt || new Date().toISOString();
                timer.isPaused = t.isPaused || false;
                timer.pausedTimeRemaining = t.pausedTimeRemaining || null;
                return timer;
            });
            renderTimers();
            startAllTimers();
        } catch (e) {
            console.error('Error loading timers:', e);
            showToast('Error loading timers', 'error');
        }
    }
}

function saveTimers() {
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
    localStorage.setItem('countdownTimers', JSON.stringify(toSave));
}

// Toast Notification System
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';

    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-title">${icon} ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Warning'}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// UI Functions
function renderTimers() {
    const container = document.getElementById('timersContainer');
    const emptyState = document.getElementById('emptyState');
    const controlsBar = document.getElementById('controlsBar');

    const displayTimers = getFilteredAndSortedTimers();

    if (displayTimers.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        controlsBar.style.display = timers.length > 0 ? 'flex' : 'none';
        return;
    }

    emptyState.style.display = 'none';
    controlsBar.style.display = 'flex';
    container.innerHTML = '';

    displayTimers.forEach(timer => {
        const timeRemaining = timer.calculateTimeRemaining();
        const progress = timer.calculateProgress();
        const card = document.createElement('div');
        card.className = `timer-card ${timeRemaining.expired ? 'expired' : 'running'}`;
        card.setAttribute('data-timer-id', timer.id);

        const isExpired = timeRemaining.expired;
        const finalProgress = isExpired ? 100 : Math.round(progress);

        card.innerHTML = `
            <div class="timer-header">
                <div class="timer-name">${escapeHtml(timer.name)}</div>
                <button class="delete-btn" onclick="deleteTimer(${timer.id})" aria-label="Delete Timer">×</button>
            </div>
            ${isExpired ? '<div class="timer-completed-badge">✓ Completed</div>' : ''}
            <div class="timer-display ${isExpired ? 'expired-display' : ''}">
                <div class="time-unit time-days">
                    <div class="time-value">${timer.formatTime(timeRemaining.days)}</div>
                    <div class="time-label">Days</div>
                </div>
                <div class="time-unit time-hours">
                    <div class="time-value">${timer.formatTime(timeRemaining.hours)}</div>
                    <div class="time-label">Hours</div>
                </div>
                <div class="time-unit time-minutes">
                    <div class="time-value">${timer.formatTime(timeRemaining.minutes)}</div>
                    <div class="time-label">Minutes</div>
                </div>
                <div class="time-unit time-seconds">
                    <div class="time-value">${timer.formatTime(timeRemaining.seconds)}</div>
                    <div class="time-label">Seconds</div>
                </div>
            </div>
            <div class="timer-progress">
                <div class="progress-label">${isExpired ? 'Completed' : `Progress: ${finalProgress}%`}</div>
                <div class="progress-bar-container ${isExpired ? 'expired-progress' : ''}">
                    <div class="progress-bar ${isExpired ? 'expired-progress-bar' : ''}" style="width: ${finalProgress}%"></div>
                </div>
            </div>
            <div class="timer-target ${isExpired ? 'expired-target' : ''}">
                ${isExpired ? '✓ ' : ''}Target: ${timer.getFormattedTarget()}
            </div>
            ${!isExpired ? `
            <div class="timer-actions">
                <button class="btn btn-edit" onclick="editTimer(${timer.id})">
                    ✏️ Edit
                </button>
                ${timer.isPaused 
                    ? `<button class="btn btn-primary" onclick="resumeTimer(${timer.id})">▶️ Resume</button>`
                    : `<button class="btn btn-pause" onclick="pauseTimer(${timer.id})">⏸️ Pause</button>`
                }
            </div>
            ` : ''}
        `;

        container.appendChild(card);
    });
}

function startAllTimers() {
    timers.forEach(timer => {
        if (!timer.isPaused) {
            timer.start();
        }
    });
}

function stopAllTimers() {
    timers.forEach(timer => {
        timer.stop();
    });
}

function pauseTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (timer) {
        const timeRemaining = timer.calculateTimeRemaining();
        if (timeRemaining.expired) {
            showToast('Expired timers cannot be paused', 'warning');
            return;
        }
        // Pause the timer (this will stop its interval and save remaining time)
        timer.pause();
        saveTimers();
        renderTimers();
        showToast(`"${timer.name}" paused`, 'success');
    }
}

function resumeTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (timer) {
        const timeRemaining = timer.calculateTimeRemaining();
        if (timeRemaining.expired) {
            showToast('Expired timers cannot be resumed', 'warning');
            return;
        }
        // Resume the timer (this will start its interval)
        timer.resume();
        saveTimers();
        renderTimers();
        showToast(`"${timer.name}" resumed`, 'success');
    }
}

function deleteTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (timer) {
        timer.stop();
        timers = timers.filter(t => t.id !== id);
        saveTimers();
        renderTimers();
        showToast(`"${timer.name}" deleted`, 'success');
    }
}

function editTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    const modal = document.getElementById('alertModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <h2>✏️ Edit Timer</h2>
        <form class="edit-form" id="editForm">
            <div class="form-group">
                <label for="editName">Timer Name</label>
                <input type="text" id="editName" value="${escapeHtml(timer.name)}" maxlength="50" required>
            </div>
            <div class="form-group">
                <label for="editDate">Target Date</label>
                <input type="date" id="editDate" value="${timer.targetDate}" required>
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
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button type="submit" class="btn btn-primary">Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeAlert()">Cancel</button>
            </div>
        </form>
    `;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('editDate').setAttribute('min', today);

    modal.classList.add('show');

    document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('editName').value.trim() || 'Unnamed Timer';
        const targetDate = document.getElementById('editDate').value;
        const targetTime = document.getElementById('editTime').value;
        const alertBefore = parseInt(document.getElementById('editAlertBefore').value);

        if (!targetDate || !targetTime) {
            showToast('Please select date and time!', 'error');
            return;
        }

        const targetDateTime = new Date(`${targetDate}T${targetTime}`);
        const now = new Date();

        if (targetDateTime <= now) {
            showToast('Please select a future date and time!', 'error');
            return;
        }

        timer.update(name, targetDate, targetTime, alertBefore);
        saveTimers();
        renderTimers();
        closeAlert();
        showToast(`"${name}" updated and restarted`, 'success');
    });
}

function addTimer(name, targetDate, targetTime, alertBefore = 0) {
    const timer = new CountdownTimer(name, targetDate, targetTime, alertBefore);
    timers.push(timer);
    saveTimers();
    renderTimers();
    timer.start();
    showToast(`"${name}" added`, 'success');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sort and Filter Functions
function getFilteredAndSortedTimers() {
    // Filter
    let filtered = [...timers];
    if (currentFilter === 'active') {
        filtered = filtered.filter(t => !t.isExpired);
    } else if (currentFilter === 'expired') {
        filtered = filtered.filter(t => t.isExpired);
    }

    // Sort - Expired timers always go to the end
    filtered.sort((a, b) => {
        const aExpired = a.calculateTimeRemaining().expired;
        const bExpired = b.calculateTimeRemaining().expired;
        
        // Send expired timers to the end
        if (aExpired && !bExpired) return 1;
        if (!aExpired && bExpired) return -1;
        
        // If both expired or both active, do normal sorting
        if (currentSort === 'date-asc') {
            return a.getTargetDateTime() - b.getTargetDateTime();
        } else if (currentSort === 'date-desc') {
            return b.getTargetDateTime() - a.getTargetDateTime();
        } else if (currentSort === 'name-asc') {
            return a.name.localeCompare(b.name, 'en');
        } else if (currentSort === 'name-desc') {
            return b.name.localeCompare(a.name, 'en');
        }
        return 0;
    });

    return filtered;
}

function handleSortChange() {
    currentSort = document.getElementById('sortSelect').value;
    renderTimers();
}

function handleFilterChange() {
    currentFilter = document.getElementById('filterSelect').value;
    renderTimers();
}

// Export/Import Functions
function exportTimers() {
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
    showToast('Timers exported', 'success');
}

function importTimers(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                throw new Error('Invalid file format');
            }

            imported.forEach(item => {
                if (item.name && item.targetDate && item.targetTime) {
                    const targetDateTime = new Date(`${item.targetDate}T${item.targetTime}`);
                    const now = new Date();
                    if (targetDateTime > now) {
                        addTimer(
                            item.name,
                            item.targetDate,
                            item.targetTime,
                            item.alertBefore || 0
                        );
                    }
                }
            });

            showToast(`${imported.length} timer(s) imported`, 'success');
        } catch (error) {
            showToast('File could not be read: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDark);
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    if (moonIcon && sunIcon) {
        if (isDark) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }
}

function loadTheme() {
    const isDark = localStorage.getItem('darkTheme') === 'true';
    if (isDark) {
        document.body.classList.add('dark-theme');
    }
    updateThemeIcon(isDark);
}

// Alert Functions
function showAlert(timerName) {
    const modal = document.getElementById('alertModal');
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <h2>🎉 Time's Up!</h2>
        <p>Countdown for "${escapeHtml(timerName)}" is complete!</p>
        <button id="closeAlertBtn" class="btn btn-primary">OK</button>
    `;
    modal.classList.add('show');
    
    document.getElementById('closeAlertBtn').addEventListener('click', closeAlert);
}

function closeAlert() {
    const modal = document.getElementById('alertModal');
    modal.classList.remove('show');
}

function playAlertSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported or blocked');
    }
}

// Form Handling
function handleFormSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('timerName');
    const dateInput = document.getElementById('targetDate');
    const timeInput = document.getElementById('targetTime');
    const alertBeforeInput = document.getElementById('alertBefore');

    const name = nameInput.value.trim() || 'Unnamed Timer';
    const targetDate = dateInput.value;
    const targetTime = timeInput.value;
    const alertBefore = parseInt(alertBeforeInput.value) || 0;

    if (!targetDate || !targetTime) {
        showToast('Please select date and time!', 'error');
        return;
    }

    const targetDateTime = new Date(`${targetDate}T${timeInput.value}`);
    const now = new Date();

    if (targetDateTime <= now) {
        showToast('Please select a future date and time!', 'error');
        return;
    }

    addTimer(name, targetDate, targetTime, alertBefore);

    // Reset form
    nameInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    alertBeforeInput.value = '0';
}

// Initialize
function init() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('targetDate').setAttribute('min', today);

    // Load theme
    loadTheme();

    // Load saved timers
    loadTimers();

    // Form event listener
    document.getElementById('addTimerBtn').addEventListener('click', handleFormSubmit);

    // Modal event listeners
    document.querySelector('.close-modal')?.addEventListener('click', closeAlert);
    document.getElementById('alertModal').addEventListener('click', (e) => {
        if (e.target.id === 'alertModal') {
            closeAlert();
        }
    });

    // Keyboard support for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAlert();
        }
    });

    // Sort/Filter
    document.getElementById('sortSelect').addEventListener('change', handleSortChange);
    document.getElementById('filterSelect').addEventListener('change', handleFilterChange);

    // Sort/Filter menu toggle
    let menuVisible = false;
    document.getElementById('sortBtn').addEventListener('click', () => {
        const menu = document.getElementById('sortFilterMenu');
        menuVisible = !menuVisible;
        menu.style.display = menuVisible ? 'grid' : 'none';
    });

    document.getElementById('filterBtn').addEventListener('click', () => {
        const menu = document.getElementById('sortFilterMenu');
        menuVisible = !menuVisible;
        menu.style.display = menuVisible ? 'grid' : 'none';
    });

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportTimers);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });
    document.getElementById('importInput').addEventListener('change', importTimers);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
