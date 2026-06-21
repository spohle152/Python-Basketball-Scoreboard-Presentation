var right = document.getElementById('right');

// Build the right control panel. app.js reads the generated IDs, so these snippets
// must keep the same element IDs.
right.innerHTML = `
        <div class="team-card visitor" id="visitor">
            <div class="team-header">
                <h2 class="team-title">Visitor</h2>
                <select id="v_name" name="v_name" class="team_name"></select>
                <div class="color">
                    <h3>R:</h3><input id="v_r_color" type="number" min="0" max="255" value="255">
                    <h3>G:</h3><input id="v_g_color" type="number" min="0" max="255" value="255">
                    <h3>B:</h3><input id="v_b_color" type="number" min="0" max="255" value="255">
                </div>
            </div>
            <div class="team-status">
                <h3 id="v_score">Score: 0</h3>
            </div>
            <div class="section-title">Score Controls</div>
            <div class="button-grid">
                <button id="v_p3">+3</button>
                <button id="v_p2">+2</button>
                <button id="v_p1">+1</button>
                <button id="v_m1">-1</button>
                <div></div>
                <div></div>
            </div>
            <div class="section-title">Fouls &amp; Bonus</div>
            <div class="button-grid two-col">
                <button id="v_foul_p1">Foul +1</button>
                <button id="v_foul_m1">Foul -1</button>
            </div>
            <div class="button-grid two-col">
                <button id="v_bonus">B</button>
                <button id="v_d_bonus">B+</button>
            </div>
            <div class="section-title">Timeouts</div>
            <div class="button-grid two-col">
                <button id="v_tol_p1">TOL +1</button>
                <button id="v_tol_m1">TOL -1</button>
            </div>
            <div class="section-title team-totals-title">Current Totals</div>
            <div class="team-status">
                <p id="v_foul">Fouls: 0</p>
                <p id="v_tol">TOL: 1</p>
            </div>
        </div>`;
