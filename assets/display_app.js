var right_score = document.getElementById('right_score');
var cover_image = document.getElementById('cover_image');
var flag = document.getElementById('flag');
var clock = document.getElementById('clock');
var left_name = document.getElementById('left_team_name');
var right_name = document.getElementById('right_team_name');
var left_possession = document.getElementById('left_possession');
var right_possession = document.getElementById('right_possession');
var period = document.getElementById('period');
var left_bonus = document.getElementById('left_bonus');
var right_bonus = document.getElementById('right_bonus');
var left_score = document.getElementById('left_score');
var right_score = document.getElementById('right_score');
var left_tol = document.getElementById('left_tol');
var right_tol = document.getElementById('right_tol');
var left_fouls = document.getElementById('left_team_fouls');
var right_fouls = document.getElementById('right_team_fouls');
var player_fouls = document.getElementById('player_fouls');
var top_left = document.getElementById('top_left');
var top_right = document.getElementById('top_right');
var middle_left = document.getElementById('middle_left');
var middle_right = document.getElementById('middle_right');
var bottom_left = document.getElementById('bottom_left');
var bottom_right = document.getElementById('bottom_right');
var countdown_image = document.getElementById('countdown_image');
var time_til_game = document.getElementById('time_til_game');
var team_intros = document.getElementById('team_intros');
var first_name = document.getElementById('first_name');
var last_name = document.getElementById('last_name');
var team_name = document.getElementById('team_name');
var foul_labels = document.getElementsByClassName('foul_label');
var tol_labels = document.getElementsByClassName('tol_label');
var foul_stat_cards = document.getElementsByClassName('foul-stat');
var tol_stat_cards = document.getElementsByClassName('tol-stat');
var player_fouls_container = document.getElementById('player_fouls_container');
var bottom = document.getElementsByClassName('bottom');
var pictures = document.getElementById('pictures');
var picture = document.getElementById('picture');

// The display window only listens for commands. Controller pages send short
// messages through this shared BroadcastChannel, then this file updates the DOM.
const bc = new BroadcastChannel("channel");

// Display-side state that affects how incoming home/visitor values are mapped
// onto the physical left and right halves of the scoreboard.
var sides = false;
var show_score = true;
var show_foul = true;
var has_player_foul = false;
var show_tol = true;
var countdown_interval_id;
var countdown_time = "09:00";
var min = 4;
var sec = 0;
var tenth = 0;
var h_color = [0, 255, 0];
var v_color = [255, 255, 255];
var h_logo = "";
var v_logo = "";
var clock_interval;
var buzzer_audio = new Audio('buzzer.mp3');
var long_buzzer_audio = new Audio('long_buzzer.mp3');
var timeoutId;
var dataAnimationObservers = [];

var _fouls_container_timer = null;
function update_player_fouls_container() {
    clearTimeout(_fouls_container_timer);
    if (show_foul && has_player_foul) {
        player_fouls_container.style.display = "grid";
        bottom[0].style.gridTemplateColumns = "1.5fr 1fr 1.5fr";
        _fouls_container_timer = setTimeout(function() { player_fouls_container.style.opacity = 1; }, 20);
    } else {
        player_fouls_container.style.opacity = 0;
        _fouls_container_timer = setTimeout(function() {
            player_fouls_container.style.display = "none";
            bottom[0].style.gridTemplateColumns = "1.5fr 1.5fr";
        }, 350);
    }
}

setup_data_animations();

window.addEventListener('load', function(event) {
  // Ask any open controller tab to resend its current state after the display
  // is opened or refreshed.
  bc.postMessage("Update");
  fit_team_names();
});

window.addEventListener('resize', fit_team_names);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(fit_team_names);
}

