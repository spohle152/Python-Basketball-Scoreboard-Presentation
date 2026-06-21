var statusEl = document.getElementById('status');
var mm_bc = new BroadcastChannel("channel");

var now_playing_music_track = '';
var now_playing_intro_track = '';

mm_bc.onmessage = function(event) {
    if (typeof event.data !== 'string') return;
    if (event.data.startsWith('now_playing_music&')) {
        now_playing_music_track = event.data.substring('now_playing_music&'.length);
        updateNowPlayingDisplay();
    } else if (event.data.startsWith('now_playing_intro&')) {
        now_playing_intro_track = event.data.substring('now_playing_intro&'.length);
        updateNowPlayingDisplay();
    } else if (event.data === 'now_playing_clear') {
        now_playing_music_track = '';
        now_playing_intro_track = '';
        updateNowPlayingDisplay();
    } else if (event.data === 'tracks_updated') {
        loadTracks();
    }
};

function updateNowPlayingDisplay() {
    var el = document.getElementById('now-playing');
    if (!el) return;
    if (now_playing_intro_track) {
        el.className = 'now-playing active';
        el.textContent = '♫ Now Playing (Introduction): ' + now_playing_intro_track;
    } else if (now_playing_music_track) {
        el.className = 'now-playing active';
        el.textContent = '♫ Now Playing (Intermission): ' + now_playing_music_track;
    } else {
        el.className = 'now-playing';
        el.textContent = '';
    }
    updatePlayButtonStates();
}

function updatePlayButtonStates() {
    document.querySelectorAll('.play-track').forEach(function(btn) {
        var cat = btn.getAttribute('data-play-category');
        var file = btn.getAttribute('data-play-filename');
        var isPlaying = (cat === 'music' && file === now_playing_music_track && now_playing_music_track !== '') ||
                        (cat === 'intros' && file === now_playing_intro_track && now_playing_intro_track !== '');
        btn.classList.toggle('playing', isPlaying);
        btn.textContent = isPlaying ? '▶ Playing' : '▶ Play';
    });
}

function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (type ? ' ' + type : '');
}

function buildTrackList(container, tracks, category) {
    container.innerHTML = '';
    if (!tracks.length) {
        var empty = document.createElement('div');
        empty.className = 'empty-tracks';
        empty.textContent = 'No tracks yet. Add an .mp3 file to get started.';
        container.appendChild(empty);
        return;
    }
    tracks.forEach(function(filename) {
        var row = document.createElement('div');
        row.className = 'track-row';

        var icon = document.createElement('span');
        icon.className = 'track-icon';
        icon.textContent = '♫';

        var name = document.createElement('span');
        name.className = 'track-name';
        name.textContent = filename;

        var playBtn = document.createElement('button');
        playBtn.className = 'play-track';
        playBtn.setAttribute('data-play-category', category);
        playBtn.setAttribute('data-play-filename', filename);
        var isPlaying = (category === 'music' && filename === now_playing_music_track && now_playing_music_track !== '') ||
                        (category === 'intros' && filename === now_playing_intro_track && now_playing_intro_track !== '');
        playBtn.classList.toggle('playing', isPlaying);
        playBtn.textContent = isPlaying ? '▶ Playing' : '▶ Play';
        playBtn.addEventListener('click', function() {
            if (playBtn.classList.contains('playing')) {
                mm_bc.postMessage('clear_audio');
            } else {
                mm_bc.postMessage('play_' + category + '_track&' + filename);
            }
        });

        var del = document.createElement('button');
        del.className = 'danger';
        del.textContent = 'Delete';
        del.addEventListener('click', function() {
            deleteTrack(category, filename);
        });

        row.appendChild(icon);
        row.appendChild(name);
        row.appendChild(playBtn);
        row.appendChild(del);
        container.appendChild(row);
    });
}

function buildAnthemSection(container, exists, displayName) {
    container.innerHTML = '';
    if (!exists) {
        var empty = document.createElement('div');
        empty.className = 'empty-tracks';
        empty.textContent = 'No anthem file found. Upload an .mp3 to get started.';
        container.appendChild(empty);
        return;
    }
    var row = document.createElement('div');
    row.className = 'track-row';
    var icon = document.createElement('span');
    icon.className = 'track-icon';
    icon.textContent = '♫';
    var name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = displayName || 'anthem.mp3';
    row.appendChild(icon);
    row.appendChild(name);
    container.appendChild(row);
}

