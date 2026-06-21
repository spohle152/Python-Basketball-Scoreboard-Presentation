var left = document.getElementById('left');

// Build the left control panel. app.js reads the generated IDs, so these snippets
// must keep the same element IDs.
left.innerHTML = `
        <div class="team-card home" id="home">
            <div class="team-header">
                <h2 class="team-title">Home</h2>
                <select id="h_name" name="h_name" class="team_name"></select>
                <div class="color">
                    <h3>R:</h3><input id="h_r_color" type="number" min="0" max="255" value="0">
                    <h3>G:</h3><input id="h_g_color" type="number" min="0" max="255" value="255">
                    <h3>B:</h3><input id="h_b_color" type="number" min="0" max="255" value="0">
                </div>
            </div>
            <div class="team-status">
                <h3 id="h_score">Score: 0</h3>
            </div>
            <div class="section-title">Score Controls</div>
            <div class="button-grid">
                <button id="h_p3">+3</button>
                <button id="h_p2">+2</button>
                <button id="h_p1">+1</button>
                <button id="h_m1">-1</button>
                <div></div>
                <div></div>
            </div>
            <div class="section-title">Fouls &amp; Bonus</div>
            <div class="button-grid two-col">
                <button id="h_foul_p1">Foul +1</button>
                <button id="h_foul_m1">Foul -1</button>
            </div>
            <div class="button-grid two-col">
                <button id="h_bonus">B</button>
                <button id="h_d_bonus">B+</button>
            </div>
            <div class="section-title">Timeouts</div>
            <div class="button-grid two-col">
                <button id="h_tol_p1">TOL +1</button>
                <button id="h_tol_m1">TOL -1</button>
            </div>
            <div class="section-title team-totals-title">Current Totals</div>
            <div class="team-status">
                <p id="h_foul">Fouls: 0</p>
                <p id="h_tol">TOL: 1</p>
            </div>
        </div>`;