bc.onmessage = (event) => {
  // Messages use "command&value" strings so simple HTML pages can coordinate
  // without a server. The first segment selects the action below.
  if(event.data == "Cover") {
      cover_image.style.transition = "opacity 0.6s ease";
      cover_image.style.opacity = "1"; 
  } else if(event.data == "Uncover") {
      cover_image.style.transition = "opacity 0.6s ease";
      cover_image.style.opacity = "0"; 
  } else if(event.data == "flag_on") {
      flag.style.transition = "opacity 0.7s ease";
      flag.style.opacity = "1"; 
  } else if(event.data == "flag_off") {
      flag.style.transition = "opacity 0.7s ease";
      flag.style.opacity = "0"; 
  } else if(event.data == "countdown_on") {
      countdown_image.style.transition = "opacity 0.6s ease";
      countdown_image.style.opacity = "1"; 
      clearInterval(countdown_interval_id);
  } else if(event.data == "countdown_off") {
      countdown_image.style.transition = "opacity 0.6s ease";
      countdown_image.style.opacity = "0";
      setTimeout(function(){
        if (countdown_image.style.opacity == "0") {
          clearInterval(countdown_interval_id);
        }
      }, 600);
  } else if(event.data.split("&")[0] == "countdown_time") {
      countdown_time = event.data.split("&")[1];
      update_countdown();
  } else if (event.data.split("&")[0] == "Clock") {
      clock.innerHTML = event.data.split("&")[1];
  } else if (event.data.split("&")[0] == "period") {
      period.innerHTML = "Period: "+event.data.split("&")[1];
  } else if (event.data.split("&")[0] == "left_poss") {
    if (event.data.split("&")[1] == "true") {
      left_possession.src="active_possession.png";
    } else {
      left_possession.src="inactive_possession.png";
    }
  } else if (event.data.split("&")[0] == "right_poss") {
    if (event.data.split("&")[1] == "true") {
      right_possession.src="active_possession.png";
    } else {
      right_possession.src="inactive_possession.png";
    }
  } else if (event.data.split("&")[0] == "home_b") {
    if (!sides) {
      left_bonus.innerHTML = event.data.split("&")[1];
    } else {
      right_bonus.innerHTML = event.data.split("&")[1];
    }
  } else if (event.data.split("&")[0] == "away_b") {
    if (!sides) {
      right_bonus.innerHTML = event.data.split("&")[1];
    } else {
      left_bonus.innerHTML = event.data.split("&")[1];
    }
  } else if (event.data.split("&")[0] == "home_score") {
    if (show_score) {
      if (!sides) {
        left_score.innerHTML = event.data.split("&")[1];
        left_score.style.opacity = 1;
      } else {
        right_score.innerHTML = event.data.split("&")[1];
        right_score.style.opacity = 1;
      }
    } 
    else {
      right_score.style.opacity = 0;
      left_score.style.opacity = 0;
    }
  } else if (event.data.split("&")[0] == "away_score") {
    if (show_score) {
      if (!sides) {
        right_score.innerHTML = event.data.split("&")[1];
        right_score.style.opacity = 1;
      } else {
        left_score.innerHTML = event.data.split("&")[1];
        left_score.style.opacity = 1;
      }
    } 
    else {
      right_score.style.opacity = 0;
      left_score.style.opacity = 0;
    }
  } else if (event.data.split("&")[0] == "home_tol") {
    if (show_tol) {
      tol_labels[0].style.opacity = 1;
      tol_labels[1].style.opacity = 1;
      if (!sides) {
        left_tol.innerHTML = event.data.split("&")[1];
        left_tol.style.opacity = 1;
      } else {
        right_tol.innerHTML = event.data.split("&")[1];
        right_tol.style.opacity = 1;
      }
    }
    else {
      tol_labels[0].style.opacity = 0;
      tol_labels[1].style.opacity = 0;
      left_tol.style.opacity = 0;
      right_tol.style.opacity = 0;
    }
  } else if (event.data.split("&")[0] == "away_tol") {
    if (show_tol) {
      tol_labels[0].style.opacity = 1;
      tol_labels[1].style.opacity = 1;
      if (!sides) {
        right_tol.innerHTML = event.data.split("&")[1];
        right_tol.style.opacity = 1;
      } else {
        left_tol.innerHTML = event.data.split("&")[1];
        left_tol.style.opacity = 1;
      }
    }
    else {
      tol_labels[0].style.opacity = 0;
      tol_labels[1].style.opacity = 0;
      left_tol.style.opacity = 0;
      right_tol.style.opacity = 0;
    }
  } else if (event.data.split("&")[0] == "home_foul") {
    if (show_foul) {
      foul_labels[0].style.opacity = 1;
      foul_labels[1].style.opacity = 1;
      if (!sides) {
        left_fouls.innerHTML = event.data.split("&")[1];
        left_fouls.style.opacity = 1;
      } else {
        right_fouls.innerHTML = event.data.split("&")[1];
        right_fouls.style.opacity = 1;
      }
    }
    else {
      foul_labels[0].style.opacity = 0;
      foul_labels[1].style.opacity = 0;
      left_fouls.style.opacity = 0;
      right_fouls.style.opacity = 0;
    }
  } else if (event.data.split("&")[0] == "away_foul") {
    if (show_foul) {
      foul_labels[0].style.opacity = 1;
      foul_labels[1].style.opacity = 1;
      if (!sides) {
        right_fouls.innerHTML = event.data.split("&")[1];
        right_fouls.style.opacity = 1;
      } else {
        left_fouls.innerHTML = event.data.split("&")[1];
        left_fouls.style.opacity = 1;
      }
    }
    else {
      foul_labels[0].style.opacity = 0;
      foul_labels[1].style.opacity = 0;
      left_fouls.style.opacity = 0;
      right_fouls.style.opacity = 0;
    }
  } else if (event.data.split("&")[0] == "player_foul") {
      var pf = event.data.split("&")[1];
      has_player_foul = (!!pf && pf !== "-");
      if (has_player_foul) player_fouls.innerHTML = pf;
      update_player_fouls_container();
  } else if (event.data.split("&")[0] == "h_r_color") {
    h_color[0] = event.data.split("&")[1];
    apply_team_colors();
  } else if (event.data.split("&")[0] == "h_g_color") {
    h_color[1] = event.data.split("&")[1];
    apply_team_colors();
  } else if (event.data.split("&")[0] == "h_b_color") {
    h_color[2] = event.data.split("&")[1];
    apply_team_colors();
  } else if (event.data.split("&")[0] == "v_r_color") {
    v_color[0] = event.data.split("&")[1];
    apply_team_colors();
  } else if (event.data.split("&")[0] == "v_g_color") {
    v_color[1] = event.data.split("&")[1];
    apply_team_colors();
  } else if (event.data.split("&")[0] == "v_b_color") {
    v_color[2] = event.data.split("&")[1];
    apply_team_colors();
  } else if (event.data.split("&")[0] == "sides") {
      // Swapping sides keeps "home" and "visitor" data consistent while
      // changing which half of the display each team occupies.
      if (event.data.split("&")[1] == "true") {
        sides=true;
      } else {
        sides=false;
      }
      apply_team_colors();
      apply_team_logos();
  } else if (event.data.split("&")[0] == "team_logos") {
      h_logo = decodeURIComponent(event.data.split("&")[1] || "");
      v_logo = decodeURIComponent(event.data.split("&")[2] || "");
      apply_team_logos();
  } else if (event.data.split("&")[0] == "home_name") {
    var _hname = decodeURIComponent(event.data.substring("home_name&".length));
    if (!sides) {
      left_name.textContent = _hname;
      fit_team_name(left_name);
    } else {
      right_name.textContent = _hname;
      fit_team_name(right_name);
    }
  } else if (event.data.split("&")[0] == "visitor_name") {
    var _vname = decodeURIComponent(event.data.substring("visitor_name&".length));
    if (!sides) {
      right_name.textContent = _vname;
      fit_team_name(right_name);
    } else {
      left_name.textContent = _vname;
      fit_team_name(left_name);
    }
  } else if (event.data.split("&")[0] == "show_score") {
    if (event.data.split("&")[1] == "false") {
      show_score = false;
    } else {
      show_score = true;
    }
  } else if (event.data.split("&")[0] == "show_foul") {
    show_foul = event.data.split("&")[1] !== "false";
    update_secondary_stats_visibility();
    update_player_fouls_container();
  } else if (event.data.split("&")[0] == "show_tol") {
    if (event.data.split("&")[1] == "false") {
      show_tol = false;
      update_secondary_stats_visibility();
    } else {
      show_tol = true;
      update_secondary_stats_visibility();
    }
  } else if (event.data.split("&")[0] == "intro_on") {
    var _iparts = event.data.split("&");
    var _ifirst = decodeURIComponent(_iparts[1] || "");
    var _ilast = decodeURIComponent(_iparts[2] || "");
    var _iteam = decodeURIComponent(_iparts[3] || "");
    first_name.style.opacity = 0;
    last_name.style.opacity = 0;
    if (_iteam != team_name.textContent) {
      team_name.style.opacity = 0;
    }
    setTimeout(function() {
      first_name.textContent = _ifirst;
      last_name.textContent = _ilast;
      team_name.textContent = _iteam;
      fit_intro_name(first_name);
      fit_intro_name(last_name);
      fit_intro_name(team_name);
      first_name.style.opacity = 1;
      last_name.style.opacity = 1;
      team_name.style.opacity = 1;
      team_intros.style.opacity = 1;
    }, 350);
  } else if (event.data.split("&")[0] == "intro_off") {
    team_intros.style.opacity = 0;
  } else if (event.data.split("&")[0] == "picture_on") {
    picture.style.opacity = 0;
    setTimeout(function() {
      picture.src = "Pictures/" + event.data.split("&")[1];
      picture.style.opacity = 1;
      pictures.style.opacity = 1;
    }, 280);
  } else if (event.data.split("&")[0] == "picture_off") {
    pictures.style.opacity = 0;
  } else if (event.data == "flag_updated") {
    var _t = Date.now();
    flag.style.backgroundImage =
        'linear-gradient(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.22)), url("american flag.jpg?' + _t + '")';
  } else if (event.data == "logo_updated") {
    var _t = Date.now();
    document.querySelectorAll('img[src*="logo.png"]').forEach(function(img) {
        img.src = 'logo.png?' + _t;
    });
  }

};

