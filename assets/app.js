//User Variables
var music_files = [];
var intro_files = [];

//Music and buzzer buttons
var music = document.getElementById('music');
var intros = document.getElementById('intros');
var anthem = document.getElementById('anthem');
var clear = document.getElementById('clear');
var buzzer = document.getElementById('buzzer');
var timeoutThirty = document.getElementById('timeoutThirty');
var timeoutFourtyFive = document.getElementById('timeoutFourtyFive');
var timeoutMinute = document.getElementById('timeoutMinute');
//Period
var m_per = document.getElementById('m_per');
var p_per = document.getElementById('p_per');
var num_per = document.getElementById('num_per');
var total_per = document.getElementById('total_per');
//Score
var h_score = document.getElementById('h_score');
var v_score = document.getElementById('v_score');
var h_p3 = document.getElementById('h_p3');
var h_p2 = document.getElementById('h_p2');
var h_p1 = document.getElementById('h_p1');
var h_m1 = document.getElementById('h_m1');
var v_p3 = document.getElementById('v_p3');
var v_p2 = document.getElementById('v_p2');
var v_p1 = document.getElementById('v_p1');
var v_m1 = document.getElementById('v_m1');
var differential = document.getElementById('differential');
//Fouls
var h_foul = document.getElementById('h_foul');
var h_foul_p1 = document.getElementById('h_foul_p1');
var h_foul_m1 = document.getElementById('h_foul_m1');
var h_bonus = document.getElementById('h_bonus');
var h_d_bonus = document.getElementById('h_d_bonus');
var v_foul = document.getElementById('v_foul');
var v_foul_p1 = document.getElementById('v_foul_p1');
var v_foul_m1 = document.getElementById('v_foul_m1');
var v_bonus = document.getElementById('v_bonus');
var v_d_bonus = document.getElementById('v_d_bonus');
//Resets
var reset = document.getElementById('reset');
var reset_fouls = document.getElementById('reset_fouls');
//Possession
var r_poss = document.getElementById('right_possession');
var l_poss = document.getElementById('left_possession');
//Timeouts Left
var v_tol_p1 = document.getElementById('v_tol_p1');
var v_tol_m1 = document.getElementById('v_tol_m1');
var h_tol_p1 = document.getElementById('h_tol_p1');
var h_tol_m1 = document.getElementById('h_tol_m1');
var v_tol = document.getElementById('v_tol');
var h_tol = document.getElementById('h_tol');
//Display Controls
var freeze = document.getElementById('freeze');
var cover = document.getElementById('cover');
var flag = document.getElementById('flag');
var countdown_time = document.getElementById('countdown_time');
var countdown = document.getElementById('countdown');
var h_name = document.getElementById('h_name');
var v_name = document.getElementById('v_name');
var open_display = document.getElementById('open_display');
var open_introductions = document.getElementById('open_introductions');
var open_pictures = document.getElementById('open_pictures');
var manage_teams = document.getElementById('manage_teams');
var manage_music = document.getElementById('manage_music');
var manage_cover = document.getElementById('manage_cover');
var visitor = document.getElementById('visitor');
var home = document.getElementById('home');
//Time
var time_display = document.getElementById('time_display');
var min_enter = document.getElementById('min');
var sec_enter = document.getElementById('sec');
var tenth_enter = document.getElementById('tenth');
var update_time = document.getElementById('update_time');
var time_in = document.getElementById('time_in');
var now_time = new Date();
var previous_time = new Date();
//Colors
var h_r_color = document.getElementById('h_r_color');
var h_g_color = document.getElementById('h_g_color');
var h_b_color = document.getElementById('h_b_color');
var v_r_color = document.getElementById('v_r_color');
var v_g_color = document.getElementById('v_g_color');
var v_b_color = document.getElementById('v_b_color');
//Visibility
var show_score = document.getElementById('show_score');
var show_foul = document.getElementById('show_foul');
var show_tol = document.getElementById('show_tol');
//Volume Controls
var buzzervol = document.getElementById('buzzervol');
var introvol = document.getElementById('introvol');
var musicvol = document.getElementById('musicvol');
var anthemvol = document.getElementById('anthemvol');
//Initial Values
var period = 1;
var home_score = 0;
var visitor_score = 0;
var home_fouls = 0;
var visitor_fouls = 0;
var home_tol = 0;
var visitor_tol = 0;
var home_poss = 0;
var visitor_poss = 0;
var num_periods = 4;
var min = 8;
var sec = 0;
var tenth = 0;
var h_color = [0, 255, 0];
var v_color = [255, 255, 255];
var player_foul = null;
var home_player_fouls = {};
var visitor_player_fouls = {};
var clock_interval;
var audio = new Audio();
var prev_played = [];
var current_music_track = '';
var current_intro_track = '';

musicvol.addEventListener('input', function() {
  audio.volume = this.value/100;
  schedule_save();
});
var intro = new Audio();
introvol.addEventListener('input', function() {
  intro.volume = this.value/100;
  schedule_save();
});
var anthem_music = new Audio ('assets/anthem.mp3');
anthemvol.addEventListener('input', function() {
  anthem_music.volume = this.value/100;
  schedule_save();
});
var buzzer_audio = new Audio('assets/buzzer.mp3');
var long_buzzer_audio = new Audio('assets/long_buzzer.mp3');
buzzer_audio.preload = 'auto';
long_buzzer_audio.preload = 'auto';
buzzer_audio.load();
long_buzzer_audio.load();

var BuzzerAudioContext = window.AudioContext || window.webkitAudioContext;
var buzzer_audio_context = null;
var buzzer_audio_buffers = {short: null, long: null};
var active_buzzer_sources = {short: null, long: null};

if (BuzzerAudioContext) {
  try {
    buzzer_audio_context = new BuzzerAudioContext({latencyHint: 'interactive'});
    preload_buzzer_buffer('short', 'assets/buzzer.mp3');
    preload_buzzer_buffer('long', 'assets/long_buzzer.mp3');
  } catch (error) {
    buzzer_audio_context = null;
  }
}

function preload_buzzer_buffer(name, url) {
  fetch(url)
    .then(function(response) { return response.arrayBuffer(); })
    .then(function(data) { return buzzer_audio_context.decodeAudioData(data); })
    .then(function(buffer) { buzzer_audio_buffers[name] = buffer; })
    .catch(function(error) { console.warn('Unable to preload buzzer audio:', error); });
}

function unlock_buzzer_audio() {
  if (buzzer_audio_context && buzzer_audio_context.state === 'suspended') {
    buzzer_audio_context.resume().catch(function() {});
  }
}

document.addEventListener('pointerdown', unlock_buzzer_audio, {capture: true});
document.addEventListener('keydown', unlock_buzzer_audio, {capture: true});

function play_buzzer_sound(name) {
  var fallbackAudio = name === 'long' ? long_buzzer_audio : buzzer_audio;

  function playFallback() {
    fallbackAudio.pause();
    fallbackAudio.currentTime = 0;
    fallbackAudio.volume = buzzervol.value / 100;
    var playResult = fallbackAudio.play();
    if (playResult && playResult.catch) playResult.catch(function() {});
  }

  function playDecodedBuffer() {
    var buffer = buzzer_audio_buffers[name];
    if (!buffer || !buzzer_audio_context) {
      playFallback();
      return;
    }

    if (active_buzzer_sources[name]) {
      try { active_buzzer_sources[name].stop(); } catch (error) {}
    }

    var source = buzzer_audio_context.createBufferSource();
    var gain = buzzer_audio_context.createGain();
    source.buffer = buffer;
    gain.gain.value = buzzervol.value / 100;
    source.connect(gain);
    gain.connect(buzzer_audio_context.destination);
    active_buzzer_sources[name] = source;
    source.onended = function() {
      if (active_buzzer_sources[name] === source) active_buzzer_sources[name] = null;
    };
    source.start(0, Math.min(0.02, buffer.duration));
  }

  if (!buzzer_audio_context || !buzzer_audio_buffers[name]) {
    playFallback();
  } else if (buzzer_audio_context.state === 'suspended') {
    buzzer_audio_context.resume().then(playDecodedBuffer).catch(playFallback);
  } else {
    playDecodedBuffer();
  }
}

