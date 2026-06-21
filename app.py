"""Desktop launcher for the Upward Scoreboard.

The existing HTML controllers remain the user interface. pywebview supplies
native windows, monitor selection, fullscreen display placement, and durable
application storage.
"""

from __future__ import annotations

import base64
import json
import os
import re
import sys
import threading
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

try:
    import webview
except ImportError as exc:  # pragma: no cover - exercised by end users
    raise SystemExit(
        "pywebview is not installed. Run: python3 -m pip install -r requirements.txt"
    ) from exc


APP_NAME = "Upward Scoreboard"
APP_PORT = 8765
BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"


def application_data_dir() -> Path:
    if sys.platform == "darwin":
        root = Path.home() / "Library" / "Application Support"
    elif os.name == "nt":
        root = Path(os.environ.get("APPDATA", Path.home()))
    else:
        root = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    path = root / APP_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path


DATA_DIR = application_data_dir()
WEBVIEW_STORAGE_DIR = DATA_DIR / "webview"
TEAMS_DATA_FILE = DATA_DIR / "teams.json"
GAME_STATE_FILE = DATA_DIR / "game_state.json"
TEAM_LOGOS_DIR = DATA_DIR / "team_logos"
TEAM_LOGO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ASSET_NAMES_FILE = DATA_DIR / "asset_names.json"


def _read_asset_names() -> dict:
    try:
        return json.loads(ASSET_NAMES_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _write_asset_name(key: str, name: str) -> None:
    names = _read_asset_names()
    names[key] = name
    try:
        tmp = ASSET_NAMES_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(names), encoding="utf-8")
        tmp.replace(ASSET_NAMES_FILE)
    except OSError:
        pass


class TeamStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        TEAM_LOGOS_DIR.mkdir(parents=True, exist_ok=True)
        if not TEAMS_DATA_FILE.exists():
            self._write(self._load_legacy_teams())

    def _load_legacy_teams(self) -> list[dict[str, str]]:
        legacy_path = ASSETS_DIR / "teams.json"
        if not legacy_path.exists():
            return []

        source = legacy_path.read_text(encoding="utf-8")
        match = re.search(r"teams\s*=\s*'(.*)'\s*;?", source, re.DOTALL)
        if not match:
            return []

        payload = match.group(1).replace("\\\n", "")
        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            return []
        return self._normalise_records(parsed)

    @staticmethod
    def _normalise_records(records: Any) -> list[dict[str, str]]:
        if not isinstance(records, list):
            raise ValueError("Team data must be a list")

        cleaned: list[dict[str, str]] = []
        for record in records:
            if not isinstance(record, dict):
                continue
            team = str(record.get("TeamName", "")).strip()
            first = str(record.get("FirstName", "")).strip()
            last = str(record.get("LastName", "")).strip()
            logo = str(record.get("TeamLogo", "")).strip()
            number = str(record.get("PlayerNumber", "")).strip()
            if Path(logo).name != logo or Path(logo).suffix.lower() not in TEAM_LOGO_EXTENSIONS:
                logo = ""
            if team and (first or last):
                cleaned.append(
                    {
                        "FirstName": first,
                        "LastName": last,
                        "TeamName": team,
                        "TeamLogo": logo,
                        "PlayerNumber": number,
                    }
                )
        return cleaned

    def _write(self, records: list[dict[str, str]]) -> None:
        temporary = TEAMS_DATA_FILE.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        temporary.replace(TEAMS_DATA_FILE)

    def records(self) -> list[dict[str, str]]:
        with self._lock:
            try:
                records = json.loads(TEAMS_DATA_FILE.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                records = []
            return self._normalise_records(records)

    def grouped(self) -> dict[str, Any]:
        teams: dict[str, dict[str, Any]] = {}
        for record in self.records():
            team = teams.setdefault(
                record["TeamName"],
                {"name": record["TeamName"], "logo": record["TeamLogo"], "players": []},
            )
            if not team["logo"] and record["TeamLogo"]:
                team["logo"] = record["TeamLogo"]
            team["players"].append(
                {
                    "first_name": record["FirstName"],
                    "last_name": record["LastName"],
                    "player_number": record.get("PlayerNumber", ""),
                }
            )
        return {
            "teams": list(teams.values())
        }

    def save_grouped(self, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict) or not isinstance(payload.get("teams"), list):
            raise ValueError("Invalid team payload")

        records: list[dict[str, str]] = []
        seen_names: set[str] = set()
        for team in payload["teams"]:
            if not isinstance(team, dict):
                continue
            name = str(team.get("name", "")).strip()
            if not name:
                raise ValueError("Every team needs a name")
            lowered = name.casefold()
            if lowered in seen_names:
                raise ValueError(f'Duplicate team name: "{name}"')
            seen_names.add(lowered)

            logo = str(team.get("logo", "")).strip()
            if logo:
                if (
                    Path(logo).name != logo
                    or Path(logo).suffix.lower() not in TEAM_LOGO_EXTENSIONS
                    or not (TEAM_LOGOS_DIR / logo).is_file()
                ):
                    raise ValueError(f'Invalid logo for "{name}"')

            players = team.get("players", [])
            if not isinstance(players, list):
                raise ValueError(f'Players for "{name}" must be a list')
            team_player_count = 0
            for player in players:
                if not isinstance(player, dict):
                    continue
                first = str(player.get("first_name", "")).strip()
                last = str(player.get("last_name", "")).strip()
                number = str(player.get("player_number", "")).strip()
                if first or last:
                    team_player_count += 1
                    records.append(
                        {
                            "FirstName": first,
                            "LastName": last,
                            "TeamName": name,
                            "TeamLogo": logo,
                            "PlayerNumber": number,
                        }
                    )
            if team_player_count == 0:
                raise ValueError(f'Add at least one player to "{name}"')

        with self._lock:
            self._write(records)
            referenced = {record["TeamLogo"] for record in records if record["TeamLogo"]}
            for logo_file in TEAM_LOGOS_DIR.iterdir():
                if logo_file.is_file() and logo_file.name not in referenced:
                    try:
                        logo_file.unlink()
                    except OSError:
                        pass
        return self.grouped()

    def javascript(self) -> str:
        payload = json.dumps(self.records(), ensure_ascii=False)
        # The legacy pages expect a JSON string in the global `teams` variable.
        return f"teams = {json.dumps(payload)};"


class ScoreboardRequestHandler(SimpleHTTPRequestHandler):
    team_store: TeamStore

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def send_header(self, keyword: str, value: str) -> None:
        if keyword == "Cache-Control":
            self._sent_cache_control = True
        super().send_header(keyword, value)

    def end_headers(self) -> None:
        if not getattr(self, "_sent_cache_control", False):
            super().send_header("Cache-Control", "no-store")
        self._sent_cache_control = False
        super().end_headers()

    @staticmethod
    def _list_asset_files(directory: Path, suffixes: set) -> list:
        if not directory.exists():
            return []
        return sorted(
            f.name for f in directory.iterdir()
            if f.is_file() and f.suffix.lower() in suffixes
        )

    def do_GET(self) -> None:  # noqa: N802 - stdlib API name
        path = unquote(urlparse(self.path).path)
        if path.startswith("/team-logos/"):
            name = path.removeprefix("/team-logos/")
            logo_path = TEAM_LOGOS_DIR / name
            if (
                not name
                or Path(name).name != name
                or logo_path.suffix.lower() not in TEAM_LOGO_EXTENSIONS
                or not logo_path.is_file()
            ):
                self.send_error(404)
                return
            content_types = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp",
            }
            content = logo_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_types[logo_path.suffix.lower()])
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            self.end_headers()
            self.wfile.write(content)
            return
        if path == "/assets/teams.json":
            content = self.team_store.javascript().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)
            return
        if path == "/api/assets":
            _names = _read_asset_names()
            payload = {
                "music": self._list_asset_files(ASSETS_DIR / "Music", {".mp3"}),
                "intros": self._list_asset_files(ASSETS_DIR / "Intros", {".mp3"}),
                "pictures": self._list_asset_files(ASSETS_DIR / "Pictures", {".jpg", ".jpeg", ".png"}),
                "anthem_exists": (ASSETS_DIR / "anthem.mp3").is_file(),
                "anthem_name": _names.get("anthem"),
                "flag_exists": (ASSETS_DIR / "american flag.jpg").is_file(),
                "flag_name": _names.get("flag"),
                "logo_exists": (ASSETS_DIR / "logo.png").is_file(),
                "logo_name": _names.get("logo"),
            }
            content = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)
            return
        if path == "/api/state":
            try:
                content = GAME_STATE_FILE.read_bytes()
            except OSError:
                content = b"{}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802 - stdlib API name
        path = unquote(urlparse(self.path).path)
        if path == "/api/state":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length) if length else b""
                state = json.loads(body)
                if isinstance(state, dict):
                    tmp = GAME_STATE_FILE.with_suffix(".tmp")
                    tmp.write_bytes(body)
                    tmp.replace(GAME_STATE_FILE)
            except Exception:
                pass
            self.send_response(204)
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, _format: str, *args: Any) -> None:
        return