function set_panel_color(elements, color) {
  var rgb = color.join(", ");
  for (var element = 0; element < elements.length; element += 1) {
    elements[element].style.setProperty("--team-rgb", rgb);
    elements[element].style.backgroundColor = "";
  }
}

function apply_team_colors() {
  var leftColor = sides ? v_color : h_color;
  var rightColor = sides ? h_color : v_color;
  set_panel_color([top_left, middle_left, bottom_left], leftColor);
  set_panel_color([top_right, middle_right, bottom_right], rightColor);
}

function set_score_logo(element, logo) {
  if (logo) {
    element.style.setProperty(
      "--team-logo",
      'url("/team-logos/' + encodeURIComponent(logo) + '")'
    );
    element.classList.add("has-team-logo");
  } else {
    element.style.removeProperty("--team-logo");
    element.classList.remove("has-team-logo");
  }
}

function apply_team_logos() {
  set_score_logo(middle_left, sides ? v_logo : h_logo);
  set_score_logo(middle_right, sides ? h_logo : v_logo);
}

function fit_team_name(element) {
  element.style.fontSize = "";
  element.title = element.textContent;
  requestAnimationFrame(function () {
    var maxSize = parseFloat(window.getComputedStyle(element).fontSize);

    // scrollWidth detects a word wider than the panel — the flex item expands
    // to the word's min-content width and overflows the h3 horizontally.
    // scrollHeight detects too many wrapped lines exceeding the panel height.
    // clientWidth is always reliable (set by the grid column track).
    function fits() {
      return element.scrollWidth <= element.clientWidth &&
             element.scrollHeight <= element.clientHeight;
    }

    if (fits()) { return; }

    var lo = 0, hi = maxSize;
    while (hi - lo > 0.1) {
      var mid = (lo + hi) / 2;
      element.style.fontSize = mid + "px";
      if (fits()) { lo = mid; } else { hi = mid; }
    }
    element.style.fontSize = lo + "px";
  });
}

