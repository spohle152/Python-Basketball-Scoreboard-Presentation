# Upward Scoreboard

A basketball scoreboard desktop app built with pywebview. The controller runs in a native window on one monitor; the scoreboard displays fullscreen on a second monitor.

---

## Requirements

- **Python 3.10 or later**
  - macOS / Linux: check with `python3 --version`
  - Windows: check with `python --version` or `py --version`
  - Download from [python.org](https://www.python.org/downloads/) if not installed

### macOS
No additional system packages required. pywebview uses the built-in WKWebView engine.

### Windows
- **Microsoft Edge WebView2 Runtime** — pre-installed on Windows 11. On Windows 10, download it from [Microsoft's website](https://developer.microsoft.com/microsoft-edge/webview2/) if not already present.

### Linux
Install the WebKit2GTK engine and Python GObject bindings before running. On Debian/Ubuntu:

```bash
sudo apt install python3-gi python3-gi-cairo gir1.2-webkit2-4.1
```

On Fedora/RHEL:

```bash
sudo dnf install python3-gobject webkit2gtk4.1
```

On Arch Linux:

```bash
sudo pacman -S python-gobject webkit2gtk
```

---

## Starting the Scoreboard

**macOS** — double-click `start_scoreboard.command`.

**Windows** — double-click `start_scoreboard.bat`.

**Linux** — double-click `start_scoreboard.sh` in your file manager (mark it executable first with `chmod +x start_scoreboard.sh` if needed), or run it from a terminal.

On the **first launch**, the start script automatically creates a virtual environment and installs all dependencies — no manual setup required. Subsequent launches start immediately.

At startup, a screen-picker window appears. Click the screen where you want the scoreboard to appear, then click **Launch Scoreboard**. Choose **No Display** to run the controller alone (useful for setup and testing).

---

## Controller Overview

The controller is divided into several panels.

### Music Panel (top left)

| Button | Action |
|---|---|
| Intermission Music | Plays a random track from `assets/Music/` |
| Introduction Music | Plays a random track from `assets/Intros/` |
| National Anthem | Plays `assets/anthem.mp3` and raises the flag on the display |
| Clear Audio | Fades out all playing audio |
| Manager | Opens the **Music Manager** window |

Buttons for Intermission Music, Introduction Music, National Anthem, and Flag are automatically disabled when their required files are missing. Hovering over a disabled button shows a hint directing you to the appropriate manager.

### Timers & Buzzer (top, second panel)

| Button | Action |
|---|---|
| Buzzer | Short buzzer sound |
| 0:30 / 0:45 / 1:00 Timer | Countdown timer that sounds the buzzer when it hits zero; click again to cancel |

### Volume (top, third panel)

Sliders for Buzzer, Music, Introductions, and Anthem volume. Settings are saved automatically.

### Display Preview (top right)

A live miniature preview of what is currently shown on the scoreboard display.

---

## Global Controls (subheader row)

| Control | Action |
|---|---|
| Show Score | Toggles score visibility on the display |
| Period − / + | Decrements or increments the current period; at halftime you are prompted to reset fouls |
| Total Periods field | Sets how many periods are in the game (default 4) |
| Show Fouls | Toggles team foul counts on the display |
| Show TOL | Toggles timeouts-left counts on the display |

---

## Game Clock

**Set Time** — Enter minutes, seconds, and tenths, then click **Update**. If the clock is at 0:00.0 when you click Update, you are prompted to increment the period first.

**Time In / Time Out** — Starts and stops the game clock. Spacebar also toggles it.

**Freeze** — Locks the display at its current state while you make silent edits on the controller. Unfreeze to push changes to the display.

**Cover** — Shows a full-screen cover with your logo, hiding the scoreboard. Click again to uncover.

**Flag** — Toggles the full-screen flag overlay (independent of the anthem button). Disabled when `assets/american flag.jpg` is missing.

**Cover Manager** — Opens the **Cover Manager** window to replace the flag image and cover logo.

**Countdown** — Starts a real-time countdown to a game start time (set with the time field beside it). Fires the long buzzer and auto-covers when it reaches zero.

### Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Toggle clock |
| Arrow Up / Down | Next / previous period |
| Arrow Left + 1/2/3 | Add 1, 2, or 3 points to Home |
| Arrow Left + − | Subtract 1 point from Home |
| Arrow Right + 1/2/3 | Add 1, 2, or 3 points to Visitor |
| Arrow Right + − | Subtract 1 point from Visitor |
| Left Shift | Toggle Home possession |
| Right Shift | Toggle Visitor possession |

---

## Team Panels

One panel on each side of the clock. Select a team from the dropdown at the top of each panel. Changing the team resets that side's player foul tracking.

### Score

**+3 / +2 / +1** add points; **−1** subtracts. The score difference is shown in the Game Control box at the bottom of the clock column.

### Fouls

**+1 Foul** opens a player picker:
- Select a player to add the foul to their individual count. If the player has a jersey number, their name and current foul count briefly appear on the display's **Player Fouls** box.
- **Add to Team** adds to the team total without attributing to a player.
- **Cancel** closes the picker without changing anything.

**−1 Foul** opens the same picker but subtracts:
- Select a player to remove one foul from their count.
- **Subtract from Team** subtracts from the team total only.
- Subtracting a foul never activates the Player Fouls box on the display.

**Bonus / Double Bonus** — Toggle the bonus indicator shown on the display. They are mutually exclusive.

**Reset Fouls** — Clears all team fouls and bonus indicators for both teams.

### Timeouts Left

**+1 / −1** adjust the timeout count shown on the display.

### Possession

The **<** and **>** arrow buttons at the top of the clock column toggle the possession arrow on the display for each team.

### Team Color

RGB sliders at the bottom of each team panel set that team's accent color on the display in real time.

---

## Display Tools

Located in the clock column below the countdown.

| Button | Opens |
|---|---|
| Open Display | Moves or reopens the scoreboard on a chosen screen |
| Introductions | Player introduction window |
| Pictures | Picture slideshow window |
| Teams | Team and roster editor |

---

## Game Control

**Reset Game** — Resets scores, fouls, period, timeouts, and team names to defaults. You will be reminded to set the clock and timeouts before the game.

---

## Music Manager

Opened from the **Manager** button in the Music panel.

A **Now Playing** indicator at the top of the window shows the name of the track currently playing, along with whether it is an Intermission or Introduction track. The indicator updates in real time as tracks change and clears when audio is stopped.

### Intermission Music tab
Add `.mp3` files to be played randomly during intermissions. Files are stored in `assets/Music/`. Each track has two buttons:

- **▶ Play** — immediately plays that specific track on the controller (overrides shuffle). The button highlights green and shows **▶ Playing** while the track is active.
- **▶ Playing** (when active) — click again to fade out and stop the audio.
- **Delete** — permanently removes the track file.

Adding or removing tracks immediately re-enables or disables the Intermission Music button on the controller.

### Introduction Music tab
Add `.mp3` files to be played during player introductions. Files are stored in `assets/Intros/`. Each track has the same **▶ Play / ▶ Playing** and **Delete** buttons as described above.

Adding or removing tracks immediately re-enables or disables the Introduction Music button on the controller.

### National Anthem tab
Replace the anthem file (`assets/anthem.mp3`). Click **Replace Anthem File** and select an `.mp3`. The controller reloads the audio automatically and re-enables the National Anthem button without restarting the app.

---

## Cover Manager

Opened from the **Cover Manager** button in the clock panel.

### Flag Image tab
Replace the full-screen flag image (`assets/american flag.jpg`) shown when the anthem plays. Accepts `.jpg`, `.jpeg`, or `.png`. The display updates immediately after upload and the Flag button on the controller is re-enabled.

### Cover Logo tab
Replace the logo (`assets/logo.png`) shown on the Cover screen and the Countdown overlay. Accepts `.jpg`, `.jpeg`, or `.png`. The display updates immediately after upload.

---

## Introductions Window

Opened from **Introductions** in Display Tools. Shows buttons for every player on the currently selected teams.

- Click a player's button to show their introduction on the display.
- Click again to dismiss it.
- **Introduction Music** plays a random intro track.
- **Clear Audio** fades out all playing audio (same as Clear Audio on the main controller).

---

## Team & Roster Editor

Opened from **Teams** in Display Tools.

- Add, rename, and delete teams.
- Add players with first name, last name, and jersey number. Jersey numbers are required for individual foul tracking on the display.
- Upload a team logo (PNG, JPG, or WebP, max 10 MB). Logos appear as a subtle watermark behind each team's score.
- Saving the roster automatically refreshes the controller and introductions page.

---

## Persistent Data

Game state (scores, period, fouls, clock, volumes, etc.) is saved automatically and restored on next launch.

Team and roster data, team logos, and asset name records are stored in the OS application-data folder:

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/Upward Scoreboard/` |
| Windows | `%APPDATA%\Upward Scoreboard\` |
| Linux | `~/.local/share/Upward Scoreboard/` |

To reset all saved data, delete the folder above and restart.

---

## Adding Media Files Manually

Instead of using the managers, you can place files directly:

| File | Location | Notes |
|---|---|---|
| Intermission music | `assets/Music/` | `.mp3` only |
| Introduction music | `assets/Intros/` | `.mp3` only |
| National anthem | `assets/anthem.mp3` | Replace in place |
| Flag image | `assets/american flag.jpg` | Replace in place |
| Cover logo | `assets/logo.png` | Replace in place |
| Slideshow pictures | `assets/Pictures/` | `.jpg` or `.png` |
