var selectedScreen = null;
var launchButton = document.getElementById('launch');
var screenList = document.getElementById('screen-list');
var errorMessage = document.getElementById('error');

function showScreens(screens) {
    screenList.innerHTML = '';
    if (!screens.length) {
        screenList.innerHTML = '<div class="loading">No displays were detected.</div>';
        return;
    }

    screens.forEach(function(screen) {
        var option = document.createElement('button');
        option.type = 'button';
        option.className = 'screen-option';
        option.innerHTML =
            '<span class="screen-number">' + (screen.index + 1) + '</span>' +
            '<span><span class="screen-name">' + screen.label + '</span><br>' +
            '<span class="screen-size">' + screen.width + ' × ' + screen.height + ' logical pixels</span></span>' +
            '<span class="screen-size">' + screen.physical_width + ' × ' + screen.physical_height + '</span>';
        option.addEventListener('click', function() {
            document.querySelectorAll('.screen-option').forEach(function(item) {
                item.classList.remove('selected');
            });
            option.classList.add('selected');
            selectedScreen = screen.index;
            launchButton.disabled = false;
        });
        screenList.appendChild(option);
    });

    if (screens.length === 1) {
        screenList.querySelector('.screen-option').click();
    }

    var noDisplay = document.createElement('button');
    noDisplay.type = 'button';
    noDisplay.className = 'screen-option no-display-option';
    noDisplay.innerHTML =
        '<span><span class="screen-name">No Display</span><br>' +
        '<span class="screen-size">Testing mode — scoreboard output is disabled</span></span>';
    noDisplay.addEventListener('click', function() {
        document.querySelectorAll('.screen-option').forEach(function(item) {
            item.classList.remove('selected');
        });
        noDisplay.classList.add('selected');
        selectedScreen = -1;
        launchButton.disabled = false;
    });
    screenList.appendChild(noDisplay);
}

async function loadScreens() {
    try {
        var screens = await window.pywebview.api.get_screens();
        showScreens(screens);
    } catch (error) {
        errorMessage.textContent = 'Unable to detect displays: ' + error;
    }
}

launchButton.addEventListener('click', async function() {
    if (selectedScreen === null) return;
    launchButton.disabled = true;
    launchButton.textContent = 'Launching…';
    errorMessage.textContent = '';
    try {
        var result = await window.pywebview.api.launch(selectedScreen);
        if (!result.ok) {
            throw new Error(result.error || 'Unable to launch the scoreboard.');
        }
    } catch (error) {
        errorMessage.textContent = error.message || String(error);
        launchButton.disabled = false;
        launchButton.textContent = 'Launch Scoreboard';
    }
});

window.addEventListener('pywebviewready', loadScreens);