function fit_team_names() {
  fit_team_name(left_name);
  fit_team_name(right_name);
}

var intro_text_measure_canvas = document.createElement('canvas');
var intro_text_measure_context = intro_text_measure_canvas.getContext('2d');

function measure_intro_text(element, fontSize) {
  var style = window.getComputedStyle(element);
  var text = element.textContent || '';
  if (style.textTransform == 'uppercase') text = text.toUpperCase();
  if (style.textTransform == 'lowercase') text = text.toLowerCase();

  intro_text_measure_context.font = [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    fontSize + 'px',
    style.fontFamily
  ].join(' ');

  var letterSpacing = parseFloat(style.letterSpacing) || 0;
  return intro_text_measure_context.measureText(text).width
    + Math.max(0, text.length - 1) * letterSpacing;
}

function fit_intro_name(element) {
  element.style.fontSize = '';
  var cs = window.getComputedStyle(team_intros);
  var available = team_intros.offsetWidth
    - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  // Leave generous side clearance because the display renderer's large,
  // uppercase glyphs can exceed canvas width estimates.
  available *= 0.80;
  if (!available) return;

  var maxSize = parseFloat(window.getComputedStyle(element).fontSize);
  var minSize = 6;

  if (measure_intro_text(element, maxSize) <= available) return;

  var low = minSize;
  var high = maxSize;
  while (high - low > 0.5) {
    var size = (low + high) / 2;
    if (measure_intro_text(element, size) <= available) {
      low = size;
    } else {
      high = size;
    }
  }
  if (measure_intro_text(element, low) > available) {
    low = Math.max(1, low * available / measure_intro_text(element, low));
  }
  element.style.fontSize = low + 'px';
}

