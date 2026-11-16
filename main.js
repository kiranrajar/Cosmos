/* ============================================================
   main.js — Cosmos Clean Coordinator
   Wires 3D Universe, Procedural Textures, AI Mission Analyst,
   Black Hole Lab, Time-Warp Controls, and Responsive Routing.
   ============================================================ */

import { P, D, f, fe, days, ang, dstr, vorb, kind } from './data.js';
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
   2. TIME WARP HUD INDICATOR
   ──────────────────────────────────────────────────────────── */
const spRange = $('sp');
const spInd   = $('speed-indicator');
if (spRange && spInd) {
  spRange.addEventListener('input', e => {
    spInd.textContent = e.target.value + ' d/s';
  });
}

/* ────────────────────────────────────────────────────────────
   3. CELESTIAL INSPECTION POPUP CARD
   ──────────────────────────────────────────────────────────── */
const row = (a, b) => `<div class="k"><span>${a}</span><span>${b}</span></div>`;

function buildInfoHTML(k) {
  if (k === 'sun') {
    return `
      <h3>☀️ Sun</h3>
      ${row('Type',                'G2V Main Sequence Star')}
      ${row('Radius',              '696,340 km')}
      ${row('Mass',                '1.989 × 10³⁰ kg')}
      ${row('Surface Temperature', '5,772 K')}
      ${row('Surface Gravity',     '274.0 m/s²')}
      <p class="mu" style="margin-top:10px;font-size:12.5px">
        Gravity potential Φ = −GM/r. Its gradient produces the gravitational pull on a spacecraft.
      </p>
    `;
  }

  if (k[0] === 'p') {
    const i = +k.slice(1);
    const p = P[i];
    return `
      <h3>🪐 ${p[0]}</h3>
      <p style="margin-bottom:8px;font-size:13px">${p[9]}</p>
      ${row('Distance from Sun',   f(p[1], 3) + ' AU')}
      ${row('Orbital Period',      f(p[3] / 365.256, 2) + ' Earth years')}
      ${row('Orbital Speed',       f(vorb(i), 2) + ' km/s')}
      ${row('Radius',              f(p[4]) + ' km')}
      ${row('Mass',                fe(p[5]) + ' kg')}
      ${row('Surface Gravity',     p[6] + ' m/s²')}
      ${row('Mean Temperature',    p[7] + ' °C')}
      <p class="mu" style="margin-top:10px;font-size:12.5px">
        Calculus: orbit r(t) = a(cos nt, sin nt), speed |r′| = 2πa / T.
      </p>
      <button style="margin-top:12px;width:100%" class="btn-primary" onclick="tgt('${k}')">
        🛰️ Plan a mission here
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
    ${row('Type',                  d[2])}
    ${row('Distance',              f(d[3]) + ' light-years')}
    ${m ? row('Black Hole Mass',   fe(m) + ' M☉') : ''}
    ${m ? row('Schwarzschild Radius', f(2 * G2 * m * MS2 / C2 ** 2 / 1000, 1) + ' km') : ''}
    <p class="mu" style="margin-top:10px;font-size:12.5px">
      ${
        kk === 'g' ? 'Rotation curve v(r) = √(GM(&lt;r)/r) stays flat, which is direct evidence for dark matter.' :
        kk === 'n' ? 'Column density N = ∫ n(l) dl indicates the amount of gas along the line of sight.' :
        kk === 'b' ? 'Tidal stretch a = 2GM·L / r³ is a derivative of gravity and dictates the safe stand-off distance.' :
                     'Flux F = L / (4πd²): observed brightness drops with the square of distance.'
      }
    </p>
    <button style="margin-top:12px;width:100%" class="btn-primary" onclick="tgt('${k}')">
      🛰️ Plan a mission here
    </button>
  `;
}

/* ────────────────────────────────────────────────────────────
   5. 3D UNIVERSE INITIALIZATION & SELECTION
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

// Global target selector accessible from HTML button onclick
window.tgt = k => {
  const st = $('st');
  if (st) st.value = k;
  location.hash = '#agent';
};

/* ────────────────────────────────────────────────────────────
   4. QUICK-SELECT OBJECT CHIPS
   ──────────────────────────────────────────────────────────── */
const chips = $('chips');
if (chips) {
  [['sun', '☀️ Sun']]
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
   5. MISSION ANALYST WIRING
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
    '</optgroup><optgroup label="Deep space">' +
    D.map((d, i) => `<option value="d${i}">${d[1]} (${f(d[3])} ly)</option>`).join('') +
    '</optgroup>';
  stSelect.value = 'p3'; // Mars by default
}

const goBtn = $('go');
if (goBtn) {
  goBtn.onclick = () => {
    const o = +$('so').value;
    const t = $('st').value;
    const lam = 1.0;
    const rep = $('rep');
    if (rep) rep.innerHTML = '';

    if (t[0] === 'p') {
      if (+t.slice(1) === o) {
        const log = $('log');
        if (log) log.textContent = 'Start and target are the same planet. Choose a different target.';
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
    if (log) log.textContent = 'Agent idle. Choose mission parameters and press Run.';
    if (mc)  mc.style.display = 'none';
  };
}

/* ────────────────────────────────────────────────────────────
   6. BLACK HOLE LAB INITIALIZATION
   ──────────────────────────────────────────────────────────── */
initBlackHoleLab();