function play_short_buzzer() {
  play_buzzer_sound('short');
}

function play_long_buzzer() {
  play_buzzer_sound('long');
}

buzzervol.addEventListener('input', function() {
  buzzer_audio.volume = this.value/100;
  long_buzzer_audio.volume = this.value/100;
  schedule_save();
});
var timeoutThirtyId;
var timeoutFourtyId;
var timeoutMinuteId;
var secondsLeft1;
var secondsLeft2;
var secondsLeft3;
var foulTimeoutId;
var clear_audio_interval;
const bc = new BroadcastChannel("channel");
var iframe = document.getElementById("preview");
iframe.muted = true;

// teams.json is loaded as a script before this file, exposing a JSON string
// named `teams`; build unique team choices from the player records.
var teamsFile = JSON.parse(teams);
var teams = [];
var teamLogos = {};
var teamPlayers = {};

for (player = 0; player < teamsFile.length; player += 1) {
    if (teams.find((element) => element == teamsFile[player].TeamName) == null) {
        teams.push(teamsFile[player].TeamName);
    }
    if (teamsFile[player].TeamLogo) {
        teamLogos[teamsFile[player].TeamName] = teamsFile[player].TeamLogo;
    }
    var _tn = teamsFile[player].TeamName;
    if (!teamPlayers[_tn]) teamPlayers[_tn] = [];
    teamPlayers[_tn].push({
        number: teamsFile[player].PlayerNumber || '',
        first_name: teamsFile[player].FirstName || '',
        last_name: teamsFile[player].LastName || ''
    });
}

for (team = 0; team < teams.length; team += 1) {
    var h_team_option = document.createElement('option');
    h_team_option.innerHTML = teams[team];
    var v_team_option = document.createElement('option');
    v_team_option.innerHTML = teams[team];
    h_name.appendChild(h_team_option);
    v_name.appendChild(v_team_option);
}

