/* ============================================================
   main.js — application entry point (ES module)
   Wires together universe, agent, blackhole, glossary, nav.
   ============================================================ */
import { P, D, f, fe, days, ang, dstr, vorb, kind, GLOSSARY } from './data.js';
import { initUniverse }       from './universe.js';
import { planet, deepSpace }  from './agent.js';
import { initBlackHoleLab }   from './blackhole.js';

const $ = id => document.getElementById(id);

/* ══════════════════════════════════════════════════════════
   Router
   ══════════════════════════════════════════════════════════ */
function route() {
  const h = (location.hash || '#home').slice(1);
  document.querySelectorAll('.pg').forEach(p => p.classList.toggle('on', p.id === h));
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + h));
}
addEventListener('hashchange', route);
route();

/* ══════════════════════════════════════════════════════════
   Home stats bar
   ══════════════════════════════════════════════════════════ */
(function updateStats() {
  const d  = days();
  const dt = new Date(Date.UTC(2000, 0, 1, 12) + d * 864e5);
  $('sv-date').textContent = dt.toISOString().slice(0, 10);
  $('sv-day').textContent  = Math.floor(d).toLocaleString('en');
})();

/* ══════════════════════════════════════════════════════════
   Glossary
   ══════════════════════════════════════════════════════════ */
(function buildGlossary() {
  const grid = $('glossary-grid');
  if (!grid) return;
  GLOSSARY.forEach(({ term, symbol, def }) => {
    const div = document.createElement('div');
    div.className = 'cd gloss-entry';
    div.innerHTML = `<h3>${term}</h3><p><code>${symbol}</code></p><p>${def}</p>`;
    grid.appendChild(div);
  });
})();

/* ══════════════════════════════════════════════════════════
   Universe info panel
   ══════════════════════════════════════════════════════════ */
const row  = (a, b) => `<div class="k"><span>${a}</span><span>${b}</span></div>`;

function buildInfoHTML(k) {
  if (k === 'sun') {
    return `<h3>Sun</h3>
      ${row('Type',         'G2V star')}
      ${row('Radius',       '696,000 km')}
      ${row('Mass',         '1.989×10³⁰ kg')}
      ${row('Surface temp', '5,772 K')}
      <p class="mu">Gravity field Φ=−GM/r; its gradient gives the pull on a ship. Hazard peak of the agent's map.</p>`;
  }
  if (k[0] === 'p') {
    const i = +k.slice(1), p = P[i];
    return `<h3>${p[0]}</h3><p>${p[9]}</p>
      ${row('Distance from Sun',  f(p[1], 3) + ' AU')}
      ${row('Orbital period',     f(p[3] / 365.256, 2) + ' years')}
      ${row('Orbital speed',      f(vorb(i), 2) + ' km/s')}
      ${row('Radius',             f(p[4]) + ' km')}
      ${row('Mass',               fe(p[5]) + ' kg')}
      ${row('Surface gravity',    p[6] + ' m/s²')}
      ${row('Mean temperature',   p[7] + ' °C')}
      <p class="mu">Calculus: orbit r(t)=a(cos nt, sin nt), speed |r′|=2πa/T.</p>
      <button onclick="tgt('${k}')">🛰️ Plan a mission here</button>`;
  }
  // deep-space object
  const i  = +k.slice(1), d = D[i], kk = kind(d), m = d[4];
  const G2 = 6.674e-11, C2 = 2.998e8, MS2 = 1.989e30;
  return `<h3>${d[1]}</h3><p>${d[6]}</p>
    ${row('Type',     d[2])}
    ${row('Distance', f(d[3]) + ' light-years')}
    ${m ? row('Black hole mass',      fe(m)  + ' M☉') : ''}
    ${m ? row('Schwarzschild radius', f(2 * G2 * m * MS2 / C2 ** 2 / 1000, 1) + ' km') : ''}
    <p class="mu">${
      kk === 'g' ? 'Rotation curve v(r)=√(GM(&lt;r)/r) stays flat, which is the evidence for dark matter.' :
      kk === 'n' ? 'Column density N=∫n(l)dl along the line of sight tells us how much gas lies inside.' :
      kk === 'b' ? 'Tidal stretch a=2GM·L/r³ is a derivative of gravity and sets the safe stand-off distance.' :
                   'Flux F=L/(4πd²): brightness falls with the square of distance.'
    }</p>
    <button onclick="tgt('${k}')">🛰️ Plan a mission here</button>`;
}

/* ══════════════════════════════════════════════════════════
   Three.js Universe
   ══════════════════════════════════════════════════════════ */
const universe = initUniverse({
  onPick(k) { pick(k); },
});

function pick(k) {
  const info = $('info');
  info.innerHTML = buildInfoHTML(k);
  info.style.display = 'block';

  if      (k === 'sun')  universe.focus(k, universe.getSun(), null);
  else if (k[0] === 'p') universe.focus(k, universe.getPlanetMesh(+k.slice(1)), null);
  else                   universe.focus(k, null, universe.getDeepObjMesh(+k.slice(1)));
}

/* ══════════════════════════════════════════════════════════
   Object chips (universe nav bar)
   ══════════════════════════════════════════════════════════ */
const chips = $('chips');
[['sun', '☀️ Sun']]
  .concat(P.map((p, i) => ['p' + i, p[0]]))
  .concat(D.map((d, i) => ['d' + i, d[1].split(' (')[0]]))
  .forEach(([k, n]) => {
    const b = document.createElement('button');
    b.textContent = n;
    b.onclick = () => pick(k);
    chips.appendChild(b);
  });

/* Mission targeting from info panel */
window.tgt = k => { $('st').value = k; location.hash = '#agent'; };

/* ══════════════════════════════════════════════════════════
   AI Mission Analyst wiring
   ══════════════════════════════════════════════════════════ */
P.forEach((p, i) => $('so').add(new Option(p[0], i)));
$('so').value = 2;

$('st').innerHTML =
  '<optgroup label="Solar System">' +
  P.map((p, i) => `<option value="p${i}">${p[0]}</option>`).join('') +
  '</optgroup><optgroup label="Deep space">' +
  D.map((d, i) => `<option value="d${i}">${d[1]} (${f(d[3])} ly)</option>`).join('') +
  '</optgroup>';
$('st').value = 'p3';

$('lam').oninput = e => $('lv').textContent = (+e.target.value).toFixed(1);

$('go').onclick = () => {
  const o   = +$('so').value;
  const t   = $('st').value;
  const lam = +$('lam').value;
  $('rep').innerHTML = '';
  if (t[0] === 'p') {
    if (+t.slice(1) === o) { $('log').textContent = 'Start and target are the same planet. Choose a different target.'; return; }
    planet(o, +t.slice(1), lam);
  } else {
    deepSpace(+t.slice(1), lam);
  }
};

$('clear-rep').onclick = () => {
  $('rep').innerHTML = '';
  $('log').textContent = 'Agent idle. Choose a mission and press Run.';
  $('mc').style.display = 'none';
};

/* ══════════════════════════════════════════════════════════
   Black Hole Lab
   ══════════════════════════════════════════════════════════ */
initBlackHoleLab();

