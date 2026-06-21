var cards = [];
var activePicture = null;

const bc = new BroadcastChannel("channel");
var body = document.getElementById('body');
var statusEl = document.getElementById('pic-status');

function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'pic-status' + (type ? ' ' + type : '');
}

function build_picture_cards(files) {
    body.querySelectorAll('.pic-card').forEach(function(c) { c.remove(); });
    cards = [];

    for (var i = 0; i < files.length; i++) {
        (function(filename) {
            var wrapper = document.createElement('div');
            wrapper.className = 'pic-card';

            var btn = document.createElement('button');
            btn.className = 'pic-btn';
            btn.dataset.filename = filename;
            var img = document.createElement('img');
            img.src = 'Pictures/' + filename;
            img.alt = filename;
            btn.appendChild(img);

            var del = document.createElement('button');
            del.className = 'pic-delete';
            del.innerHTML = '&#x1F5D1;';
            del.setAttribute('aria-label', 'Delete ' + filename);
            del.title = 'Delete ' + filename;

            wrapper.appendChild(btn);
            wrapper.appendChild(del);
            body.appendChild(wrapper);
            cards.push(btn);

            btn.addEventListener('click', function() {
                if (btn.classList.contains('active_button')) {
                    btn.classList.remove('active_button');
                    activePicture = null;
                    bc.postMessage('picture_off');
                } else {
                    cards.forEach(function(c) { c.classList.remove('active_button'); });
                    btn.classList.add('active_button');
                    activePicture = filename;
                    bc.postMessage('picture_on&' + filename);
                }
            });

            del.addEventListener('click', function(e) {
                e.stopPropagation();
                deletePicture(filename, btn);
            });
        })(files[i]);
    }
}

async function loadPictures() {
    try {
        var assets;
        if (window.pywebview && window.pywebview.api) {
            assets = await window.pywebview.api.get_asset_lists();
        } else {
            var r = await fetch('/api/assets');
            assets = await r.json();
        }
        build_picture_cards(assets.pictures || []);
    } catch (e) {
        setStatus('Failed to load pictures: ' + e, 'error');
    }
}

async function deletePicture(filename, btn) {
    if (!confirm('Delete "' + filename + '"?\nThis cannot be undone.')) return;
    setStatus('Deleting…');
    try {
        var result;
        if (window.pywebview && window.pywebview.api) {
            result = await window.pywebview.api.delete_picture(filename);
        } else {
            result = { ok: false, error: 'Requires desktop app.' };
        }
        if (!result.ok) throw new Error(result.error || 'Delete failed.');
        if (activePicture === filename) {
            activePicture = null;
            bc.postMessage('picture_off');
        }
        setStatus('Deleted "' + filename + '".', 'success');
        loadPictures();
    } catch (e) {
        setStatus(e.message || String(e), 'error');
    }
}

function uploadPicture(file) {
    if (!file) return;
    var ext = file.name.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
        setStatus('Only .jpg and .png files are allowed.', 'error');
        return;
    }
    setStatus('Uploading "' + file.name + '"…');
    var reader = new FileReader();
    reader.onload = async function(e) {
        try {
            var result;
            if (window.pywebview && window.pywebview.api) {
                result = await window.pywebview.api.upload_picture(file.name, e.target.result);
            } else {
                result = { ok: false, error: 'Requires desktop app.' };
            }
            if (!result.ok) throw new Error(result.error || 'Upload failed.');
            setStatus('Added "' + file.name + '".', 'success');
            loadPictures();
        } catch (err) {
            setStatus(err.message || String(err), 'error');
        }
    };
    reader.onerror = function() {
        setStatus('Failed to read file.', 'error');
    };
    reader.readAsDataURL(file);
}

document.getElementById('add-picture-file').addEventListener('change', function() {
    uploadPicture(this.files[0]);
    this.value = '';
});

window.addEventListener('beforeunload', function() {
    bc.postMessage('picture_off');
});

if (window.pywebview) {
    window.addEventListener('pywebviewready', loadPictures);
} else {
    window.addEventListener('load', loadPictures);
}