bc.onmessage = (event) => {
    // Display and selector windows request or report state over the same channel.
    if (event.data == "Update") {
        update_data();
    }
    if (event.data == "selected_teams_request") {
        broadcast_selected_teams();
    }
    if (event.data == "teams_updated") {
        window.location.reload();
    }
    if (event.data == "anthem_updated") {
        var t = Date.now();
        anthem_music.src = 'assets/anthem.mp3?' + t;
        anthem_music.load();
        anthem_music.volume = anthemvol.value / 100;
        anthem.disabled = false;
        anthem.title = '';
    }
    if (event.data == "flag_updated") {
        flag.disabled = false;
        flag.title = '';
    }
    if (event.data == "tracks_updated") {
        fetch('/api/assets')
            .then(function(r) { return r.json(); })
            .then(applyAssetButtonStates)
            .catch(function() {});
    }
    if (event.data == "clear_audio") {
        clear.click();
    }
    if (event.data == "intro_music") {
        if (intro_files.length === 0) return;
        clearInterval(clear_audio_interval);
        var r = Math.floor(Math.random() * intro_files.length);
        try {
            intro.pause();
        }
        catch (e) {
            console.log(e);
        }
        intro.setAttribute('src', 'assets/Intros/' + intro_files[r]);
        intro.load();
        intro.volume = introvol.value/100;
        var bcIntroPlay = intro.play();
        if (bcIntroPlay && bcIntroPlay.catch) { bcIntroPlay.catch(function() {}); }
        intro.onended = function() {
            intro.pause();
            current_intro_track = '';
            bc.postMessage('now_playing_intro&');
        };
        current_intro_track = intro_files[r];
        bc.postMessage('now_playing_intro&' + current_intro_track);
    }
    if (typeof event.data === 'string' && event.data.startsWith('play_music_track&')) {
        playSpecificMusicTrack(event.data.substring('play_music_track&'.length));
    }
    if (typeof event.data === 'string' && event.data.startsWith('play_intro_track&')) {
        playSpecificIntroTrack(event.data.substring('play_intro_track&'.length));
    }
    if (event.data === 'now_playing_request') {
        bc.postMessage('now_playing_music&' + current_music_track);
        bc.postMessage('now_playing_intro&' + current_intro_track);
    }
    if(event.data == "countdown_finished") {
        play_long_buzzer();
        cover.classList.add("active_button");
        bc.postMessage("Cover");
        setTimeout(function(){
            countdown.classList.remove("active_button");
            bc.postMessage("countdown_off");
            schedule_save();
        }, 4000);
        clearInterval(clear_audio_interval);
        clear_audio_interval = setInterval (function() {
            if ((audio.volume - (0.01) > 0 && !audio.paused) || (intro.volume - (0.01) > 0 && !intro.paused) || (anthem_music.volume - (0.01) > 0 && !anthem_music.paused)) {
                if (audio.volume - (0.01) > 0 && !audio.paused) {
                    audio.volume -= (0.01);
                }
                if (intro.volume - (0.01) > 0 && !intro.paused) {
                    intro.volume -= (0.01);
                }
                if (anthem_music.volume - (0.01) > 0 && !anthem_music.paused) {
                    anthem_music.volume -= (0.01);
                }
            } else {
                audio.pause();
                intro.pause();
                anthem_music.pause();
                clearInterval(clear_audio_interval);
                flag.classList.remove("active_button");
                bc.postMessage("flag_off");
                current_music_track = '';
                current_intro_track = '';
                bc.postMessage('now_playing_clear');
            }
        }, 20);
    }
};
window.addEventListener("load", (event) => {
    fetch('/api/state')
        .then(function(r) { return r.json(); })
        .then(function(state) {
            load_data(state || {});
            change_colors();
        })
        .catch(function() {
            load_data({});
            change_colors();
        });
    fetch('/api/assets')
        .then(function(r) { return r.json(); })
        .then(applyAssetButtonStates)
        .catch(function() {});
});
let keysPressed = {};
document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
    // Keyboard shortcuts mirror the physical controller: space toggles the main
    // clock, arrows pick a side, and number keys add points.
    if (event.key == ' ') {
        document.activeElement.blur();
        if (min != 0 || sec != 0 || tenth != 0) {
            time_in_time_out();
        }
    } else if (keysPressed['Control'] && !(time_in.classList.contains("active_button")) && event.key == '2'){
        time_in_time_out();
    } else if (event.key == '1' && time_in.classList.contains("active_button") && keysPressed['Control']){
        time_in_time_out();
    } else if (event.key == 'Enter') {
        if (document.activeElement == countdown_time) {
            countdown.classList.add("active_button");
            bc.postMessage("countdown_on");
            bc.postMessage("countdown_time&"+countdown_time.value);
        }
        if (document.activeElement == min_enter || document.activeElement == sec_enter || document.activeElement == tenth_enter) {
            min = min_enter.value;
            sec = sec_enter.value;
            tenth = tenth_enter.value;
            update_data();
        }
        document.activeElement.blur();
        update_data();
    }

    if (document.activeElement != h_name && document.activeElement != v_name) {
        if (event.key == 'Shift' && event.location == '2') {
            if (r_poss.classList.contains("active_button")) {
                r_poss.classList.remove("active_button");
            } else {
                r_poss.classList.add("active_button");
                l_poss.classList.remove("active_button");
            }
            document.activeElement.blur();
            update_data();
        } else if (event.key == 'Shift' && event.location == '1') {
            if (l_poss.classList.contains("active_button")) {
                l_poss.classList.remove("active_button");
            } else {
                l_poss.classList.add("active_button");
                r_poss.classList.remove("active_button");
            }
            document.activeElement.blur();
            update_data();
        } else if (event.key == 'ArrowUp') {
            if (period < num_periods) {
                period++; //Go to next period
            }
            update_data(); //Update the content on the screen and in the file
            if ((num_periods / 2 + 1) == period) {
                showConfirm("HALFTIME: Do you need to reset fouls?", function() {
                    h_bonus.classList.remove("active_button");
                    h_d_bonus.classList.remove("active_button");
                    home_fouls = 0;
                    v_bonus.classList.remove("active_button");
                    v_d_bonus.classList.remove("active_button");
                    visitor_fouls = 0;
                    update_data();
                });
            }
            document.activeElement.blur();
        } else if (event.key == 'ArrowDown') {
            if(period != 1) {
                period--; //Go to previous period
            }
            document.activeElement.blur();
            update_data(); //Update the content on the screen and in the file
        }
        else if (keysPressed['ArrowRight'] && event.key == '3') {
            visitor_score += 3;
            v_p3.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
        else if (keysPressed['ArrowRight'] && event.key == '2') {
            visitor_score += 2;
            v_p2.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
        else if (keysPressed['ArrowRight'] && event.key == '1') {
            visitor_score += 1;
            v_p1.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
        else if (keysPressed['ArrowRight'] && event.key == '-') {
            visitor_score -= 1;
            v_m1.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
        else if (keysPressed['ArrowLeft'] && event.key == '3') {
            home_score += 3;
            h_p3.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
        else if (keysPressed['ArrowLeft'] && event.key == '2') {
            home_score += 2;
            h_p2.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
        else if (keysPressed['ArrowLeft'] && event.key == '1') {
            home_score += 1;
            h_p1.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
        else if (keysPressed['ArrowLeft'] && event.key == '-') {
            home_score -= 1;
            h_m1.classList.add("active_button");
            update_data();
            document.activeElement.blur();
        }
    }
});
h_name.addEventListener("input", (event) => {
    home_player_fouls = {};
    update_data();
    broadcast_selected_teams();
});
v_name.addEventListener("input", (event) => {
    visitor_player_fouls = {};
    update_data();
    broadcast_selected_teams();
});
h_r_color.addEventListener("input", (event) => {
    h_color[0] = parseInt(h_r_color.value, 10);
    if (!freeze.classList.contains("active_button")) bc.postMessage("h_r_color&"+h_color[0]);
    update_data();
    change_colors();

});
h_g_color.addEventListener("input", (event) => {
    h_color[1] = parseInt(h_g_color.value, 10);
    if (!freeze.classList.contains("active_button")) bc.postMessage("h_g_color&"+h_color[1]);
    update_data();
    change_colors();
});
h_b_color.addEventListener("input", (event) => {
    h_color[2] = parseInt(h_b_color.value, 10);
    if (!freeze.classList.contains("active_button")) bc.postMessage("h_b_color&"+h_color[2]);
    update_data();
    change_colors();
});
v_r_color.addEventListener("input", (event) => {
    v_color[0] = parseInt(v_r_color.value, 10);
    if (!freeze.classList.contains("active_button")) bc.postMessage("v_r_color&"+v_color[0]);
    update_data();
    change_colors();
});
v_g_color.addEventListener("input", (event) => {
    v_color[1] = parseInt(v_g_color.value, 10);
    if (!freeze.classList.contains("active_button")) bc.postMessage("v_g_color&"+v_color[1]);
    update_data();
    change_colors();
});
v_b_color.addEventListener("input", (event) => {
    v_color[2] = parseInt(v_b_color.value, 10);
    if (!freeze.classList.contains("active_button")) bc.postMessage("v_b_color&"+v_color[2]);
    update_data();
    change_colors();
});
total_per.addEventListener("input", (event) => {
    if(parseInt(total_per.value, 10) <= 0) {
        total_per.value = 0;
    }
    num_periods = parseInt(total_per.value, 10);
    if (period > num_periods) {
        period = num_periods;
    }
    update_data();
    schedule_save();
});
countdown_time.addEventListener("input", (event) => {
    schedule_save();
});
min_enter.addEventListener("input", (event) => {
    if (parseInt(min_enter.value, 10) <= -1) {
        min_enter.value = "0";
        sec_enter.value = "00";
        tenth_enter.value = "0";
    }
    schedule_save();
});
sec_enter.addEventListener("input", (event) => {
    sec_enter.value = parseInt(sec_enter.value);
    if (sec_enter.value == 60) {
        min_enter.value = (parseInt(min_enter.value) + 1);
        sec_enter.value = "00"
    }
    if (sec_enter.value > 60) {
        sec_enter.value = "59";
    }
    if (sec_enter.value == -1) {
        if (min_enter.value != 0) {
            min_enter.value = (parseInt(min_enter.value) - 1);
            sec_enter.value = "59";
        }
        else {
            tenth_enter.value = 0;
            sec_enter.value = "00";
        }
    }
    if (sec_enter.value < -1) {
        sec_enter.value = "00";
    }
    schedule_save();
});
tenth_enter.addEventListener("input", (event) => {
    if (tenth_enter.value == 10) {
        if (sec_enter.value == 59) {
            min_enter.value = (parseInt(min_enter.value) + 1);
            sec_enter.value = "00";
        } else {
            sec_enter.value = (parseInt(sec_enter.value) + 1);
        }
        tenth_enter.value = 0;
    }
    if (tenth_enter.value == -1) {
        if (sec_enter.value == 0 && min_enter.value == 0) {
            tenth_enter.value = 0;
        }
        else if (sec_enter.value == 0) {
            if (min_enter.value != 0) {
                min_enter.value = (parseInt(min_enter.value) - 1);
                sec_enter.value = "59";
                tenth_enter.value = 9;
            }
        } else {
            sec_enter.value = (parseInt(sec_enter.value) - 1);
            tenth_enter.value = 9;
        }
    }
    schedule_save();
});
document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
    v_p3.classList.remove("active_button");
    v_p2.classList.remove("active_button");
    v_p1.classList.remove("active_button");
    h_p3.classList.remove("active_button");
    h_p2.classList.remove("active_button");
    h_p1.classList.remove("active_button");
 });
music.addEventListener("click", function() {
    play_music();
});
intros.addEventListener("click", function() {
    if (intro_files.length === 0) return;
    clearInterval(clear_audio_interval);
    var r = Math.floor(Math.random() * intro_files.length);
    try {
        intro.pause();
    }
    catch (e) {
        console.log(e);
    }
    intro.setAttribute('src', 'assets/Intros/' + intro_files[r]);
    intro.load();
    intro.volume = introvol.value/100;
    var introPlay = intro.play();
    if (introPlay && introPlay.catch) { introPlay.catch(function() {}); }
    intro.onended = function() {
        intro.pause();
        current_intro_track = '';
        bc.postMessage('now_playing_intro&');
    };
    current_intro_track = intro_files[r];
    bc.postMessage('now_playing_intro&' + current_intro_track);
});
anthem.addEventListener("click", function() {
    clearInterval(clear_audio_interval);
    try {
        anthem_music.pause();
    }
    catch (e) {
        console.log(e);
    }
    anthem_music.currentTime = 0;
    anthem_music.volume = anthemvol.value/100;
    flag.classList.add("active_button");
    bc.postMessage("flag_on");
    var anthemPlay = anthem_music.play();
    if (anthemPlay && anthemPlay.catch) {
        anthemPlay.catch(function() {
            flag.classList.remove("active_button");
            bc.postMessage("flag_off");
        });
    }
    anthem_music.onended = function() {
        flag.classList.remove("active_button");
        bc.postMessage("flag_off");
    };
});
clear.addEventListener("click", function() {
    // Fade all long-running audio out together so music does not stop abruptly.
    clearInterval(clear_audio_interval);
    clear_audio_interval = setInterval (function() {
        if ((audio.volume - (0.01) > 0 && !audio.paused) || (intro.volume - (0.01) > 0 && !intro.paused) || (anthem_music.volume - (0.01) > 0 && !anthem_music.paused)) {
            if (audio.volume - (0.01) > 0 && !audio.paused) {
                audio.volume -= (0.01);
            }
            if (intro.volume - (0.01) > 0 && !intro.paused) {
                intro.volume -= (0.01);
            }
            if (anthem_music.volume - (0.01) > 0 && !anthem_music.paused) {
                anthem_music.volume -= (0.01);
            }
        } else {
            audio.pause();
            intro.pause();
            anthem_music.pause();
            clearInterval(clear_audio_interval);
            flag.classList.remove("active_button");
            bc.postMessage("flag_off");
            current_music_track = '';
            current_intro_track = '';
            bc.postMessage('now_playing_clear');
        }
    }, 20);
});
buzzer.addEventListener("click", function() {
    play_short_buzzer();
});
timeoutThirty.addEventListener("click", function() {
    if (timeoutThirty.classList.contains("active_button")) {
        timeoutThirty.classList.remove("active_button");
        timeoutThirty.innerHTML = "0:30 Timer";
        clearTimeout(timeoutThirtyId);
    } else {
        timeoutThirty.classList.add("active_button");
        secondsLeft1 = 30;
        timeoutThirty.innerHTML = "0:30";
        timeoutThirtyId = setTimeout(decrease_counter, 1000);
    }
    function decrease_counter() {
        secondsLeft1 -= 1;
        timeoutThirty.innerHTML = "0:" + String(secondsLeft1).padStart(2, '0');
        if (secondsLeft1 > 0) {
            timeoutThirtyId = setTimeout(decrease_counter, 1000);
        } else {
            timeoutThirtyId = setTimeout(short_buzzer, 1)
        }
    }
    function short_buzzer() {
        play_short_buzzer();
        timeoutThirty.innerHTML = "0:30 Timer";
        timeoutThirty.classList.remove("active_button");
    }
});
timeoutFourtyFive.addEventListener("click", function() {
    if (timeoutFourtyFive.classList.contains("active_button")) {
        timeoutFourtyFive.classList.remove("active_button");
        timeoutFourtyFive.innerHTML = "0:45 Timer";
        clearTimeout(timeoutFourtyFiveId);
    } else {
        timeoutFourtyFive.classList.add("active_button");
        timeoutFourtyFive.innerHTML = "0:45";
        secondsLeft2 = 45
        timeoutFourtyFiveId = setTimeout(decrease_counter, 1000);
    }
    function decrease_counter() {
        secondsLeft2 -= 1;
        timeoutFourtyFive.innerHTML = "0:" + String(secondsLeft2).padStart(2, '0');
        if (secondsLeft2 > 0) {
            timeoutFourtyFiveId = setTimeout(decrease_counter, 1000);
        } else {
            timeoutFourtyFiveId = setTimeout(short_buzzer, 1)
        }
    }
    function short_buzzer() {
        play_short_buzzer();
        timeoutFourtyFive.innerHTML = "0:45 Timer";
        timeoutFourtyFive.classList.remove("active_button");
    }
});
timeoutMinute.addEventListener("click", function() {
    if (timeoutMinute.classList.contains("active_button")) {
        timeoutMinute.classList.remove("active_button");
        timeoutMinute.innerHTML = "1:00 Timer";
        clearTimeout(timeoutMinuteId);
    } else {
        timeoutMinute.classList.add("active_button");
        secondsLeft3 = 60;
        timeoutMinute.innerHTML = "1:00"
        timeoutMinuteId = setTimeout(decrease_counter, 1000);
    }
    function decrease_counter() {
        secondsLeft3 -= 1;
        timeoutMinute.innerHTML = "0:" + String(secondsLeft3).padStart(2, '0');
        if (secondsLeft3 > 0) {
            timeoutMinuteId = setTimeout(decrease_counter, 1000);
        } else {
            timeoutMinuteId = setTimeout(short_buzzer, 1)
        }
    }
    function short_buzzer() {
        play_short_buzzer();
        timeoutMinute.innerHTML = "1:00 Timer"
        timeoutMinute.classList.remove("active_button");
    }
});
m_per.addEventListener("click", function() {
    if(period != 1) {
        period--; //Go to previous period
    }
    update_data(); //Update the content on the screen and in the file
});
p_per.addEventListener("click", function() {
    if (period < num_periods) {
        period++;
    }
    update_data();
    if ((num_periods / 2 + 1) == period) {
        showConfirm("HALFTIME: Do you need to reset fouls?", function() {
            h_bonus.classList.remove("active_button");
            h_d_bonus.classList.remove("active_button");
            home_fouls = 0;
            v_bonus.classList.remove("active_button");
            v_d_bonus.classList.remove("active_button");
            visitor_fouls = 0;
            update_data();
        });
    }
});
h_p3.addEventListener("click", function() {
    home_score+=3;
    update_data();
});
h_p2.addEventListener("click", function() {
    home_score+=2;
    update_data();
});
h_p1.addEventListener("click", function() {
    home_score++;
    update_data();
});
h_m1.addEventListener("click", function() {
    home_score--;
    update_data();
});
v_p3.addEventListener("click", function() {
    visitor_score+=3;
    update_data();
});
v_p2.addEventListener("click", function() {
    visitor_score+=2;
    update_data();
});
v_p1.addEventListener("click", function() {
    visitor_score++;
    update_data();
});
v_m1.addEventListener("click", function() {
    visitor_score--;
    update_data();
});
h_foul_p1.addEventListener("click", function() {
    open_player_picker(h_name.value, "Add Foul — " + h_name.value, home_player_fouls,
        function(key, hasNumber) {
            home_player_fouls[key] = (home_player_fouls[key] || 0) + 1;
            if (hasNumber) {
                player_foul = key + "-" + home_player_fouls[key];
                clearTimeout(foulTimeoutId);
                foulTimeoutId = setTimeout(clear_player_foul, 30000);
            }
            home_fouls++;
            update_data();
        },
        function() { home_fouls++; update_data(); }
    );
});
h_foul_m1.addEventListener("click", function() {
    open_player_picker(h_name.value, "Remove Foul — " + h_name.value, home_player_fouls,
        function(key) {
            if (home_player_fouls[key] > 0) {
                home_player_fouls[key]--;
                if (home_player_fouls[key] === 0) delete home_player_fouls[key];
            }
            home_fouls--;
            update_data();
        },
        function() { home_fouls--; update_data(); },
        "Subtract from Team"
    );
});
v_foul_p1.addEventListener("click", function() {
    open_player_picker(v_name.value, "Add Foul — " + v_name.value, visitor_player_fouls,
        function(key, hasNumber) {
            visitor_player_fouls[key] = (visitor_player_fouls[key] || 0) + 1;
            if (hasNumber) {
                player_foul = key + "-" + visitor_player_fouls[key];
                clearTimeout(foulTimeoutId);
                foulTimeoutId = setTimeout(clear_player_foul, 30000);
            }
            visitor_fouls++;
            update_data();
        },
        function() { visitor_fouls++; update_data(); }
    );
});
v_foul_m1.addEventListener("click", function() {
    open_player_picker(v_name.value, "Remove Foul — " + v_name.value, visitor_player_fouls,
        function(key) {
            if (visitor_player_fouls[key] > 0) {
                visitor_player_fouls[key]--;
                if (visitor_player_fouls[key] === 0) delete visitor_player_fouls[key];
            }
            visitor_fouls--;
            update_data();
        },
        function() { visitor_fouls--; update_data(); },
        "Subtract from Team"
    );
});
h_tol_p1.addEventListener("click", function() {
    home_tol++;
    update_data();
});
h_tol_m1.addEventListener("click", function() {
    home_tol--;
    update_data();
});
v_tol_p1.addEventListener("click", function() {
    visitor_tol++;
    update_data();
});
v_tol_m1.addEventListener("click", function() {
    visitor_tol--;
    update_data();
});
update_time.addEventListener("click", function() {
    function applyTime() {
        min = parseInt(min_enter.value, 10);
        sec = parseInt(sec_enter.value, 10);
        tenth = parseInt(tenth_enter.value, 10);
        update_data();
    }
    if (min == 0 && sec == 0 && tenth == 0) {
        showConfirm("Should we increment the period?\nOK — Increment Period and Reset Time\nCancel — Reset Time only",
            function() {
                period++;
                applyTime();
                if ((num_periods / 2 + 1) == period) {
                    showConfirm("HALFTIME: Do you need to reset fouls?", function() {
                        h_bonus.classList.remove("active_button");
                        h_d_bonus.classList.remove("active_button");
                        home_fouls = 0;
                        v_bonus.classList.remove("active_button");
                        v_d_bonus.classList.remove("active_button");
                        visitor_fouls = 0;
                        update_data();
                    });
                }
            },
            applyTime
        );
    } else {
        applyTime();
    }
});
reset.addEventListener("click", function() {
    period = 1;
    home_score = 0;
    visitor_score = 0;
    h_bonus.classList.remove("active_button");
    h_d_bonus.classList.remove("active_button");
    home_fouls = 0;
    home_player_fouls = {};
    v_bonus.classList.remove("active_button");
    v_d_bonus.classList.remove("active_button");
    visitor_fouls = 0;
    visitor_player_fouls = {};
    home_tol = 0;
    visitor_tol = 0;
    h_name.value = "Home";
    v_name.value = "Away";
    r_poss.classList.remove("active_button");
    l_poss.classList.remove("active_button");
    min = min_enter.value;
    sec = sec_enter.value;
    tenth = tenth_enter.value;
    showAlert("Don't forget to update the time and timeouts left.");
    update_data();
});
reset_fouls.addEventListener("click", function() {
    h_bonus.classList.remove("active_button");
    h_d_bonus.classList.remove("active_button");
    home_fouls = 0;
    v_bonus.classList.remove("active_button");
    v_d_bonus.classList.remove("active_button");
    visitor_fouls = 0;
    update_data();
});
cover.addEventListener("click", function() {
    if (cover.classList.contains("active_button")) {
        cover.classList.remove("active_button");
        bc.postMessage("Uncover");
        update_data();
    } else {
        cover.classList.add("active_button");
        bc.postMessage("Cover");
        schedule_save();
    }
});
flag.addEventListener("click", function() {
    if (flag.classList.contains("active_button")) {
        flag.classList.remove("active_button");
        bc.postMessage("flag_off");
    } else {
        flag.classList.add("active_button");
        bc.postMessage("flag_on");
    }
    schedule_save();
});
countdown.addEventListener("click", function() {
    if (countdown.classList.contains("active_button")) {
        countdown.classList.remove("active_button");
        bc.postMessage("countdown_off");
    } else {
        countdown.classList.add("active_button");
        bc.postMessage("countdown_on");
        bc.postMessage("countdown_time&"+countdown_time.value);
    }
    schedule_save();
});
freeze.addEventListener("click", function() {
    if (freeze.classList.contains("active_button")) {
        freeze.classList.remove("active_button");
        update_data();
    } else {
        freeze.classList.add("active_button");
        schedule_save();
    }
});
h_bonus.addEventListener("click", function() {
    if (h_bonus.classList.contains("active_button")) {
        h_bonus.classList.remove("active_button");
    } else {
        if (h_d_bonus.classList.contains("active_button")) {
            h_d_bonus.classList.remove("active_button");
        }
        h_bonus.classList.add("active_button");
    }
    update_data();
});
h_d_bonus.addEventListener("click", function() {
    if (h_d_bonus.classList.contains("active_button")) {
        h_d_bonus.classList.remove("active_button");
    } else {
        if (h_bonus.classList.contains("active_button")) {
            h_bonus.classList.remove("active_button");
        }
        h_d_bonus.classList.add("active_button");
    }
    update_data();
});
v_bonus.addEventListener("click", function() {
    if (v_bonus.classList.contains("active_button")) {
        v_bonus.classList.remove("active_button");
    } else {
        if (v_d_bonus.classList.contains("active_button")) {
            v_d_bonus.classList.remove("active_button");
        }
        v_bonus.classList.add("active_button");
    }
    update_data();
});
v_d_bonus.addEventListener("click", function() {
    if (v_d_bonus.classList.contains("active_button")) {
        v_d_bonus.classList.remove("active_button");
    } else {
        if (v_bonus.classList.contains("active_button")) {
            v_bonus.classList.remove("active_button");
        }
        v_d_bonus.classList.add("active_button");
    }
    update_data();
});
show_score.addEventListener("click", function() {
    if (show_score.classList.contains("active_button")) {
        show_score.classList.remove("active_button");
        update_data();
    } else {
        show_score.classList.add("active_button");
        update_data();
    }
});
show_foul.addEventListener("click", function() {
    if (show_foul.classList.contains("active_button")) {
        show_foul.classList.remove("active_button");
        update_data();
    } else {
        show_foul.classList.add("active_button");
        update_data();
    }
});

show_tol.addEventListener("click", function() {
    if (show_tol.classList.contains("active_button")) {
        show_tol.classList.remove("active_button");
        update_data();
    } else {
        show_tol.classList.add("active_button");
        update_data();
    }
});
time_in.addEventListener("click", function() {
    if (sec != 0 || min != 0 || tenth != 0) {
        time_in_time_out();
    }
});
r_poss.addEventListener("click", function() {
    if (r_poss.classList.contains("active_button")) {
        r_poss.classList.remove("active_button");
    } else {
        r_poss.classList.add("active_button");
        l_poss.classList.remove("active_button");
    }
    update_data();
});
l_poss.addEventListener("click", function() {
    if (l_poss.classList.contains("active_button")) {
        l_poss.classList.remove("active_button");
    } else {
        l_poss.classList.add("active_button");
        r_poss.classList.remove("active_button");
    }
    update_data();
});
open_display.addEventListener("click", function() {
    if (window.pywebview && window.pywebview.api) {
        open_display_picker();
    } else {
        window.open("assets/display.html?v=7", "_blank");
        setTimeout(function(){ change_colors(); update_data(); }, 500);
    }
});

document.getElementById('display-picker-close').addEventListener('click', function() {
    document.getElementById('display-picker').style.display = 'none';
});

function open_display_picker() {
    var overlay = document.getElementById('display-picker');
    var list = document.getElementById('display-picker-list');
    var error = document.getElementById('display-picker-error');
    list.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.6)">Detecting displays…</div>';
    error.textContent = '';
    overlay.style.display = 'flex';

    window.pywebview.api.get_screens().then(function(screens) {
        list.innerHTML = '';

        screens.forEach(function(screen) {
            var btn = document.createElement('button');
            btn.className = 'display-picker-screen';
            btn.innerHTML =
                '<span class="display-picker-screen-number">' + (screen.index + 1) + '</span>' +
                '<span><span style="font-weight:600">' + screen.label + '</span><br>' +
                '<span style="font-size:0.82rem;color:rgba(255,255,255,0.55)">' + screen.width + ' \xd7 ' + screen.height + '</span></span>';
            btn.addEventListener('click', function() { pick_display(screen.index); });
            list.appendChild(btn);
        });

        var noDisplayBtn = document.createElement('button');
        noDisplayBtn.className = 'display-picker-screen no-display';
        noDisplayBtn.innerHTML =
            '<span><span style="font-weight:600">No Display</span><br>' +
            '<span style="font-size:0.82rem;color:rgba(255,255,255,0.55)">Testing mode — no scoreboard output</span></span>';
        noDisplayBtn.addEventListener('click', function() { pick_display(-1); });
        list.appendChild(noDisplayBtn);
    }).catch(function(err) {
        error.textContent = 'Unable to detect displays: ' + err;
    });
}

function pick_display(screen_index) {
    var error = document.getElementById('display-picker-error');
    window.pywebview.api.move_display(screen_index).then(function(result) {
        if (result.ok) {
            document.getElementById('display-picker').style.display = 'none';
            if (screen_index >= 0) {
                setTimeout(function(){ change_colors(); update_data(); }, 500);
            }
        } else {
            error.textContent = result.error || 'Failed to change display.';
        }
    }).catch(function(err) {
        error.textContent = String(err);
    });
}
open_introductions.addEventListener("click", function() {
    open_desktop_page("introductions", "assets/introductions.html?v=10");
});
open_pictures.addEventListener("click", function() {
    open_desktop_page("pictures", "assets/pictures.html");
});
manage_teams.addEventListener("click", function() {
    open_desktop_page("teams", "assets/team_editor.html");
});
manage_music.addEventListener("click", function() {
    open_desktop_page("music", "assets/music_manager.html?v=6");
});
manage_cover.addEventListener("click", function() {
    open_desktop_page("cover", "assets/cover_manager.html?v=1");
});

function open_desktop_page(page, fallbackUrl) {
    if (window.pywebview && window.pywebview.api) {
        if (page == "display") {
            window.pywebview.api.show_display();
        } else {
            window.pywebview.api.open_tool(page);
        }
    } else {
        window.open(fallbackUrl, "_blank");
    }
}
function collect_state() {
    return {
        period: period,
        home_score: home_score,
        visitor_score: visitor_score,
        home_fouls: home_fouls,
        visitor_fouls: visitor_fouls,
        home_tol: home_tol,
        visitor_tol: visitor_tol,
        min: min,
        sec: sec,
        tenth: tenth,
        min_enter: min_enter.value,
        sec_enter: sec_enter.value,
        tenth_enter: tenth_enter.value,
        total_per: total_per.value,
        possession: r_poss.classList.contains("active_button") ? "visitor" :
                    l_poss.classList.contains("active_button") ? "home" : null,
        home_name: h_name.value,
        visitor_name: v_name.value,
        countdown_time: countdown_time.value,
        cover: cover.classList.contains("active_button"),
        flag: flag.classList.contains("active_button"),
        countdown: countdown.classList.contains("active_button"),
        freeze: freeze.classList.contains("active_button"),
        show_score: show_score.classList.contains("active_button"),
        show_foul: show_foul.classList.contains("active_button"),
        show_tol: show_tol.classList.contains("active_button"),
        h_bonus: h_bonus.classList.contains("active_button"),
        h_d_bonus: h_d_bonus.classList.contains("active_button"),
        v_bonus: v_bonus.classList.contains("active_button"),
        v_d_bonus: v_d_bonus.classList.contains("active_button"),
        h_r_color: h_color[0],
        h_g_color: h_color[1],
        h_b_color: h_color[2],
        v_r_color: v_color[0],
        v_g_color: v_color[1],
        v_b_color: v_color[2],
        musicvol: musicvol.value,
        introvol: introvol.value,
        anthemvol: anthemvol.value,
        buzzervol: buzzervol.value,
        player_foul: player_foul,
        home_player_fouls: home_player_fouls,
        visitor_player_fouls: visitor_player_fouls,
    };
}
var _save_timer = null;
function schedule_save() {
    clearTimeout(_save_timer);
    _save_timer = setTimeout(function() {
        fetch('/api/state', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(collect_state())
        }).catch(function() {});
    }, 300);
}
function update_data() {
    // One central sync point: update the controller UI, save state to Python,
    // then broadcast the display state unless Freeze is holding the public display.
    change_colors();
    h_score.innerHTML = "Score: "+home_score;
    v_score.innerHTML = "Score: "+visitor_score;
    h_foul.innerHTML = "Fouls: "+home_fouls;
    v_foul.innerHTML = "Fouls: "+visitor_fouls;
    h_tol.innerHTML = "TOL: "+home_tol;
    v_tol.innerHTML = "TOL: "+visitor_tol;
    num_per.innerHTML = "Period: "+period;
    differential.innerHTML = Math.abs(home_score - visitor_score);
    time_display.innerHTML = min+":"+parseInt(sec).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+"."+tenth;
    if (!(freeze.classList.contains("active_button"))) {
        if (h_bonus.classList.contains("active_button")) {
            bc.postMessage("home_b&B");
        } else if (h_d_bonus.classList.contains("active_button")) {
            bc.postMessage("home_b&B+");
        } else {
            bc.postMessage("home_b&");
        }
        if (v_bonus.classList.contains("active_button")) {
            bc.postMessage("away_b&B");
        } else if (v_d_bonus.classList.contains("active_button")) {
            bc.postMessage("away_b&B+");
        } else {
            bc.postMessage("away_b&");
        }
        bc.postMessage("sides&false");
        bc.postMessage("show_score&"+(show_score.classList.contains("active_button")));
        bc.postMessage("show_foul&"+(show_foul.classList.contains("active_button")));
        bc.postMessage("show_tol&"+(show_tol.classList.contains("active_button")));
        bc.postMessage("left_poss&"+(l_poss.classList.contains("active_button")));
        bc.postMessage("right_poss&"+(r_poss.classList.contains("active_button")));
        if (min != 0) {
            bc.postMessage("Clock&"+min+":"+parseInt(sec).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}));
        } else {
            bc.postMessage("Clock&"+sec+"."+tenth);
        }
        bc.postMessage("home_name&"+encodeURIComponent(h_name.value));
        bc.postMessage("visitor_name&"+encodeURIComponent(v_name.value));
        broadcast_team_logos();
        bc.postMessage("period&"+period);
        bc.postMessage("home_score&"+home_score);
        bc.postMessage("away_score&"+visitor_score);
        bc.postMessage("home_tol&"+home_tol);
        bc.postMessage("away_tol&"+visitor_tol);
        bc.postMessage("home_foul&"+home_fouls);
        bc.postMessage("away_foul&"+visitor_fouls);
        if (player_foul != null) {
            bc.postMessage("player_foul&"+player_foul);
        } else {
            bc.postMessage("player_foul&-");
        }
    }
    schedule_save();
}
function load_data(s) {
    period = s.period != null ? parseInt(s.period) : 1;
    home_score = s.home_score != null ? parseInt(s.home_score) : 0;
    visitor_score = s.visitor_score != null ? parseInt(s.visitor_score) : 0;
    home_fouls = s.home_fouls != null ? parseInt(s.home_fouls) : 0;
    visitor_fouls = s.visitor_fouls != null ? parseInt(s.visitor_fouls) : 0;
    home_tol = s.home_tol != null ? parseInt(s.home_tol) : 0;
    visitor_tol = s.visitor_tol != null ? parseInt(s.visitor_tol) : 0;
    min = s.min != null ? parseInt(s.min) : 8;
    sec = s.sec != null ? parseInt(s.sec) : 0;
    tenth = s.tenth != null ? parseInt(s.tenth) : 0;
    min_enter.value = s.min_enter != null ? parseInt(s.min_enter) : 8;
    sec_enter.value = s.sec_enter != null ? parseInt(s.sec_enter) : 0;
    tenth_enter.value = s.tenth_enter != null ? parseInt(s.tenth_enter) : 0;
    total_per.value = s.total_per != null ? parseInt(s.total_per) : 4;
    num_periods = parseInt(total_per.value);
    h_bonus.classList.toggle("active_button", !!s.h_bonus);
    h_d_bonus.classList.toggle("active_button", !!s.h_d_bonus);
    v_bonus.classList.toggle("active_button", !!s.v_bonus);
    v_d_bonus.classList.toggle("active_button", !!s.v_d_bonus);
    if (s.possession === "home") {
        l_poss.classList.add("active_button");
        r_poss.classList.remove("active_button");
    } else if (s.possession === "visitor") {
        r_poss.classList.add("active_button");
        l_poss.classList.remove("active_button");
    } else {
        l_poss.classList.remove("active_button");
        r_poss.classList.remove("active_button");
    }
    if (s.home_name != null) h_name.value = s.home_name;
    if (s.visitor_name != null) v_name.value = s.visitor_name;
    if (s.countdown_time != null) countdown_time.value = s.countdown_time;
    if (s.cover) {
        bc.postMessage("Cover");
        cover.classList.add("active_button");
    } else {
        bc.postMessage("Uncover");
        cover.classList.remove("active_button");
    }
    if (s.flag) {
        bc.postMessage("flag_on");
        flag.classList.add("active_button");
    } else {
        bc.postMessage("flag_off");
        flag.classList.remove("active_button");
    }
    if (s.countdown) {
        if (s.countdown_time != null) {
            bc.postMessage("countdown_time&" + s.countdown_time);
        }
        bc.postMessage("countdown_on");
        countdown.classList.add("active_button");
    } else {
        bc.postMessage("countdown_off");
        countdown.classList.remove("active_button");
    }
    show_score.classList.toggle("active_button", s.show_score !== false);
    show_foul.classList.toggle("active_button", s.show_foul !== false);
    show_tol.classList.toggle("active_button", s.show_tol !== false);
    h_color[0] = s.h_r_color != null ? parseInt(s.h_r_color) : 0;
    h_color[1] = s.h_g_color != null ? parseInt(s.h_g_color) : 255;
    h_color[2] = s.h_b_color != null ? parseInt(s.h_b_color) : 0;
    v_color[0] = s.v_r_color != null ? parseInt(s.v_r_color) : 255;
    v_color[1] = s.v_g_color != null ? parseInt(s.v_g_color) : 255;
    v_color[2] = s.v_b_color != null ? parseInt(s.v_b_color) : 255;
    h_r_color.value = h_color[0];
    h_g_color.value = h_color[1];
    h_b_color.value = h_color[2];
    v_r_color.value = v_color[0];
    v_g_color.value = v_color[1];
    v_b_color.value = v_color[2];
    bc.postMessage("h_r_color&"+h_color[0]);
    bc.postMessage("h_g_color&"+h_color[1]);
    bc.postMessage("h_b_color&"+h_color[2]);
    bc.postMessage("v_r_color&"+v_color[0]);
    bc.postMessage("v_g_color&"+v_color[1]);
    bc.postMessage("v_b_color&"+v_color[2]);
    if (s.musicvol != null) musicvol.value = s.musicvol;
    if (s.introvol != null) introvol.value = s.introvol;
    if (s.anthemvol != null) anthemvol.value = s.anthemvol;
    if (s.buzzervol != null) buzzervol.value = s.buzzervol;
    home_player_fouls = (s.home_player_fouls && typeof s.home_player_fouls === 'object') ? s.home_player_fouls : {};
    visitor_player_fouls = (s.visitor_player_fouls && typeof s.visitor_player_fouls === 'object') ? s.visitor_player_fouls : {};
    update_data();
    if (s.player_foul != null) {
        player_foul = s.player_foul;
        clearTimeout(foulTimeoutId);
        foulTimeoutId = setTimeout(clear_player_foul, 30000);
        bc.postMessage("player_foul&" + player_foul);
    }
    // Freeze is restored after update_data so the initial push to the display
    // is not blocked when the previous session ended with freeze active.
    freeze.classList.toggle("active_button", !!s.freeze);
}
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "N/A";
}
function applyAssetButtonStates(assets) {
    music_files = assets.music || [];
    intro_files = assets.intros || [];
    music.disabled = music_files.length === 0;
    music.title = music_files.length === 0 ? 'Open Music Manager to add intermission tracks' : '';
    intros.disabled = intro_files.length === 0;
    intros.title = intro_files.length === 0 ? 'Open Music Manager to add introduction tracks' : '';
    anthem.disabled = !assets.anthem_exists;
    anthem.title = !assets.anthem_exists ? 'Open Music Manager to add an anthem file' : '';
    flag.disabled = !assets.flag_exists;
    flag.title = !assets.flag_exists ? 'Open Cover Manager to add a flag image' : '';
}
function play_music(){
    // Pick a random track while avoiding the most recently played set when
    // possible; once attempts run out, reset the history and keep going.
    if (music_files.length === 0) return;
    clearInterval(clear_audio_interval);
    var index = 0;
    var r;
    do {
        r = Math.floor(Math.random() * music_files.length);
        index += 1;
    } while (prev_played.includes(r) && index < 6);
    if (index >= 6) {
        prev_played = [];
    }
    try {
        audio.pause();
    }
    catch (e) {
        console.log(e);
    }
    prev_played.push(r);
    audio.setAttribute('src', 'assets/Music/' + music_files[r]);
    audio.load();
    audio.volume = musicvol.value/100;
    var musicPlay = audio.play();
    if (musicPlay && musicPlay.catch) { musicPlay.catch(function() {}); }
    audio.onended = function() {
        play_music();
    };
    current_music_track = music_files[r];
    bc.postMessage('now_playing_music&' + current_music_track);
}
function updateTime() {
    // Use elapsed wall-clock time instead of assuming setInterval fires exactly
    // on schedule; this keeps the clock accurate if the browser stutters.
    now_time = Date.now();
    while (now_time-previous_time >= 100) {
        previous_time += 100;
        if (sec == 0 && min == 0 && tenth == 0) {
            update_data();
            time_in.classList.remove("active_button");
            play_long_buzzer();
            clearInterval(clock_interval);
        } else {
            if (sec == 0 && min != 0 && tenth == 0) {
                min-=1;
                sec = 59;
                tenth = 10;
            }
            if (tenth == 0 && sec != 0) {
                sec-=1;
                tenth = 10;
            }
            tenth-=1;
            update_data();
        }
    }
}
function short_buzzer() {
    play_short_buzzer();
}
function time_in_time_out(){
    // Toggle the running clock and seed previous_time so the first tick lands on
    // the next tenth of a second.
    if (time_in.classList.contains("active_button")) {
        time_in.classList.remove("active_button");
        clearInterval(clock_interval);
    } else {
        time_in.classList.add("active_button");
        previous_time = Date.now()-100;
        clock_interval = setInterval(updateTime, 25);
    }
}
function clear_player_foul() {
    player_foul = null;
    update_data();
}