class DesktopApi:
    def __init__(self, team_store: TeamStore) -> None:
        self.team_store = team_store
        self.base_url = ""
        self.selector_window: Any = None
        self.controller_window: Any = None
        self.display_window: Any = None
        self.tool_windows: dict[str, Any] = {}
        self._launch_lock = threading.Lock()
        self._launched = False
        self._closing = False
        self._display_screen_index: int = 0
        self._display_fullscreen: bool = False

    def _create_display_window(self, screen_index: int, display_screen: Any) -> None:
        self._display_screen_index = screen_index
        self.display_window = webview.create_window(
            "Scoreboard Display",
            f"{self.base_url}/assets/display.html?v=9",
            screen=display_screen,
            width=display_screen.width,
            height=display_screen.height,
            fullscreen=False,
            frameless=True,
            easy_drag=False,
            resizable=False,
            background_color="#000000",
            text_select=False,
        )

        _fs_done = [False]
        _sidx = screen_index

        def _go_fullscreen() -> None:
            if not _fs_done[0]:
                _fs_done[0] = True
                win = self.display_window
                if win is None:
                    return
                if sys.platform == "darwin":
                    try:
                        from AppKit import NSApplication, NSScreen
                        from PyObjCTools import AppHelper
                        _sidx_local = _sidx

                        def _setup() -> None:
                            ns_screens = NSScreen.screens()
                            if not ns_screens:
                                return
                            idx = min(_sidx_local, len(ns_screens) - 1)
                            app = NSApplication.sharedApplication()
                            full_frame = ns_screens[idx].frame()
                            target_win = None
                            for ns_win in app.windows():
                                if ns_win.title() in ("Scoreboard Display", "Scoreboard"):
                                    target_win = ns_win
                                    break
                            if target_win is None:
                                return
                            app.setPresentationOptions_(4 | 1)
                            target_win.setLevel_(1000)
                            target_win.setFrame_display_(full_frame, True)
                            target_win.orderFrontRegardless()
                            _tw, _ff = target_win, full_frame
                            def _settle() -> None:
                                import time
                                time.sleep(0.3)
                                AppHelper.callAfter(
                                    lambda: _tw.setFrame_display_(_ff, True)
                                )
                            threading.Thread(target=_settle, daemon=True).start()

                        AppHelper.callAfter(_setup)
                    except Exception:
                        pass
                else:
                    # Linux / Windows: pywebview's built-in fullscreen is
                    # sufficient; no native API calls needed.
                    try:
                        win.toggle_fullscreen()
                        self._display_fullscreen = True
                    except Exception:
                        pass

        self.display_window.events.loaded += _go_fullscreen

    def get_screens(self) -> list[dict[str, Any]]:
        result = []
        for index, screen in enumerate(webview.screens):
            result.append(
                {
                    "index": index,
                    "label": f"Screen {index + 1}" + (" (Primary)" if index == 0 else ""),
                    "width": screen.width,
                    "height": screen.height,
                    "physical_width": getattr(screen, "physical_width", screen.width),
                    "physical_height": getattr(screen, "physical_height", screen.height),
                    "scale": getattr(screen, "scale", 1.0),
                }
            )
        return result

    def launch(self, screen_index: int) -> dict[str, Any]:
        with self._launch_lock:
            if self._launched:
                return {"ok": True}
            screens = list(webview.screens)
            if not screens:
                return {"ok": False, "error": "No displays were detected."}
            try:
                selected_index = int(screen_index)
            except (TypeError, ValueError):
                selected_index = 0

            if selected_index == -1:
                # No-display (testing) mode — skip the scoreboard output window.
                self.display_window = None
                self._display_screen_index = -1
                controller_screen = screens[0]
            else:
                selected_index = max(0, min(selected_index, len(screens) - 1))
                display_screen = screens[selected_index]
                controller_screen = next(
                    (screen for screen in screens if screen is not display_screen), screens[0]
                )
                self._create_display_window(selected_index, display_screen)

            controller_width = max(760, controller_screen.width - 40)
            controller_height = max(520, controller_screen.height - 60)
            self.controller_window = webview.create_window(
                "Upward Scoreboard Controller",
                f"{self.base_url}/Scoreboard%20Controller.html?v=11",
                js_api=self,
                screen=controller_screen,
                width=controller_width,
                height=controller_height,
                min_size=(760, 500),
                maximized=True,
                background_color="#000000",
                confirm_close=False,
            )
            # As with fullscreen, some backends ignore maximized=True for a
            # window created after the GUI loop has started.
            self.controller_window.maximize()
            self.controller_window.events.closed += self._close_companion_windows
            self._launched = True
            if self.selector_window is not None:
                self.selector_window.destroy()
            return {"ok": True}

    def _close_companion_windows(self) -> None:
        if self._closing:
            return
        self._closing = True

        # Close any open tool windows first — they are never in fullscreen.
        for window in self.tool_windows.values():
            if window is not None:
                try:
                    window.destroy()
                except Exception:
                    pass

        if sys.platform == "darwin":
            # On macOS, NSApplication.run() is pywebview's event loop and does
            # not exit when windows close — terminate_() must be called
            # explicitly.  Calling it synchronously from inside the closed event
            # handler races with pywebview's own teardown, so in the no-display
            # case we schedule it on a background thread after a brief yield.
            has_active_display = (
                self.display_window is not None
                and self._display_screen_index != -1
            )
            if not has_active_display and self.display_window is not None:
                try:
                    self.display_window.destroy()
                except Exception:
                    pass

            def _terminate(delay: float) -> None:
                import time as _time, os as _os
                _time.sleep(delay)
                if has_active_display:
                    try:
                        from AppKit import NSApplication
                        from PyObjCTools import AppHelper
                        AppHelper.callAfter(
                            lambda: NSApplication.sharedApplication().terminate_(None)
                        )
                        _time.sleep(2.0)
                    except Exception:
                        pass
                # os._exit terminates the process from any thread without
                # requiring the main thread to cooperate — the reliable fallback
                # when NSApplication.terminate_() can't fire or isn't needed.
                _os._exit(0)

            threading.Thread(
                target=_terminate,
                args=(0.0 if has_active_display else 0.15,),
                daemon=True,
            ).start()
        else:
            if self.display_window is not None:
                try:
                    self.display_window.destroy()
                except Exception:
                    pass

    def open_tool(self, tool_name: str) -> dict[str, Any]:
        pages = {
            "introductions": ("Introductions", "/assets/introductions.html?v=10"),
            "pictures": ("Pictures", "/assets/pictures.html"),
            "teams": ("Teams & Rosters", "/assets/team_editor.html?v=7"),
            "music": ("Music Manager", "/assets/music_manager.html?v=6"),
            "cover": ("Cover Manager", "/assets/cover_manager.html?v=1"),
        }
        if tool_name not in pages:
            return {"ok": False, "error": "Unknown tool."}

        existing = self.tool_windows.get(tool_name)
        if existing is not None:
            try:
                existing.show()
                existing.restore()
                return {"ok": True}
            except Exception:
                self.tool_windows.pop(tool_name, None)

        title, path = pages[tool_name]
        window = webview.create_window(
            title,
            f"{self.base_url}{path}",
            js_api=self,
            width=1200,
            height=820,
            min_size=(720, 520),
            background_color="#000000",
        )
        self.tool_windows[tool_name] = window

        # When a display-affecting tool closes, notify the display via the
        # controller window. The beforeunload BC message is unreliable because
        # the closing page's JS context may be torn down before delivery.
        _close_broadcasts: dict[str, str] = {
            "introductions": "intro_off",
            "pictures": "picture_off",
        }
        close_msg = _close_broadcasts.get(tool_name)

        def on_closed() -> None:
            self.tool_windows.pop(tool_name, None)
            if close_msg and self.controller_window is not None:
                try:
                    self.controller_window.evaluate_js(
                        "if (window.BroadcastChannel) {"
                        " var _bc = new BroadcastChannel('channel');"
                        f" _bc.postMessage('{close_msg}');"
                        " _bc.close(); }"
                    )
                except Exception:
                    pass

        window.events.closed += on_closed
        return {"ok": True}

    def show_display(self) -> dict[str, Any]:
        if self.display_window is None:
            return {"ok": False, "error": "The display window is not open."}
        try:
            self.display_window.show()
            if sys.platform != "darwin":
                self.display_window.restore()
            return {"ok": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def move_display(self, screen_index: int) -> dict[str, Any]:
        try:
            screen_index = int(screen_index)
        except (TypeError, ValueError):
            return {"ok": False, "error": "Invalid screen index."}

        if screen_index == -1:
            # Hide the display window without destroying it.
            if self.display_window is not None:
                try:
                    self.display_window.hide()
                except Exception as exc:
                    return {"ok": False, "error": str(exc)}
            self._display_screen_index = -1
            return {"ok": True}

        screens = list(webview.screens)
        if not screens:
            return {"ok": False, "error": "No displays were detected."}
        screen_index = max(0, min(screen_index, len(screens) - 1))

        if self.display_window is None:
            # Started in no-display mode; create the window now.
            self._create_display_window(screen_index, screens[screen_index])
            return {"ok": True}

        # Window exists — move it to the chosen screen.
        if sys.platform == "darwin":
            _sidx = screen_index
            try:
                from AppKit import NSApplication, NSScreen
                from PyObjCTools import AppHelper

                def _do_move() -> None:
                    ns_screens = NSScreen.screens()
                    if not ns_screens:
                        return
                    idx = min(_sidx, len(ns_screens) - 1)
                    full_frame = ns_screens[idx].frame()
                    app = NSApplication.sharedApplication()
                    target_win = None
                    for ns_win in app.windows():
                        if ns_win.title() in ("Scoreboard Display", "Scoreboard"):
                            target_win = ns_win
                            break
                    if target_win is None:
                        return
                    app.setPresentationOptions_(4 | 1)
                    target_win.setLevel_(1000)
                    target_win.orderFrontRegardless()
                    target_win.setFrame_display_(full_frame, True)
                    _tw, _ff = target_win, full_frame
                    def _settle() -> None:
                        import time
                        time.sleep(0.3)
                        AppHelper.callAfter(lambda: _tw.setFrame_display_(_ff, True))
                    threading.Thread(target=_settle, daemon=True).start()

                AppHelper.callAfter(_do_move)
            except Exception as exc:
                return {"ok": False, "error": str(exc)}
        else:
            target_screen = screens[screen_index]
            tx = getattr(target_screen, 'x', 0)
            ty = getattr(target_screen, 'y', 0)
            try:
                if self._display_fullscreen:
                    self.display_window.toggle_fullscreen()
                    self._display_fullscreen = False
                self.display_window.show()
                self.display_window.restore()
                self.display_window.move(tx, ty)
                self.display_window.resize(target_screen.width, target_screen.height)
                self.display_window.toggle_fullscreen()
                self._display_fullscreen = True
            except Exception as exc:
                return {"ok": False, "error": str(exc)}

        self._display_screen_index = screen_index
        return {"ok": True}

    def get_asset_lists(self) -> dict[str, Any]:
        def list_files(directory: Path, suffixes: set) -> list:
            if not directory.exists():
                return []
            return sorted(
                f.name for f in directory.iterdir()
                if f.is_file() and f.suffix.lower() in suffixes
            )

        names = _read_asset_names()
        return {
            "music": list_files(ASSETS_DIR / "Music", {".mp3"}),
            "intros": list_files(ASSETS_DIR / "Intros", {".mp3"}),
            "pictures": list_files(ASSETS_DIR / "Pictures", {".jpg", ".jpeg", ".png"}),
            "anthem_exists": (ASSETS_DIR / "anthem.mp3").is_file(),
            "anthem_name": names.get("anthem"),
            "flag_exists": (ASSETS_DIR / "american flag.jpg").is_file(),
            "flag_name": names.get("flag"),
            "logo_exists": (ASSETS_DIR / "logo.png").is_file(),
            "logo_name": names.get("logo"),
        }

    def delete_track(self, category: str, filename: str) -> dict[str, Any]:
        dirs = {"music": ASSETS_DIR / "Music", "intros": ASSETS_DIR / "Intros"}
        if category not in dirs:
            return {"ok": False, "error": "Unknown category."}
        name = Path(filename).name
        if name != filename or not name.lower().endswith(".mp3"):
            return {"ok": False, "error": "Invalid filename."}
        target = dirs[category] / name
        try:
            target.unlink()
        except FileNotFoundError:
            return {"ok": False, "error": "File not found."}
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True}

    def upload_track(self, category: str, filename: str, data_b64: str) -> dict[str, Any]:
        dirs = {"music": ASSETS_DIR / "Music", "intros": ASSETS_DIR / "Intros"}
        if category not in dirs:
            return {"ok": False, "error": "Unknown category."}
        name = Path(filename).name
        if name != filename or not name.lower().endswith(".mp3"):
            return {"ok": False, "error": "Only .mp3 files are allowed."}
        if "," in data_b64:
            data_b64 = data_b64.split(",", 1)[1]
        try:
            data = base64.b64decode(data_b64)
        except Exception:
            return {"ok": False, "error": "Invalid file data."}
        dest_dir = dirs[category]
        dest_dir.mkdir(parents=True, exist_ok=True)
        stem = Path(name).stem
        suffix = Path(name).suffix
        target = dest_dir / name
        counter = 1
        while target.exists():
            target = dest_dir / f"{stem}-{counter}{suffix}"
            counter += 1
        try:
            tmp = target.with_suffix(".tmp")
            tmp.write_bytes(data)
            tmp.replace(target)
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True, "filename": target.name}

    def upload_anthem(self, filename: str, data_b64: str) -> dict[str, Any]:
        name = Path(filename).name
        if not name.lower().endswith(".mp3"):
            return {"ok": False, "error": "Only .mp3 files are allowed."}
        if "," in data_b64:
            data_b64 = data_b64.split(",", 1)[1]
        try:
            data = base64.b64decode(data_b64)
        except Exception:
            return {"ok": False, "error": "Invalid file data."}
        target = ASSETS_DIR / "anthem.mp3"
        try:
            tmp = ASSETS_DIR / "anthem.tmp"
            tmp.write_bytes(data)
            tmp.replace(target)
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        _write_asset_name("anthem", Path(filename).name)
        return {"ok": True}

    def upload_flag(self, filename: str, data_b64: str) -> dict[str, Any]:
        name = Path(filename).name
        ext = Path(name).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png"}:
            return {"ok": False, "error": "Only .jpg, .jpeg, or .png files are allowed."}
        if "," in data_b64:
            data_b64 = data_b64.split(",", 1)[1]
        try:
            data = base64.b64decode(data_b64)
        except Exception:
            return {"ok": False, "error": "Invalid file data."}
        target = ASSETS_DIR / "american flag.jpg"
        try:
            tmp = ASSETS_DIR / "american_flag.tmp"
            tmp.write_bytes(data)
            tmp.replace(target)
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        _write_asset_name("flag", Path(filename).name)
        return {"ok": True}

    def upload_logo(self, filename: str, data_b64: str) -> dict[str, Any]:
        name = Path(filename).name
        ext = Path(name).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png"}:
            return {"ok": False, "error": "Only .jpg, .jpeg, or .png files are allowed."}
        if "," in data_b64:
            data_b64 = data_b64.split(",", 1)[1]
        try:
            data = base64.b64decode(data_b64)
        except Exception:
            return {"ok": False, "error": "Invalid file data."}
        target = ASSETS_DIR / "logo.png"
        try:
            tmp = ASSETS_DIR / "logo.tmp"
            tmp.write_bytes(data)
            tmp.replace(target)
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        _write_asset_name("logo", Path(filename).name)
        return {"ok": True}

    def delete_picture(self, filename: str) -> dict[str, Any]:
        name = Path(filename).name
        if name != filename or name.lower().rsplit(".", 1)[-1] not in ("jpg", "jpeg", "png"):
            return {"ok": False, "error": "Invalid filename."}
        target = ASSETS_DIR / "Pictures" / name
        try:
            target.unlink()
        except FileNotFoundError:
            return {"ok": False, "error": "File not found."}
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True}

    def upload_picture(self, filename: str, data_b64: str) -> dict[str, Any]:
        name = Path(filename).name
        if name != filename or name.lower().rsplit(".", 1)[-1] not in ("jpg", "jpeg", "png"):
            return {"ok": False, "error": "Only .jpg and .png files are allowed."}
        if "," in data_b64:
            data_b64 = data_b64.split(",", 1)[1]
        try:
            data = base64.b64decode(data_b64)
        except Exception:
            return {"ok": False, "error": "Invalid file data."}
        dest_dir = ASSETS_DIR / "Pictures"
        dest_dir.mkdir(parents=True, exist_ok=True)
        target = dest_dir / name
        try:
            tmp = target.with_suffix(".tmp")
            tmp.write_bytes(data)
            tmp.replace(target)
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True}

    def get_state(self) -> dict[str, Any]:
        try:
            return json.loads(GAME_STATE_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}

    def save_state(self, state: Any) -> dict[str, Any]:
        if not isinstance(state, dict):
            return {"ok": False}
        try:
            tmp = GAME_STATE_FILE.with_suffix(".tmp")
            tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
            tmp.replace(GAME_STATE_FILE)
            return {"ok": True}
        except Exception:
            return {"ok": False}

    def get_teams(self) -> dict[str, Any]:
        return self.team_store.grouped()

    def upload_team_logo(self, filename: str, data_b64: str) -> dict[str, Any]:
        original_name = Path(filename).name
        suffix = Path(original_name).suffix.lower()
        if original_name != filename or suffix not in TEAM_LOGO_EXTENSIONS:
            return {
                "ok": False,
                "error": "Choose a PNG, JPG, JPEG, or WebP image.",
            }
        if "," in data_b64:
            data_b64 = data_b64.split(",", 1)[1]
        try:
            data = base64.b64decode(data_b64, validate=True)
        except Exception:
            return {"ok": False, "error": "Invalid image data."}
        if not data or len(data) > 10 * 1024 * 1024:
            return {"ok": False, "error": "Logo images must be smaller than 10 MB."}
        valid_signature = (
            (suffix == ".png" and data.startswith(b"\x89PNG\r\n\x1a\n"))
            or (suffix in {".jpg", ".jpeg"} and data.startswith(b"\xff\xd8\xff"))
            or (
                suffix == ".webp"
                and len(data) >= 12
                and data.startswith(b"RIFF")
                and data[8:12] == b"WEBP"
            )
        )
        if not valid_signature:
            return {"ok": False, "error": "The selected file is not a valid supported image."}

        stored_name = f"{uuid.uuid4().hex}{suffix}"
        target = TEAM_LOGOS_DIR / stored_name
        try:
            temporary = target.with_suffix(target.suffix + ".tmp")
            temporary.write_bytes(data)
            temporary.replace(target)
        except OSError as exc:
            return {"ok": False, "error": str(exc)}
        return {
            "ok": True,
            "logo": stored_name,
            "url": f"/team-logos/{stored_name}",
        }

    def save_teams(self, payload: Any) -> dict[str, Any]:
        try:
            teams = self.team_store.save_grouped(payload)
        except ValueError as exc:
            return {"ok": False, "error": str(exc)}

        # Notify every open same-origin page to reload its team choices.
        for window in [self.controller_window, *self.tool_windows.values()]:
            if window is not None:
                try:
                    window.evaluate_js(
                        "if (window.BroadcastChannel) {"
                        "const c = new BroadcastChannel('channel');"
                        "c.postMessage('teams_updated'); c.close(); }"
                    )
                except Exception:
                    pass
        return {"ok": True, **teams}


