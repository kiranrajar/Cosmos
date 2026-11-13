/* ============================================================
   main.js — Aerospace Mission Control Main Coordinator
   Wires 3D Universe, Procedural Textures, AI Mission Analyst,
   Black Hole Lab, Telemetry Clocks, and Responsive Routing.
   ============================================================ */

import { P, D, f, fe, days, ang, dstr, vorb, kind, GLOSSARY } from './data.js';
import { initUniverse } from './universe.js';
import { planet, deepSpace } from './agent.js';
import { initBlackHoleLab } from './blackhole.js';

const $ = id => document.getElementById(id);

/* ────────────────────────────────────────────────────────────
   1. ROUTER & PAGE TRANSITIONS
   ──────────────────────────────────────────────────────────── */
function route() {
  const h = (location.hash || '#home').slice(1);
  document.querySelectorAll('.pg').forEach(p => {
    p.classList.toggle('on', p.id === h);
  });
  document.querySelectorAll('nav a').forEach(a => {
    const target = a.getAttribute('href');
    if (target) a.classList.toggle('on', target === '#' + h);
  });
}
window.addEventListener('hashchange', route);
route();

/* ────────────────────────────────────────────────────────────
   2. MISSION TELEMETRY CLOCKS & EPOCH COUNTER
   ──────────────────────────────────────────────────────────── */
function updateMissionClocks() {
  const d = days();
  const dt = new Date(Date.UTC(2000, 0, 1, 12) + d * 864e5);
  const dateEl = $('sv-date');
  const dayEl  = $('sv-day');

  if (dateEl) dateEl.textContent = dt.toISOString().slice(0, 10);
  if (dayEl)  dayEl.textContent  = '+' + Math.floor(d).toLocaleString('en');
}
updateMissionClocks();

// Dynamic time warp indicator in HUD
const spRange = $('sp');
const spInd   = $('speed-indicator');
if (spRange && spInd) {
  spRange.addEventListener('input', e => {
    spInd.textContent = e.target.value + ' d/s';
  });
}

/* ────────────────────────────────────────────────────────────
   3. ASTRODYNAMICS LEXICON BUILDER
   ──────────────────────────────────────────────────────────── */
(function buildGlossary() {
  const grid = $('glossary-grid');
  if (!grid) return;
  grid.innerHTML = '';
  GLOSSARY.forEach(({ term, symbol, def }) => {
    const div = document.createElement('div');
    div.className = 'cd gloss-entry';
    div.innerHTML = `
      <h3>${term}</h3>
      <p><code>${symbol}</code></p>
      <p style="margin-top:6px">${def}</p>
    `;
    grid.appendChild(div);
  });
})();

/* ────────────────────────────────────────────────────────────
   4. CELESTIAL TELEMETRY POPUP CARD
   ──────────────────────────────────────────────────────────── */
const row = (a, b) => `<div class="k"><span>${a}</span><span>${b}</span></div>`;

function buildInfoHTML(k) {
  if (k === 'sun') {
    return `
      <h3>☀️ Sun (Sol)</h3>
      ${row('Spectral Classification', 'G2V Main Sequence Star')}
      ${row('Mean Radius',             '696,340 km (109.3 R⊕)')}
      ${row('Stellar Mass',            '1.989 × 10³⁰ kg (333,000 M⊕)')}
      ${row('Photosphere Temperature', '5,772 K (5,499 °C)')}
      ${row('Surface Gravity',         '274.0 m/s² (27.9 g)')}
      <p class="mu" style="margin-top:10px;font-size:12.5px">
        Gravitational potential Φ = −GM/r. Acts as the primary gravitational anchor
        and peak hazard node in the Mission Analyst cost field.
      </p>
    `;
  }

  if (k[0] === 'p') {
    const i = +k.slice(1);
    const p = P[i];
    return `
      <h3>🪐 ${p[0]}</h3>
      <p style="margin-bottom:8px;font-size:13px">${p[9]}</p>
      ${row('Semi-Major Axis',     f(p[1], 3) + ' AU (' + f(p[1] * 1.496e8) + ' km)')}
      ${row('Orbital Period',      f(p[3] / 365.256, 2) + ' Earth years (' + f(p[3], 1) + ' d)')}
      ${row('Mean Orbital Speed',  f(vorb(i), 2) + ' km/s')}
      ${row('Volumetric Radius',   f(p[4]) + ' km')}
      ${row('Planetary Mass',      fe(p[5]) + ' kg')}
      ${row('Surface Gravity',     p[6] + ' m/s² (' + f(p[6] / 9.81, 2) + ' g)')}
      ${row('Surface Temperature', p[7] + ' °C')}
      <p class="mu" style="margin-top:10px;font-size:12.5px">
        Keplerian orbit vector: r(t) = a(cos nt, sin nt), tangential speed |r′| = na.
      </p>
      <button style="margin-top:12px;width:100%" class="btn-primary" onclick="tgt('${k}')">
        🛰️ Design Mission Vector Here
      </button>
    `;
  }

  // Deep space object
  const i = +k.slice(1);
  const d = D[i];
  const kk = kind(d);
  const m = d[4];
  const G2 = 6.674e-11, C2 = 2.998e8, MS2 = 1.989e30;

  return `
    <h3>✨ ${d[1]}</h3>
    <p style="margin-bottom:8px;font-size:13px">${d[6]}</p>
    ${row('Astrophysical Type',    d[2])}
    ${row('Radial Distance',       f(d[3]) + ' light-years (' + fe(d[3] * 9.461e12) + ' km)')}
    ${m ? row('Singularity Mass',  fe(m) + ' M☉') : ''}
    ${m ? row('Schwarzschild r_s', f(2 * G2 * m * MS2 / C2 ** 2 / 1000, 1) + ' km') : ''}
    <p class="mu" style="margin-top:10px;font-size:12.5px">
      ${
        kk === 'g' ? 'Galactic rotation flat curve v(r) = √(GM(&lt;r)/r) establishes dark matter halo.' :
        kk === 'n' ? 'Column density N = ∫ n(l) dl measures interstellar gas column depth.' :
        kk === 'b' ? 'Tidal stretching acceleration a = 2GM·L/r³ dictates minimum stand-off perimeter.' :
                     'Radiant flux falls off as F = L / (4πd²).'
      }
    </p>
    <button style="margin-top:12px;width:100%" class="btn-primary" onclick="tgt('${k}')">
      🛰️ Design Mission Vector Here
    </button>
  `;
}

