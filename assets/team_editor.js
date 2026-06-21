var teamsContainer = document.getElementById('teams');
var addTeamButton = document.getElementById('add-team');
var saveButton = document.getElementById('save');
var statusMessage = document.getElementById('status');
var teamTemplate = document.getElementById('team-template');
var playerTemplate = document.getElementById('player-template');

function setStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status' + (type ? ' ' + type : '');
}

function updateEmptyPlayers(teamCard) {
    var players = teamCard.querySelector('.players');
    var empty = players.querySelector('.empty-players');
    var hasRows = Boolean(players.querySelector('.player-row'));
    if (!hasRows && !empty) {
        empty = document.createElement('div');
        empty.className = 'empty-players';
        empty.textContent = 'No players yet. Add at least one player before saving this team.';
        players.appendChild(empty);
    } else if (hasRows && empty) {
        empty.remove();
    }
}

function addPlayer(teamCard, player) {
    var row = playerTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('.player-number').value = player && player.player_number ? player.player_number : '';
    row.querySelector('.first-name').value = player && player.first_name ? player.first_name : '';
    row.querySelector('.last-name').value = player && player.last_name ? player.last_name : '';
    row.querySelector('.remove-player').addEventListener('click', function() {
        row.remove();
        updateEmptyPlayers(teamCard);
    });
    teamCard.querySelector('.players').appendChild(row);
    updateEmptyPlayers(teamCard);
}

function setLogo(card, logo, previewUrl) {
    var preview = card.querySelector('.logo-preview');
    var image = preview.querySelector('img');
    var removeButton = card.querySelector('.remove-logo');
    card.dataset.logo = logo || '';
    preview.classList.toggle('empty', !logo);
    image.src = logo ? (previewUrl || '/team-logos/' + encodeURIComponent(logo)) : '';
    image.alt = logo ? 'Team logo preview' : '';
    removeButton.disabled = !logo;
}

function readFile(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function() { reject(new Error('Unable to read that image.')); };
        reader.readAsDataURL(file);
    });
}

async function uploadLogo(card, file) {
    if (!file) return;
    var chooseText = card.querySelector('.file-button span');
    chooseText.textContent = 'Uploading…';
    try {
        var dataUrl = await readFile(file);
        var result = await window.pywebview.api.upload_team_logo(file.name, dataUrl);
        if (!result.ok) throw new Error(result.error || 'Unable to upload logo.');
        setLogo(card, result.logo, result.url);
        setStatus('Logo ready. Save changes to attach it to this team.', 'success');
    } catch (error) {
        setStatus(error.message || String(error), 'error');
    } finally {
        chooseText.textContent = 'Choose Logo';
        card.querySelector('.logo-file').value = '';
    }
}

function addTeam(team) {
    var card = teamTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('.team-name').value = team && team.name ? team.name : '';
    setLogo(card, team && team.logo ? team.logo : '');
    card.querySelector('.logo-file').addEventListener('change', function() {
        uploadLogo(card, this.files[0]);
    });
    card.querySelector('.remove-logo').addEventListener('click', function() {
        setLogo(card, '');
    });
    card.querySelector('.add-player').addEventListener('click', function() {
        addPlayer(card, null);
    });
    card.querySelector('.remove-team').addEventListener('click', function() {
        card.remove();
    });
    teamsContainer.appendChild(card);

    var players = team && Array.isArray(team.players) ? team.players : [];
    players.forEach(function(player) {
        addPlayer(card, player);
    });
    updateEmptyPlayers(card);
    if (!team) card.querySelector('.team-name').focus();
}

function collectTeams() {
    return {
        teams: Array.from(teamsContainer.querySelectorAll('.team-card')).map(function(card) {
            return {
                name: card.querySelector('.team-name').value.trim(),
                logo: card.dataset.logo || '',
                players: Array.from(card.querySelectorAll('.player-row')).map(function(row) {
                    return {
                        player_number: row.querySelector('.player-number').value.trim(),
                        first_name: row.querySelector('.first-name').value.trim(),
                        last_name: row.querySelector('.last-name').value.trim()
                    };
                }).filter(function(player) {
                    return player.first_name || player.last_name;
                })
            };
        })
    };
}

async function loadTeams() {
    setStatus('Loading teams…');
    try {
        var data = await window.pywebview.api.get_teams();
        teamsContainer.innerHTML = '';
        data.teams.forEach(addTeam);
        if (!data.teams.length) addTeam(null);
        setStatus('');
    } catch (error) {
        setStatus('Unable to load teams: ' + error, 'error');
    }
}

addTeamButton.addEventListener('click', function() {
    addTeam(null);
});

saveButton.addEventListener('click', async function() {
    saveButton.disabled = true;
    setStatus('Saving…');
    try {
        var result = await window.pywebview.api.save_teams(collectTeams());
        if (!result.ok) throw new Error(result.error || 'Unable to save teams.');
        setStatus('Teams and rosters saved. Controller pages have been refreshed.', 'success');
    } catch (error) {
        setStatus(error.message || String(error), 'error');
    } finally {
        saveButton.disabled = false;
    }
});

window.addEventListener('pywebviewready', loadTeams);
