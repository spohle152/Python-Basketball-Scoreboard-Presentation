// Load player records from teams.json and group them by team for the selector.
var teamsFile = JSON.parse(teams);
var teams = [];
var firstNames = [];
var lastNames = [];
var cards = [];
var renderedElements = [];
var selectedHome = "";
var selectedVisitor = "";
var textMeasureCanvas = document.createElement('canvas');
var textMeasureContext = textMeasureCanvas.getContext('2d');

function measuredTextWidth(element, fontSize) {
    var style = window.getComputedStyle(element);
    var text = element.textContent || '';
    if (style.textTransform == 'uppercase') text = text.toUpperCase();
    if (style.textTransform == 'lowercase') text = text.toLowerCase();

    textMeasureContext.font = [
        style.fontStyle,
        style.fontVariant,
        style.fontWeight,
        fontSize + 'px',
        style.fontFamily
    ].join(' ');

    var letterSpacing = parseFloat(style.letterSpacing) || 0;
    return textMeasureContext.measureText(text).width
        + Math.max(0, text.length - 1) * letterSpacing;
}

function fitPlayerButton(button) {
    button.style.fontSize = '';
    button.title = button.textContent;

    requestAnimationFrame(function() {
        var maxSize = parseFloat(window.getComputedStyle(button).fontSize);
        var minSize = 6;
        var style = window.getComputedStyle(button);
        var available = button.clientWidth
            - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        // Native button text can render wider than canvas measurements.
        // Reserve enough room to keep the final glyphs comfortably visible.
        available *= 0.80;

        if (measuredTextWidth(button, maxSize) <= available) return;

        var low = minSize;
        var high = maxSize;
        while (high - low > 0.25) {
            var size = (low + high) / 2;
            if (measuredTextWidth(button, size) <= available) {
                low = size;
            } else {
                high = size;
            }
        }
        if (measuredTextWidth(button, low) > available) {
            low = Math.max(1, low * available / measuredTextWidth(button, low));
        }
        button.style.fontSize = low + 'px';
    });
}

function fitRenderedPlayerButtons() {
    for (var element = 0; element < renderedElements.length; element += 1) {
        if (renderedElements[element].tagName == 'BUTTON') {
            fitPlayerButton(renderedElements[element]);
        }
    }
}

const bc = new BroadcastChannel("channel");
var body = document.getElementById('body');
var intros = document.getElementById('intros');
var clearBtn = document.getElementById('clear');

intros.addEventListener("click", function() {
    // The main controller owns audio playback, so this page only requests it.
    bc.postMessage("intro_music");
});

clearBtn.addEventListener("click", function() {
    bc.postMessage("clear_audio");
});

// Build one button per player, but only render the teams selected on the main
// controller. Clicking a button tells display_app.js which introduction to show.
for (player = 0; player < teamsFile.length; player += 1) {
    if (teams.find((element) => element == teamsFile[player].TeamName) == null) {
        teams.push(teamsFile[player].TeamName);
        firstNames.push([]);
        lastNames.push([]);
        cards.push([]);
    }
    index = teams.indexOf(teamsFile[player].TeamName);
    firstNames[index].push(teamsFile[player].FirstName);
    lastNames[index].push(teamsFile[player].LastName);
    cards[index].push(document.createElement('button'));
}

for (i=0; i < teams.length; i+=1) {
    for (j=0; j < firstNames[i].length; j+=1) {
        cards[i][j].textContent = firstNames[i][j] + " " + lastNames[i][j];
        cards[i][j].classList.add('button');
        cards[i][j].addEventListener("click", function() {
            var a;
            var b;
            for (k=0; k<cards.length; k+=1) {
                if(cards[k].indexOf(this)!=(-1)) {
                    a = k;
                    b = cards[k].indexOf(this);
                }
            }
            if(cards[a][b].classList.contains("active_button")) {
                cards[a][b].classList.remove("active_button");
                bc.postMessage("intro_off");
            } else {
                cards[a][b].classList.add("active_button");
                bc.postMessage("intro_on&" + encodeURIComponent(firstNames[a][b]) + "&" + encodeURIComponent(lastNames[a][b]) + "&" + encodeURIComponent(teams[a]));
            }
            for (k=0; k<cards.length; k+=1) {
                for (l=0; l<cards[k].length; l+=1) {
                    if (!(k == a && l == b)) {
                        cards[k][l].classList.remove("active_button");
                    }
                }
            }
        });
    }
}

function clearRenderedTeams() {
    var clearedActiveIntroduction = false;
    for (var element = 0; element < renderedElements.length; element += 1) {
        if (renderedElements[element].classList.contains('active_button')) {
            renderedElements[element].classList.remove('active_button');
            clearedActiveIntroduction = true;
        }
        renderedElements[element].remove();
    }
    renderedElements = [];
    if (clearedActiveIntroduction) {
        bc.postMessage("intro_off");
    }
}

function renderSelectedTeams() {
    clearRenderedTeams();

    var selectedTeams = [selectedHome, selectedVisitor].filter(function(teamName, position, list) {
        return teamName && list.indexOf(teamName) == position && teams.indexOf(teamName) != -1;
    });

    if (selectedTeams.length == 0) {
        var waitingMessage = document.createElement('p');
        waitingMessage.classList.add('empty-state');
        waitingMessage.innerHTML = "Waiting for team selections from the main controller.";
        body.appendChild(waitingMessage);
        renderedElements.push(waitingMessage);
        return;
    }

    for (var selected = 0; selected < selectedTeams.length; selected += 1) {
        var teamIndex = teams.indexOf(selectedTeams[selected]);
        var heading = document.createElement('h2');
        heading.innerHTML = teams[teamIndex];
        body.appendChild(heading);
        renderedElements.push(heading);

        for (var playerIndex = 0; playerIndex < cards[teamIndex].length; playerIndex += 1) {
            body.appendChild(cards[teamIndex][playerIndex]);
            renderedElements.push(cards[teamIndex][playerIndex]);
            fitPlayerButton(cards[teamIndex][playerIndex]);
        }
    }
}

bc.onmessage = function(event) {
    var message = String(event.data).split("&");

    if (message[0] == "teams_updated") {
        window.location.reload();
    } else if (message[0] == "selected_teams") {
        var nextHome = decodeURIComponent(message[1] || "");
        var nextVisitor = decodeURIComponent(message[2] || "");
        if (selectedHome != nextHome || selectedVisitor != nextVisitor) {
            selectedHome = nextHome;
            selectedVisitor = nextVisitor;
            renderSelectedTeams();
        }
    } else if (message[0] == "home_name") {
        var nextHome = decodeURIComponent(message[1] || "");
        if (selectedHome != nextHome) {
            selectedHome = nextHome;
            renderSelectedTeams();
        }
    } else if (message[0] == "visitor_name") {
        var nextVisitor = decodeURIComponent(message[1] || "");
        if (selectedVisitor != nextVisitor) {
            selectedVisitor = nextVisitor;
            renderSelectedTeams();
        }
    }
};

renderSelectedTeams();
bc.postMessage("selected_teams_request");

window.addEventListener('resize', fitRenderedPlayerButtons);
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitRenderedPlayerButtons);
}

window.addEventListener('beforeunload', function () {
    bc.postMessage("intro_off");
    for (k=0; k<cards.length; k+=1) {
        for (l=0; l<cards[k].length; l+=1) {
            cards[k][l].classList.remove("active_button");
        }
    }
});