async function loadTracks() {
    setStatus('Loading…');
    try {
        var assets;
        if (window.pywebview && window.pywebview.api) {
            assets = await window.pywebview.api.get_asset_lists();
        } else {
            var r = await fetch('/api/assets');
            assets = await r.json();
        }
        buildTrackList(document.getElementById('music-list'), assets.music || [], 'music');
        buildTrackList(document.getElementById('intros-list'), assets.intros || [], 'intros');
        buildAnthemSection(
            document.getElementById('anthem-status-area'),
            !!assets.anthem_exists,
            assets.anthem_name || null
        );
        setStatus('');
        mm_bc.postMessage('now_playing_request');
    } catch (e) {
        setStatus('Failed to load: ' + e, 'error');
    }
}

async function deleteTrack(category, filename) {
    if (!confirm('Delete "' + filename + '"?\nThis cannot be undone.')) return;
    setStatus('Deleting…');
    try {
        var result;
        if (window.pywebview && window.pywebview.api) {
            result = await window.pywebview.api.delete_track(category, filename);
        } else {
            result = { ok: false, error: 'Requires desktop app.' };
        }
        if (!result.ok) throw new Error(result.error || 'Delete failed.');
        setStatus('Deleted "' + filename + '".', 'success');
        mm_bc.postMessage('tracks_updated');
        loadTracks();
    } catch (e) {
        setStatus(e.message || String(e), 'error');
    }
}

function uploadTrack(category, file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.mp3')) {
        setStatus('Only .mp3 files are allowed.', 'error');
        return;
    }
    setStatus('Uploading "' + file.name + '"…');
    var reader = new FileReader();
    reader.onload = async function(e) {
        try {
            var result;
            if (window.pywebview && window.pywebview.api) {
                result = await window.pywebview.api.upload_track(category, file.name, e.target.result);
            } else {
                result = { ok: false, error: 'Requires desktop app.' };
            }
            if (!result.ok) throw new Error(result.error || 'Upload failed.');
            setStatus('Added "' + (result.filename || file.name) + '".', 'success');
            mm_bc.postMessage('tracks_updated');
            loadTracks();
        } catch (err) {
            setStatus(err.message || String(err), 'error');
        }
    };
    reader.onerror = function() { setStatus('Failed to read file.', 'error'); };
    reader.readAsDataURL(file);
}

function uploadAnthem(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.mp3')) {
        setStatus('Only .mp3 files are allowed.', 'error');
        return;
    }
    setStatus('Uploading anthem…');
    var reader = new FileReader();
    reader.onload = async function(e) {
        try {
            var result;
            if (window.pywebview && window.pywebview.api) {
                result = await window.pywebview.api.upload_anthem(file.name, e.target.result);
            } else {
                result = { ok: false, error: 'Requires desktop app.' };
            }
            if (!result.ok) throw new Error(result.error || 'Upload failed.');
            buildAnthemSection(document.getElementById('anthem-status-area'), true, file.name);
            setStatus('Anthem replaced — "' + file.name + '".', 'success');
            mm_bc.postMessage('anthem_updated');
        } catch (err) {
            setStatus(err.message || String(err), 'error');
        }
    };
    reader.onerror = function() { setStatus('Failed to read file.', 'error'); };
    reader.readAsDataURL(file);
}

// Tab switching
document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
});

document.getElementById('add-music-file').addEventListener('change', function() {
    uploadTrack('music', this.files[0]);
    this.value = '';
});
document.getElementById('add-intros-file').addEventListener('change', function() {
    uploadTrack('intros', this.files[0]);
    this.value = '';
});
document.getElementById('add-anthem-file').addEventListener('change', function() {
    uploadAnthem(this.files[0]);
    this.value = '';
});

if (window.pywebview) {
    window.addEventListener('pywebviewready', loadTracks);
} else {
    window.addEventListener('load', loadTracks);
}