function fit_intro_names() {
  fit_intro_name(first_name);
  fit_intro_name(last_name);
  fit_intro_name(team_name);
}

window.addEventListener('resize', fit_intro_names);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(fit_intro_names);
}

function set_stat_cards_visible(cards, visible) {
  for (var card = 0; card < cards.length; card += 1) {
    cards[card].classList.toggle("stat-hidden", !visible);
  }
}

function update_secondary_stats_visibility() {
  set_stat_cards_visible(foul_stat_cards, show_foul);
  set_stat_cards_visible(tol_stat_cards, show_tol);

  var sidePanels = [bottom_left, bottom_right];
  for (var panel = 0; panel < sidePanels.length; panel += 1) {
    var visibleStats = sidePanels[panel].querySelectorAll(".other_stats:not(.stat-hidden)").length;
    sidePanels[panel].classList.toggle("single-stat", visibleStats == 1);
    sidePanels[panel].classList.toggle("no-stats", visibleStats == 0);
  }
}

function replay_data_animation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  element.addEventListener("animationend", function() {
    element.classList.remove(className);
  }, {once: true});
}

function observe_data_change(element, className, attributeName) {
  var lastValue = attributeName ? element.getAttribute(attributeName) : element.textContent;
  var observer = new MutationObserver(function() {
    var currentValue = attributeName ? element.getAttribute(attributeName) : element.textContent;
    if (currentValue != lastValue) {
      lastValue = currentValue;
      replay_data_animation(element, className);
    }
  });

  if (attributeName) {
    observer.observe(element, {attributes: true, attributeFilter: [attributeName]});
  } else {
    observer.observe(element, {childList: true, characterData: true, subtree: true});
  }
  dataAnimationObservers.push(observer);
}

function setup_data_animations() {
  observe_data_change(left_score, "score-change");
  observe_data_change(right_score, "score-change");
  observe_data_change(left_name, "name-change");
  observe_data_change(right_name, "name-change");
  observe_data_change(period, "stat-change");
  observe_data_change(left_bonus, "stat-change");
  observe_data_change(right_bonus, "stat-change");
  observe_data_change(left_tol, "stat-change");
  observe_data_change(right_tol, "stat-change");
  observe_data_change(left_fouls, "stat-change");
  observe_data_change(right_fouls, "stat-change");
  observe_data_change(player_fouls, "stat-change");
  observe_data_change(left_possession, "possession-change", "src");
  observe_data_change(right_possession, "possession-change", "src");
}

function update_countdown() {
  // Convert the controller's HH:MM game-start time into today's target time.
  hour = countdown_time.split(":")[0];
  minute = countdown_time.split(":")[1];
  var countDownDate = new Date();
  countDownDate.setHours(hour);
  countDownDate.setMinutes(minute);
  countDownDate.setSeconds(0);
  var distance = countDownDate - Date.now();
  if (distance < 0) {
    time_til_game.innerHTML = "0.0";
  } else {
    // Refresh faster than once per second so the final minute can show tenths.
    countdown_interval_id = setInterval(function() {
      var now = new Date().getTime();
      var distance = countDownDate - now;
      var minutes = Math.floor((distance / (1000 * 60)));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      var tenth = Math.floor((distance % (1000)) / 100);
      // Display the result
      if (minutes != 0) {
        time_til_game.innerHTML = minutes + ":" + parseInt(seconds).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
      } else {
        time_til_game.innerHTML = seconds + "." + tenth;
      }
      // If the count down is finished, sound the buzzer and stop the timer
      if (distance < 0) {
        clearInterval(countdown_interval_id);
        time_til_game.innerHTML = "0.0";
        bc.postMessage("countdown_finished");
      }
    }, 50);
  }
}