def start_server(team_store: TeamStore) -> tuple[ThreadingHTTPServer, str]:
    ScoreboardRequestHandler.team_store = team_store
    try:
        server = ThreadingHTTPServer(("127.0.0.1", APP_PORT), ScoreboardRequestHandler)
    except OSError as exc:
        raise SystemExit(
            f"Unable to start {APP_NAME} on localhost:{APP_PORT}. "
            "Close any other running copy and try again."
        ) from exc
    server.daemon_threads = True
    server.block_on_close = False
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    return server, f"http://{host}:{port}"


def main() -> None:
    WEBVIEW_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    # player_foul is a transient display notification that should not carry
    # over from a previous session.  Strip it from the saved state on startup
    # so the box is hidden when the scoreboard first opens.
    try:
        _gs = json.loads(GAME_STATE_FILE.read_text(encoding="utf-8"))
        if "player_foul" in _gs:
            _gs.pop("player_foul")
            GAME_STATE_FILE.write_text(
                json.dumps(_gs), encoding="utf-8"
            )
    except Exception:
        pass
    team_store = TeamStore()
    server, base_url = start_server(team_store)
    api = DesktopApi(team_store)
    api.base_url = base_url

    webview.settings["OPEN_EXTERNAL_LINKS_IN_BROWSER"] = False
    api.selector_window = webview.create_window(
        "Choose Scoreboard Display",
        f"{base_url}/assets/startup.html?v=2",
        js_api=api,
        width=620,
        height=560,
        min_size=(520, 460),
        resizable=True,
        background_color="#050709",
        text_select=False,
    )

    try:
        webview.start(
            private_mode=False,
            storage_path=str(WEBVIEW_STORAGE_DIR),
            debug=False,
        )
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
