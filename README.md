# ⏰ Countdown Timer

A modern, feature-rich countdown timer application built with vanilla JavaScript. Create multiple timers, set target dates and times, and track your countdowns with real-time updates, progress bars, and customizable alerts.

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
- **Sorting & Filtering**: Sort timers by date or name, filter by active/expired status
- **Export & Import**: Save and load timers in JSON format for backup and sharing
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **Toast Notifications**: Modern, non-intrusive notification system
- **Visual & Audio Alerts**: Modal popup and sound notification when timer completes
- **Local Storage**: Automatic persistence - timers survive page refreshes
- **Responsive Design**: Fully responsive layout for mobile, tablet, and desktop
- **Modern UI/UX**: Clean, minimal interface with smooth animations

## Live Demo

[🎮 View Live Demo](https://serkanbyx.github.io/s1.5_Countdown-Timer/) (if deployed)

## Technologies

- **HTML5**: Semantic markup, form elements, and accessibility features
- **CSS3**: Modern CSS with Grid, Flexbox, CSS Variables, animations, and responsive design
- **Vanilla JavaScript (ES6+)**: Classes, arrow functions, template literals, async/await patterns
- **LocalStorage API**: Client-side data persistence for timers and theme preferences
- **Web Audio API**: Programmatic audio generation for alert sounds
- **Date API**: Native JavaScript Date object for time calculations and formatting

## Installation

### Local Development

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

Simply open `index.html` directly in your browser (note: some features may be limited).

## Usage

1. **Adding a Timer**:

   - Enter an optional name for your timer (e.g., "New Year", "Birthday")
   - Select the target date using the date picker
   - Select the target time using the time picker
   - Choose when to receive an alert (before completion)
   - Click "Add Timer" button

2. **Managing Timers**:

   - **View**: Timers automatically start and display real-time countdown
   - **Pause/Resume**: Click the pause button to pause, resume button to continue
   - **Edit**: Click "Edit" button to modify timer details
   - **Delete**: Click the "×" button in the top-right corner of any timer card

3. **Sorting & Filtering**:

   - Click "Sort" to organize timers by date (near to far, far to near) or name (A-Z, Z-A)
   - Click "Filter" to view all timers, only active timers, or only expired timers

4. **Export/Import**:

   - Click "Export" to download all timers as a JSON file
   - Click "Import" to load previously exported timers from a JSON file

5. **Theme Toggle**:
   - Click the theme icon (moon/sun) in the top-right to switch between light and dark modes
   - Your preference is automatically saved

## How It Works?

### Timer Calculation

The application calculates time remaining by comparing the current time with the target date/time:

```javascript
calculateTimeRemaining() {
    const now = new Date();
    const target = this.getTargetDateTime();
    const difference = target - now;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
}
```

### Progress Bar Calculation

Progress is calculated based on elapsed time from timer creation:

```javascript
calculateProgress() {
    const elapsed = this.initialDuration - timeRemaining.totalSeconds;
    return Math.max(0, Math.min(100, (elapsed / this.initialDuration) * 100));
}
```

### Interval Management

Each timer runs its own interval that updates every second:

```javascript
start() {
    this.updateDisplay();
    this.intervalId = setInterval(() => {
        this.updateDisplay();
    }, 1000);
}
```

### LocalStorage Structure

Timers are stored in LocalStorage as JSON:

```json
[
  {
    "id": 1234567890.123,
    "name": "New Year",
    "targetDate": "2024-12-31",
    "targetTime": "23:59",
    "alertBefore": 60,
    "createdAt": "2024-01-01T00:00:00.000Z"
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
  /* ... more variables */
}
```

### Modify Alert Sound

Edit the `playAlertSound()` function in `script.js`:

```javascript
oscillator.frequency.value = 800; // Change frequency (Hz)
oscillator.type = "sine"; // Change wave type: 'sine', 'square', 'sawtooth', 'triangle'
```

### Add Custom Alert Times

Add new options to the alert dropdown in `index.html`:

```html
<option value="120">2 hours before</option>
<option value="15">15 minutes before</option>
```

### Change Update Interval

Modify the interval duration in the `start()` method:

```javascript
this.intervalId = setInterval(() => {
  this.updateDisplay();
}, 500); // Update every 500ms instead of 1000ms
```

## Features in Detail

### Completed Features

✅ Multiple timer management  
✅ Real-time countdown display  
✅ Pause/Resume functionality  
✅ Edit timer details  
✅ Progress bar visualization  
✅ Upcoming alerts (configurable)  
✅ Sorting by date/name  
✅ Filtering by status  
✅ Export/Import JSON  
✅ Dark mode toggle  
✅ Toast notifications  
✅ Audio alerts  
✅ LocalStorage persistence  
✅ Responsive design  
✅ SVG icons  
✅ Expired timer handling

### Future Features

- [ ] Timezone selection support
- [ ] Recurring timers
- [ ] Timer categories/tags
- [ ] Custom alert sounds
- [ ] Timer sharing via URL
- [ ] Statistics and analytics
- [ ] Widget mode
- [ ] Browser notifications API
- [ ] PWA support (offline mode)

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
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
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

- Modern browser APIs (LocalStorage, Web Audio API)
- SVG icons inspired by Feather Icons
- CSS Grid and Flexbox for responsive layouts
- Native JavaScript Date API for time calculations

## Contact

- **Issues**: [GitHub Issues](https://github.com/Serkanbyx/s1.5_Countdown-Timer/issues)
- **Email**: serkanbyx1@gmail.com
- **Website**: [serkanbayraktar.com](https://serkanbayraktar.com/)

---

⭐ If you like this project, don't forget to give it a star!