// ── Custom dialog helpers (replace native confirm / alert / prompt) ──────────
var _confirm_ok = null, _confirm_cancel = null;
var _alert_ok = null;
var _prompt_ok = null, _prompt_cancel = null;

document.getElementById('dialog-confirm-ok').addEventListener('click', function() {
    document.getElementById('custom-confirm').style.display = 'none';
    if (_confirm_ok) { var fn = _confirm_ok; _confirm_ok = null; _confirm_cancel = null; fn(); }
});
document.getElementById('dialog-confirm-cancel').addEventListener('click', function() {
    document.getElementById('custom-confirm').style.display = 'none';
    if (_confirm_cancel) { var fn = _confirm_cancel; _confirm_ok = null; _confirm_cancel = null; fn(); }
    else { _confirm_ok = null; }
});
document.getElementById('dialog-alert-ok').addEventListener('click', function() {
    document.getElementById('custom-alert').style.display = 'none';
    if (_alert_ok) { var fn = _alert_ok; _alert_ok = null; fn(); }
});
(function() {
    var inp = document.getElementById('dialog-prompt-input');
    function submit() {
        document.getElementById('custom-prompt').style.display = 'none';
        if (_prompt_ok) { var fn = _prompt_ok; _prompt_ok = null; _prompt_cancel = null; fn(inp.value); }
    }
    document.getElementById('dialog-prompt-ok').addEventListener('click', submit);
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit(); });
    document.getElementById('dialog-prompt-cancel').addEventListener('click', function() {
        document.getElementById('custom-prompt').style.display = 'none';
        if (_prompt_cancel) { var fn = _prompt_cancel; _prompt_ok = null; _prompt_cancel = null; fn(); }
        else { _prompt_ok = null; }
    });
})();