/* ────────────────────────────────────────────────────────────
   5. 3D UNIVERSE INITIALIZATION & HUD SELECTION
   ──────────────────────────────────────────────────────────── */
const universe = initUniverse({
  onPick(k) { pick(k); }
});

function pick(k) {
  const info = $('info');
  if (!info) return;
  info.innerHTML = buildInfoHTML(k);
  info.style.display = 'block';

  if (k === 'sun') {
    universe.focus(k, universe.getSun(), null);
  } else if (k[0] === 'p') {
    universe.focus(k, universe.getPlanetMesh(+k.slice(1)), null);
  } else {
    universe.focus(k, null, universe.getDeepObjMesh(+k.slice(1)));
  }
}

// Global target selector accessible from HTML onclick
window.tgt = k => {
  const st = $('st');
  if (st) st.value = k;
  location.hash = '#agent';
};

/* ────────────────────────────────────────────────────────────
   6. CELESTIAL CHIPS QUICK-SELECT HUD
   ──────────────────────────────────────────────────────────── */
const chips = $('chips');
if (chips) {
  [['sun', '☀️ Sun (Sol)']]
    .concat(P.map((p, i) => ['p' + i, p[0]]))
    .concat(D.map((d, i) => ['d' + i, d[1].split(' (')[0]]))
    .forEach(([k, n]) => {
      const b = document.createElement('button');
      b.textContent = n;
      b.onclick = () => pick(k);
      chips.appendChild(b);
    });
}

/* ────────────────────────────────────────────────────────────
   7. AI FLIGHT PATH ANALYST EVENT WIRING
   ──────────────────────────────────────────────────────────── */
const soSelect = $('so');
if (soSelect) {
  P.forEach((p, i) => soSelect.add(new Option(p[0], i)));
  soSelect.value = 2; // Earth by default
}

const stSelect = $('st');
if (stSelect) {
  stSelect.innerHTML =
    '<optgroup label="Solar System">' +
    P.map((p, i) => `<option value="p${i}">${p[0]}</option>`).join('') +
    '</optgroup><optgroup label="Deep Space Targets">' +
    D.map((d, i) => `<option value="d${i}">${d[1]} (${f(d[3])} ly)</option>`).join('') +
    '</optgroup>';
  stSelect.value = 'p3'; // Mars by default
}

const lamInput = $('lam');
if (lamInput) {
  lamInput.oninput = e => {
    const lv = $('lv');
    if (lv) lv.textContent = (+e.target.value).toFixed(1);
  };
}

const goBtn = $('go');
if (goBtn) {
  goBtn.onclick = () => {
    const o = +$('so').value;
    const t = $('st').value;
    const lam = +$('lam').value;
    const rep = $('rep');
    if (rep) rep.innerHTML = '';

    if (t[0] === 'p') {
      if (+t.slice(1) === o) {
        const log = $('log');
        if (log) log.textContent = 'Origin and destination are identical. Select a target orbit.';
        return;
      }
      planet(o, +t.slice(1), lam);
    } else {
      deepSpace(+t.slice(1), lam);
    }
  };
}

const clearBtn = $('clear-rep');
if (clearBtn) {
  clearBtn.onclick = () => {
    const rep = $('rep');
    const log = $('log');
    const mc = $('mc');
    if (rep) rep.innerHTML = '';
    if (log) log.textContent = 'Telemetry telemetry system standby. Select trajectory vectors and execute calculation.';
    if (mc)  mc.style.display = 'none';
  };
}

/* ────────────────────────────────────────────────────────────
   8. BLACK HOLE LAB INITIALIZATION
   ──────────────────────────────────────────────────────────── */
initBlackHoleLab();
