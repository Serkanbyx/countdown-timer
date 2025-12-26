# ⏰ Countdown Timer

A modern, feature-rich countdown timer application built with vanilla JavaScript. Create multiple timers, set target dates and times, and track your countdowns with real-time updates, progress bars, browser notifications, and PWA support.

[![Created by Serkanby](https://img.shields.io/badge/Created%20by-Serkanby-blue?style=flat-square)](https://serkanbayraktar.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Serkanbyx-181717?style=flat-square&logo=github)](https://github.com/Serkanbyx)

## Features

- **Multiple Timers**: Create and manage unlimited countdown timers simultaneously
- **Real-Time Updates**: Countdown displays update every second with precise time remaining
- **Date & Time Selection**: Intuitive date and time pickers for setting target moments
- **Progress Visualization**: Visual progress bar showing elapsed time percentage
- **Pause & Resume**: Control timer execution with pause/resume functionality
- **Edit Timers**: Modify existing timer details including name, date, time, and alert settings
- **Upcoming Alerts**: Configure alerts before timer completion (1 hour, 30 min, 10 min, 5 min, 1 min)
- **Browser Notifications**: Native system notifications when timers complete or alerts trigger
- **Sorting & Filtering**: Sort timers by date or name, filter by active/expired status
- **Export & Import**: Save and load timers in JSON format for backup and sharing
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **Toast Notifications**: Modern, non-intrusive notification system
- **Visual & Audio Alerts**: Modal popup and sound notification when timer completes
- **Local Storage**: Automatic persistence - timers survive page refreshes
- **Responsive Design**: Fully responsive layout for mobile, tablet, and desktop
- **PWA Support**: Install as a native app, works offline
- **Accessibility (a11y)**: ARIA attributes, keyboard navigation, reduced motion support
- **Expired Timer Management**: Expired timers automatically move to the end of the list
- **Modern UI/UX**: Clean, minimal interface with smooth animations and SVG icons

## Live Demo

[🎮 View Live Demo](https://countdown-timerrrr.netlify.app/)

## Screenshots

### Light Mode

The default light theme with a gradient background and clean card design.

### Dark Mode

Toggle to dark mode for comfortable viewing in low-light environments.

### Timer Cards

Each timer displays days, hours, minutes, and seconds in equal-sized boxes with progress tracking.

### PWA Install

Install the app on your device for offline access and native-like experience.

## Technologies

- **HTML5**: Semantic markup, form elements, ARIA attributes for accessibility
- **CSS3**: Modern CSS with Grid, Flexbox, CSS Variables, animations, reduced motion support
- **Vanilla JavaScript (ES6+)**: Classes, arrow functions, template literals, async/await
- **LocalStorage API**: Client-side data persistence for timers and preferences
- **Web Audio API**: Programmatic audio generation for alert sounds
- **Notifications API**: Native browser notifications for timer alerts
- **Service Worker**: Offline caching and PWA functionality
- **Web App Manifest**: PWA installation and app metadata
- **Date API**: Native JavaScript Date object for time calculations

## Installation

### Local Development

Clone the repository:

```bash
git clone https://github.com/Serkanbyx/s1.5_Countdown-Timer.git
cd s1.5_Countdown-Timer
```

#### Option 1: Python HTTP Server

If you have Python installed:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

#### Option 2: Node.js (npx serve)

If you have Node.js installed:

```bash
npx serve
```

#### Option 3: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option 4: Direct File Opening

Simply open `index.html` directly in your browser (note: PWA and notifications require a server).

### PWA Installation

1. Open the app in Chrome, Edge, or Safari
2. Click "Install" in the address bar or use the browser menu
3. The app will be added to your home screen/desktop

## Usage

1. **Adding a Timer**:

   - Enter an optional name for your timer (e.g., "New Year", "Birthday")
   - Select the target date using the date picker
   - Select the target time using the time picker
   - Choose when to receive an alert (before completion)
   - Click "Add Timer" button

2. **Managing Timers**:

   - **View**: Timers automatically start and display real-time countdown
   - **Pause/Resume**: Click the pause button to freeze the timer, resume button to continue
   - **Edit**: Click "Edit" button to modify timer details
   - **Delete**: Click the "×" button in the top-right corner of any timer card

3. **Sorting & Filtering**:

   - Click "Sort" to organize timers by date or name
   - Click "Filter" to view all, active, or expired timers
   - Expired timers are automatically moved to the end

4. **Export/Import**:

   - Click "Export" to download all timers as a JSON file
   - Click "Import" to load previously exported timers

5. **Notifications**:

   - Click the notification bell to enable/disable browser notifications
   - Allow notification permission when prompted
   - Receive alerts when timers complete or reach warning thresholds

6. **Theme Toggle**:
   - Click the theme icon (moon/sun) to switch between light and dark modes
   - Your preference is automatically saved

## How It Works?

### Timer Calculation

The application calculates time remaining by comparing the current time with the target:

```javascript
calculateTimeRemaining() {
    if (this.isPaused && this.pausedTimeRemaining) {
        return this.pausedTimeRemaining;
    }

    const now = new Date();
    const target = this.getTargetDateTime();
    const difference = target - now;

    return msToTimeComponents(difference);
}
```

### Global Interval (Performance Optimized)

Instead of individual intervals per timer, a single global interval updates all timers:

```javascript
globalInterval = setInterval(() => {
  timers.forEach((timer) => {
    if (timer.isPaused || timer.isExpired) return;
    updateTimerDisplay(timer);

    // Check for alerts and expiration
    if (timer.shouldShowAlert()) {
      showTimerWarningNotification(timer.name, timer.alertBefore);
    }
  });
}, UPDATE_INTERVAL);
```

### Browser Notifications

Native notifications are triggered for timer events:

```javascript
function showBrowserNotification(title, options = {}) {
  if (!areNotificationsEnabled()) return null;

  const notification = new Notification(title, {
    icon: "/icons/icon-192.svg",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}
```

### Service Worker (Offline Support)

The service worker caches all assets for offline functionality:

```javascript
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-192.svg",
];

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### LocalStorage Structure

Timers are stored in LocalStorage as JSON:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "New Year",
    "targetDate": "2025-12-31",
    "targetTime": "23:59:00",
    "alertBefore": 60,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "isPaused": false,
    "pausedTimeRemaining": null
  }
]
```

## Customization

### Change Color Scheme

Edit CSS variables in `styles.css`:

```css
:root {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --secondary-color: #8b5cf6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
}
```

### Modify Alert Sound

Edit the `ALERT_SOUND` constant in `script.js`:

```javascript
const ALERT_SOUND = {
  frequency: 800, // Change frequency (Hz)
  type: "sine", // 'sine', 'square', 'sawtooth', 'triangle'
  duration: 0.5, // Duration in seconds
  volume: 0.3, // Volume (0-1)
};
```

### Add Custom Alert Times

Add new options to the alert dropdown in `index.html`:

```html
<option value="120">2 hours before</option>
<option value="15">15 minutes before</option>
```

### Disable Animations (Accessibility)

Users who prefer reduced motion get automatic support:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Features in Detail

### Completed Features

✅ Multiple timer management  
✅ Real-time countdown display  
✅ Pause/Resume functionality  
✅ Edit timer details  
✅ Progress bar visualization  
✅ Upcoming alerts (configurable)  
✅ Browser Notifications API  
✅ PWA support (offline mode)  
✅ Sorting by date/name  
✅ Filtering by status  
✅ Export/Import JSON  
✅ Dark mode toggle  
✅ Toast notifications  
✅ Audio alerts  
✅ LocalStorage persistence  
✅ Responsive design  
✅ Accessibility (ARIA, keyboard nav)  
✅ Reduced motion support  
✅ High contrast mode support  
✅ Single global interval (performance)  
✅ Event delegation (performance)  
✅ SVG icons  
✅ Expired timer handling

### Future Features

- [ ] Timezone selection support
- [ ] Recurring timers
- [ ] Timer categories/tags
- [ ] Custom alert sounds (upload)
- [ ] Timer sharing via URL
- [ ] Statistics and analytics
- [ ] Widget mode
- [ ] Cloud sync

## Project Structure

```
s1.5_Countdown Timer/
├── index.html          # Main HTML with semantic markup
├── styles.css          # CSS with variables, a11y support
├── script.js           # All JavaScript (1370 lines)
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline caching
├── favicon.svg         # App favicon
├── README.md           # Documentation
└── icons/              # PWA icons
    ├── icon-72.svg
    ├── icon-96.svg
    ├── icon-128.svg
    ├── icon-144.svg
    ├── icon-152.svg
    ├── icon-192.svg
    ├── icon-384.svg
    └── icon-512.svg
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Format

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `a11y:` - Accessibility improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## License

This project is open source and available under the [MIT License](LICENSE).

## Developer

**Serkanby**

- Website: [serkanbayraktar.com](https://serkanbayraktar.com/)
- GitHub: [@Serkanbyx](https://github.com/Serkanbyx)
- Email: serkanbyx1@gmail.com

## Acknowledgments

- Modern browser APIs (LocalStorage, Web Audio, Notifications, Service Worker)
- SVG icons inspired by Feather Icons
- CSS Grid and Flexbox for responsive layouts
- Native JavaScript Date API for time calculations
- WAI-ARIA best practices for accessibility

## Contact

- **Issues**: [GitHub Issues](https://github.com/Serkanbyx/s1.5_Countdown-Timer/issues)
- **Email**: serkanbyx1@gmail.com
- **Website**: [serkanbayraktar.com](https://serkanbayraktar.com/)

---

⭐ If you like this project, don't forget to give it a star!