function showConfirm(message, onOk, onCancel) {
    document.getElementById('dialog-confirm-msg').textContent = message;
    _confirm_ok = onOk || null;
    _confirm_cancel = onCancel || null;
    document.getElementById('custom-confirm').style.display = 'flex';
}
function showAlert(message, onClose) {
    document.getElementById('dialog-alert-msg').textContent = message;
    _alert_ok = onClose || null;
    document.getElementById('custom-alert').style.display = 'flex';
}
function showPrompt(message, onOk, onCancel) {
    document.getElementById('dialog-prompt-msg').textContent = message;
    document.getElementById('dialog-prompt-input').value = '';
    _prompt_ok = onOk || null;
    _prompt_cancel = onCancel || null;
    document.getElementById('custom-prompt').style.display = 'flex';
    setTimeout(function() { document.getElementById('dialog-prompt-input').focus(); }, 50);
}
// ─────────────────────────────────────────────────────────────────────────────

var _picker_callback = null;
var _cancel_callback = null;

document.getElementById('player-picker-cancel').addEventListener('click', function() {
    document.getElementById('player-picker').style.display = 'none';
    _picker_callback = null;
    _cancel_callback = null;
});

document.getElementById('player-picker-team').addEventListener('click', function() {
    document.getElementById('player-picker').style.display = 'none';
    _picker_callback = null;
    if (_cancel_callback) { _cancel_callback(); _cancel_callback = null; }
});

