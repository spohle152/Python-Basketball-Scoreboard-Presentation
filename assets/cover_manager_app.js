var statusEl = document.getElementById('status');
var cm_bc = new BroadcastChannel("channel");

function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (type ? ' ' + type : '');
}

function buildImageSection(container, exists, displayName, imgSrc) {
    container.innerHTML = '';
    if (!exists) {
        var empty = document.createElement('div');
        empty.className = 'empty-tracks';
        empty.textContent = 'No file found. Upload a .jpg or .png to get started.';
        container.appendChild(empty);
        return;
    }
    var row = document.createElement('div');
    row.className = 'track-row';

    var thumb = document.createElement('img');
    thumb.className = 'asset-thumb';
    thumb.src = imgSrc + '?' + Date.now();
    thumb.alt = displayName;
    row.appendChild(thumb);

    var name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = displayName;
    row.appendChild(name);

    container.appendChild(row);
}

async function loadAssets() {
    setStatus('Loading…');
    try {
        var assets;
        if (window.pywebview && window.pywebview.api) {
            assets = await window.pywebview.api.get_asset_lists();
        } else {
            var r = await fetch('/api/assets');
            assets = await r.json();
        }
        buildImageSection(
            document.getElementById('flag-status-area'),
            !!assets.flag_exists,
            assets.flag_name || 'american flag.jpg',
            'american flag.jpg'
        );
        buildImageSection(
            document.getElementById('logo-status-area'),
            !!assets.logo_exists,
            assets.logo_name || 'logo.png',
            'logo.png'
        );
        setStatus('');
    } catch (e) {
        setStatus('Failed to load: ' + e, 'error');
    }
}

function uploadImage(apiMethod, broadcastMsg, statusAreaId, imgSrc, file) {
    if (!file) return;
    var ext = file.name.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
        setStatus('Only .jpg, .jpeg, or .png files are allowed.', 'error');
        return;
    }
    setStatus('Uploading "' + file.name + '"…');
    var reader = new FileReader();
    reader.onload = async function(e) {
        try {
            var result;
            if (window.pywebview && window.pywebview.api) {
                result = await window.pywebview.api[apiMethod](file.name, e.target.result);
            } else {
                result = { ok: false, error: 'Requires desktop app.' };
            }
            if (!result.ok) throw new Error(result.error || 'Upload failed.');
            buildImageSection(document.getElementById(statusAreaId), true, file.name, imgSrc);
            setStatus('Replaced — "' + file.name + '".', 'success');
            cm_bc.postMessage(broadcastMsg);
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

document.getElementById('add-flag-file').addEventListener('change', function() {
    uploadImage('upload_flag', 'flag_updated', 'flag-status-area', 'american flag.jpg', this.files[0]);
    this.value = '';
});
document.getElementById('add-logo-file').addEventListener('change', function() {
    uploadImage('upload_logo', 'logo_updated', 'logo-status-area', 'logo.png', this.files[0]);
    this.value = '';
});

if (window.pywebview) {
    window.addEventListener('pywebviewready', loadAssets);
} else {
    window.addEventListener('load', loadAssets);
}