function open_player_picker(teamName, title, playerFoulsObj, onSelect, onCancel, teamBtnLabel) {
    var players = (teamPlayers[teamName] || []).slice().sort(function(a, b) {
        var na = parseInt(a.number, 10), nb = parseInt(b.number, 10);
        if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
        return (a.last_name || '').localeCompare(b.last_name || '');
    });

    if (!players.length) {
        showPrompt("Player Number\n(Leave blank to apply to team only)", function(val) {
            val = val.trim();
            if (val) { onSelect(val, true); } else { if (onCancel) onCancel(); }
        });
        return;
    }

    _picker_callback = onSelect;
    _cancel_callback = onCancel || null;
    document.getElementById('player-picker-title').textContent = title;
    document.getElementById('player-picker-team').textContent = teamBtnLabel || 'Add to Team';

    var list = document.getElementById('player-picker-list');
    list.innerHTML = '';

    players.forEach(function(p) {
        var key = p.number || ([p.first_name, p.last_name].filter(Boolean).join(' '));
        var displayNum = p.number ? '#' + p.number : '—';
        var displayName = [p.first_name, p.last_name].filter(Boolean).join(' ');
        var currentFouls = playerFoulsObj[key] || 0;
        var hasNumber = !!p.number;

        var btn = document.createElement('button');
        btn.className = 'player-picker-btn';
        btn.innerHTML =
            '<span class="player-num">' + displayNum + '</span>' +
            '<span class="player-name">' + displayName + '</span>' +
            (currentFouls > 0 ? '<span class="player-foul-badge">' + currentFouls + '</span>' : '');
        btn.addEventListener('click', function() {
            document.getElementById('player-picker').style.display = 'none';
            _cancel_callback = null;
            if (_picker_callback) { _picker_callback(key, hasNumber); _picker_callback = null; }
        });
        list.appendChild(btn);
    });

    document.getElementById('player-picker').style.display = 'flex';
}
function broadcast_selected_teams() {
    bc.postMessage("selected_teams&"+encodeURIComponent(h_name.value)+"&"+encodeURIComponent(v_name.value));
    broadcast_team_logos();
}
function playSpecificMusicTrack(filename) {
    var idx = music_files.indexOf(filename);
    if (idx === -1) return;
    clearInterval(clear_audio_interval);
    try { audio.pause(); } catch(e) {}
    prev_played.push(idx);
    audio.setAttribute('src', 'assets/Music/' + filename);
    audio.load();
    audio.volume = musicvol.value / 100;
    var musicPlay = audio.play();
    if (musicPlay && musicPlay.catch) { musicPlay.catch(function() {}); }
    audio.onended = function() { play_music(); };
    current_music_track = filename;
    bc.postMessage('now_playing_music&' + current_music_track);
}

function playSpecificIntroTrack(filename) {
    var idx = intro_files.indexOf(filename);
    if (idx === -1) return;
    clearInterval(clear_audio_interval);
    try { intro.pause(); } catch(e) {}
    intro.setAttribute('src', 'assets/Intros/' + filename);
    intro.load();
    intro.volume = introvol.value / 100;
    var introPlay = intro.play();
    if (introPlay && introPlay.catch) { introPlay.catch(function() {}); }
    intro.onended = function() {
        intro.pause();
        current_intro_track = '';
        bc.postMessage('now_playing_intro&');
    };
    current_intro_track = filename;
    bc.postMessage('now_playing_intro&' + current_intro_track);
}

function broadcast_team_logos() {
    var homeLogo = teamLogos[h_name.value] || '';
    var visitorLogo = teamLogos[v_name.value] || '';
    bc.postMessage(
        "team_logos&" + encodeURIComponent(homeLogo) + "&" + encodeURIComponent(visitorLogo)
    );
}
function change_colors() {
    // Keep controls neutral and use the selected colors to identify each team
    // at the panel level instead.
    home.style.setProperty('--team-rgb', h_color.join(', '));
    visitor.style.setProperty('--team-rgb', v_color.join(', '));

    home.querySelectorAll('button, input, select').forEach(function(control) {
        control.style.backgroundColor = '';
    });
    visitor.querySelectorAll('button, input, select').forEach(function(control) {
        control.style.backgroundColor = '';
    });
    if (!freeze.classList.contains("active_button")) {
        bc.postMessage("h_r_color&"+h_color[0]);
        bc.postMessage("h_g_color&"+h_color[1]);
        bc.postMessage("h_b_color&"+h_color[2]);
        bc.postMessage("v_r_color&"+v_color[0]);
        bc.postMessage("v_g_color&"+v_color[1]);
        bc.postMessage("v_b_color&"+v_color[2]);
    }
}
