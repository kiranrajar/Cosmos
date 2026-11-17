/* ============================================================
   agent.js — AI Mission Analyst logic (ES module)
   ============================================================ */
import { P, D, AU, MU, G, C, MS, R2, f, fe, mod, days, ang, dstr, vorb } from './data.js';

const $ = id => document.getElementById(id);

/* ── Hazard field ── */
function mkH(dep, o, t) {
  const q = [[0, 0, 5, .3]];
  P.forEach((p, i) => {
    if (i === o || i === t) return;
    const a = ang(i, dep) * R2, big = i === 4;
    q.push([p[1] * Math.cos(a), p[1] * Math.sin(a), big ? 3 : .7, big ? .9 : .2]);
  });
  return (x, y) => {
    let v = 1.2 * Math.exp(-((Math.hypot(x, y) - 2.7) ** 2) / .405);
    for (const [a, b, A, s] of q)
      v += A * Math.exp(-((x - a) ** 2 + (y - b) ** 2) / (2 * s * s));
    return v;
  };
}

/* ── Dijkstra path planner ── */
function plan(h, s, g, ext, lam) {
  const N = 140, c = 2 * ext / N;
  const id = (x, y) => y * N + x;
  const cl = v  => Math.min(N - 1, Math.max(0, Math.floor((v + ext) / c)));
  const W  = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      W[id(x, y)] = 1 + lam * h(-ext + (x + .5) * c, -ext + (y + .5) * c);

  const dist = new Float32Array(N * N).fill(1e9);
  const prev = new Int32Array(N * N).fill(-1);
  const H    = [];

  const push = (d, i) => {
    H.push([d, i]);
    let k = H.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (H[p][0] <= H[k][0]) break; [H[p], H[k]] = [H[k], H[p]]; k = p; }
  };
  const pop = () => {
    const t = H[0], l = H.pop();
    if (H.length) {
      H[0] = l; let k = 0;
      for (;;) {
        const a = 2 * k + 1, b = a + 1; let m = k;
        if (a < H.length && H[a][0] < H[m][0]) m = a;
        if (b < H.length && H[b][0] < H[m][0]) m = b;
        if (m === k) break; [H[m], H[k]] = [H[k], H[m]]; k = m;
      }
    }
    return t;
  };

  const s0 = id(cl(s[0]), cl(s[1])), g0 = id(cl(g[0]), cl(g[1]));
  dist[s0] = 0; push(0, s0);
  while (H.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue;
    if (u === g0) break;
    const ux = u % N, uy = (u / N) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const x = ux + dx, y = uy + dy;
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const v  = id(x, y);
        const nd = d + Math.hypot(dx, dy) * c * (W[u] + W[v]) / 2;
        if (nd < dist[v]) { dist[v] = nd; prev[v] = u; push(nd, v); }
      }
  }

  const path = [];
  for (let u = g0; u >= 0; u = prev[u])
    path.push([-ext + ((u % N) + .5) * c, -ext + (((u / N) | 0) + .5) * c]);
  path.reverse(); path[0] = s; path[path.length - 1] = g;

  /* Smooth */
  for (let k = 0; k < 4; k++)
    for (let i = 1; i < path.length - 1; i++)
      path[i] = [
        (path[i - 1][0] + path[i][0] + path[i + 1][0]) / 3,
        (path[i - 1][1] + path[i][1] + path[i + 1][1]) / 3,
      ];
  return path;
}

/* ── Path statistics ── */
function stat(h, p) {
  let L = 0, Rk = 0, gm = 0, jd = 1e9;
  const J = h.J;
  for (let i = 1; i < p.length; i++) {
    const d  = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    L  += d;
    Rk += d * (h(...p[i]) + h(...p[i - 1])) / 2;
    const e  = .01;
    const gx = (h(p[i][0] + e, p[i][1]) - h(p[i][0] - e, p[i][1])) / (2 * e);
    const gy = (h(p[i][0], p[i][1] + e) - h(p[i][0], p[i][1] - e)) / (2 * e);
    gm = Math.max(gm, Math.hypot(gx, gy));
    jd = Math.min(jd, Math.hypot(p[i][0] - J[0], p[i][1] - J[1]));
  }
  return { L, R: Rk, gm, jd };
}

/* ── Helpers ── */
const row  = (a, b) => `<div class="k"><span>${a}</span><span>${b}</span></div>`;
const card = (t, b) => `<div class="cd" style="margin:10px 0"><h3>${t}</h3>${b}</div>`;

function say(lines, done) {
  done();
}

/* ── Draw mission map ── */
function drawMap(h, dep, o, t, s, g, st, ho, sf, ext) {
  const x  = $('mc').getContext('2d');
  const W  = 900, Hh = 560;
  const sc = Math.min(W, Hh) / (2 * ext);
  const tx = a => W / 2 + a * sc;
  const ty = b => Hh / 2 - b * sc;

  x.fillStyle = '#05030f'; x.fillRect(0, 0, W, Hh);

  /* Hazard heat-map */
  for (let px = 0; px < W; px += 8)
    for (let py = 0; py < Hh; py += 8) {
      const v = h((px - W / 2) / sc, (Hh / 2 - py) / sc);
      if (v > .05) { x.fillStyle = `rgba(255,60,120,${Math.min(.8, v * .3)})`; x.fillRect(px, py, 8, 8); }
    }

  /* Orbits + planets */
  x.strokeStyle = '#4455aa'; x.lineWidth = 1; x.fillStyle = '#cdd6ff'; x.font = '12px system-ui';
  P.forEach((p, i) => {
    if (p[1] > ext) return;
    x.beginPath(); x.arc(tx(0), ty(0), p[1] * sc, 0, 7); x.stroke();
    const a  = ang(i, dep) * R2;
    const px2 = tx(p[1] * Math.cos(a));
    const py2 = ty(p[1] * Math.sin(a));
    x.fillStyle = '#' + p[8].toString(16).padStart(6, '0');
    x.beginPath(); x.arc(px2, py2, i === o || i === t ? 6 : 4, 0, 7); x.fill();
    x.fillStyle = '#e2e9ff'; x.fillText(p[0], px2 + 7, py2 - 6);
  });

  /* Sun */
  x.fillStyle = '#ffcc55'; x.beginPath(); x.arc(tx(0), ty(0), 6, 0, 7); x.fill();

  /* Paths */
  const dr = (p, c2, wd, dash) => {
    x.strokeStyle = c2; x.lineWidth = wd; x.setLineDash(dash || []);
    x.beginPath(); p.forEach((q, i) => i ? x.lineTo(tx(q[0]), ty(q[1])) : x.moveTo(tx(q[0]), ty(q[1]))); x.stroke();
    x.setLineDash([]);
  };
  dr(st, '#ff5555', 2, [6, 5]); dr(ho, '#ffd27a', 2.5); dr(sf, '#7df9ff', 3.5);

  /* Legend */
  x.font = '13px system-ui';
  [['- - Straight (fastest geometry)', '#ff5555'],
   ['— Hohmann arc (least fuel)',       '#ffd27a'],
   ['— Optimised safe corridor',        '#7df9ff'],
   ['Pink glow = hazard field h(x,y)',  '#ff6ad5'],
  ].forEach(([label, col], idx) => { x.fillStyle = col; x.fillText(label, 12, 22 + idx * 18); });
}

/* ── Planet → Planet mission ── */
export function planet(o, t, lam) {
  $('mc').style.display = 'block';
  const d0 = days(), r1 = P[o][1], r2 = P[t][1];
  const at  = (r1 + r2) / 2;
  const v1  = Math.sqrt(MU / (r1 * AU));
  const v2  = Math.sqrt(MU / (r2 * AU));
  const dv1 = Math.abs(v1 * (Math.sqrt(2 * r2 / (r1 + r2)) - 1));
  const dv2 = Math.abs(v2 * (1 - Math.sqrt(2 * r1 / (r1 + r2))));
  const Tt  = Math.PI * Math.sqrt((at * AU) ** 3 / MU) / 86400;
  const n1  = 360 / P[o][3], n2 = 360 / P[t][3];
  const phReq = 180 - n2 * Tt, phNow = mod(ang(t, d0) - ang(o, d0), 360);
  const rate  = n2 - n1;
  const w     = rate > 0 ? mod(phReq - phNow, 360) / rate : mod(phNow - phReq, 360) / -rate;
  const syn   = 360 / Math.abs(rate);
  const dep   = d0 + w, arr = dep + Tt;
  const dvT   = dv1 + dv2;
  const mrC   = Math.exp(dvT / 4.4), mrI = Math.exp(dvT / 30);

  const lines = [
    `Loaded J2000 orbital elements for ${P[o][0]} and ${P[t][0]} (JPL mean elements).`,
    `Today: ${dstr(d0)}. Phase angle now ${f(phNow, 1)}°, Hohmann transfer needs ${f(mod(phReq, 360), 1)}°.`,
    `Vis-viva: Δv₁=${f(dv1, 2)} km/s, Δv₂=${f(dv2, 2)} km/s; Kepler transfer time T=π√(a³/μ)=${f(Tt, 0)} days.`,
    `Next launch window: ${dstr(dep)} (synodic period ${f(syn, 0)} d). Building hazard field h(x,y) at that date.`,
    `Integrating risk R=∫h ds along straight, Hohmann and optimised routes. Minimising ∫(1+${lam.toFixed(1)}·h)ds on a 140×140 grid.`,
  ];

  say(lines, () => {
    const h   = mkH(dep, o, t);
    const ja  = ang(4, dep) * R2;
    h.J = [5.203 * Math.cos(ja), 5.203 * Math.sin(ja)];

    const th0 = ang(o, dep) * R2, ta = ang(t, arr) * R2;
    const s   = [r1 * Math.cos(th0), r1 * Math.sin(th0)];
    const g   = [r2 * Math.cos(ta),  r2 * Math.sin(ta)];
    const ext = 1.35 * Math.max(r1, r2) + .5;

    const st = [], ho = [], e2 = Math.abs(r2 - r1) / (r1 + r2), out = r2 > r1;
    for (let i = 0; i <= 300; i++) {
      const u  = i / 300;
      st.push([s[0] + (g[0] - s[0]) * u, s[1] + (g[1] - s[1]) * u]);
      const sA = u * Math.PI, nu = out ? sA : Math.PI + sA;
      const rr = at * (1 - e2 * e2) / (1 + e2 * Math.cos(out ? sA : nu));
      const pa = th0 + (out ? sA : sA);
      ho.push([rr * Math.cos(pa), rr * Math.sin(pa)]);
    }
    const sf = plan(h, s, g, ext, lam);
    const A  = stat(h, st), B = stat(h, ho), Cc = stat(h, sf);

    drawMap(h, dep, o, t, s, g, st, ho, sf, ext);

    const best = (B.R > 1.25 * Cc.R && lam > 0) ? 'corridor' : 'hohmann';
    const cut  = (1 - Cc.R / A.R) * 100;
    const pen  = (Cc.L / A.L - 1) * 100;
    const dose = 1.8 * Tt;
    const pt   = P[t];
    const lt   = Math.hypot(
      r2 * Math.cos(ta) - Math.cos(ang(2, arr) * R2),
      r2 * Math.sin(ta) - Math.sin(ang(2, arr) * R2),
    ) * 499 / 60;
    const belt = (r1 < 2.2 && r2 > 3.2) || (r2 < 2.2 && r1 > 3.2);

    $('rep').innerHTML =
      card('✅ Decision: ' + (best === 'corridor' ? 'fly the optimised safe corridor' : 'fly the Hohmann transfer'),
        `<p>${best === 'corridor'
          ? `The fuel-optimal Hohmann arc carries <b>${f(B.R / Cc.R, 1)}×</b> the risk of the safe corridor. Use the corridor, or shift the departure date so the hazards move off your arc, and budget extra mid-course Δv for the longer path (+${f(pen, 0)}% length vs straight).`
          : `The Hohmann arc is already within 25% of the lowest achievable risk (R=${f(B.R, 2)} vs ${f(Cc.R, 2)}). It also uses the least fuel, so it is both the right and the safe path.`
        }</p>`) +
      card('📍 Where and when',
        row('Depart', `${P[o][0]} on <b>${dstr(dep)}</b> (in ${f(w, 0)} days)`) +
        row('Arrive', `${pt[0]} on ${dstr(arr)}`) +
        row('Transfer time', f(Tt, 0) + ' days (' + f(Tt / 30.44, 1) + ' months)') +
        row('Next window after that', '+' + f(syn, 0) + ' days') +
        row('Distance at arrival', f(lt / 8.317, 2) + ' AU from Earth (signal delay ' + f(lt, 1) + ' min one way)')) +
      card('🧮 How: the calculus',
        row('Burn 1 (leave orbit)',         f(dv1, 2) + ' km/s') +
        row('Burn 2 (match target)',        f(dv2, 2) + ' km/s') +
        row('Total heliocentric Δv',        f(dvT, 2) + ' km/s' + (o === 2 ? ' (+≈3.2 from low Earth orbit)' : '')) +
        row('Mass ratio, chemical (v_e 4.4 km/s)', f(mrC, 2) + ' : 1') +
        row('Mass ratio, ion (v_e 30 km/s)',        f(mrI, 2) + ' : 1') +
        `<p class="mu">Δv comes from vis-viva v²=μ(2/r−1/a); time from Kepler's law; fuel from integrating the rocket equation, Δv=v_e ln(m₀/m_f).</p>`) +
      card('🛡️ Why: risk integrals R=∫h ds',
        row('Straight line',  `R=${f(A.R,  2)} · length ${f(A.L,  2)} AU · max|∇h| ${f(A.gm,  2)}`) +
        row('Hohmann arc',    `R=${f(B.R,  2)} · length ${f(B.L,  2)} AU · max|∇h| ${f(B.gm,  2)}`) +
        row('Safe corridor',  `R=${f(Cc.R, 2)} · length ${f(Cc.L, 2)} AU · max|∇h| ${f(Cc.gm, 2)}`) +
        `<p>The corridor cuts risk by <b class="ok">${f(cut, 0)}%</b> versus the straight line at the cost of <b>${f(pen, 0)}%</b> extra path. Closest approach to Jupiter's radiation zone: ${f(Math.min(A.jd, B.jd, Cc.jd), 2)} AU (corridor ${f(Cc.jd, 2)} AU).${belt ? ' The route crosses the main asteroid belt (2.2–3.2 AU). It is sparse, and probes since Pioneer 10 (1972) have crossed it safely.' : ''}</p>`) +
      card('👩‍🚀 Crew and target',
        row('Cruise radiation (≈1.8 mSv/day, MSL RAD)', f(dose, 0) + ' mSv one way') +
        row('Share of NASA 600 mSv career limit', `<span class="${dose > 300 ? 'warn' : ''}">${f(dose / 6, 0)}% each way</span>`) +
        row('Target gravity / temperature', `${pt[6]} m/s² / ${pt[7]} °C`) +
        `<p class="mu">${pt[9]}</p>` +
        `<p class="${dose > 300 ? 'warn' : 'mu'}">${dose > 300
          ? 'A round trip exceeds the career dose budget without heavy shielding or a faster transfer; consider robotic research first.'
          : 'Dose is within career limits for a single leg.'}</p>`) +
      card('⚠️ Limits',
        `<p class="mu">Circular-orbit positions (error of a few degrees), 2-D hazard model with simplified Gaussian fields, patched-conic Δv. Use as a research planner; verify with JPL Horizons and flight dynamics software before real operations.</p>` +
        `<button onclick="navigator.clipboard&&navigator.clipboard.writeText($('rep').innerText).catch(()=>{})">Copy report</button> ` +
        `<button onclick="print()">Print</button>`);
  });
}

/* ── Deep-space mission ── */
export function deepSpace(i, lam = 1.0) {
  $('mc').style.display = 'none';
  const d  = D[i];
  const svEl = $('sv');
  const v  = svEl ? +svEl.value : 17;
  const b  = v / 299792.458;
  const t  = d[3] / b;
  const gm = 1 / Math.sqrt(1 - b * b);
  const tau = t / gm;
  const lg = v / 4.4 / Math.LN10;
  const m  = d[4] * MS;
  const rs = m ? 2 * G * m / C ** 2 : 0;
  const rt = m ? Math.cbrt(4 * G * m / 10) : 0;

  say([
    `Target ${d[1]}: ${f(d[3])} ly, type ${d[2]}.`,
    `Travel time t=d/β at ${f(v)} km/s (β=${b.toFixed(5)}).`,
    `Rocket equation m₀/m_f=exp(Δv/v_e): checking fuel feasibility.`,
    m ? `Black hole safety: solving 4GM/r³=10 m/s² for tidal stand-off.`
      : `Scanning route for hazards and planning staged approach.`,
  ], () => {
    const crew = t < 80;
    $('rep').innerHTML =
      card(crew ? '✅ Decision: crewed flight is conceivable' : '🚫 Decision: no crewed flight; use remote science and staged robotic probes',
        `<p>${d[6]}</p>` +
        row('Distance',                 f(d[3]) + ' light-years') +
        row('Travel time (Earth frame)', f(t, 1) + ' years') +
        row('Crew time (time dilation)', f(tau, 1) + ' years (γ=' + gm.toFixed(4) + ')') +
        row('One-way signal delay',      f(d[3], 1) + ' years') +
        row('Chemical fuel mass ratio',  lg < 6 ? f(Math.pow(10, lg), 0) + ' : 1' : '10^' + f(lg, 0) + ' : 1 (impossible)')) +
      (m ? card('🕳️ Black hole approach limits',
        row('Schwarzschild radius',                f(rs / 1000, 1) + ' km') +
        row('Tidal limit (10 m/s² over 2 m body)', f(rt / 1000, 0) + ' km') +
        `<p>${rt > rs * 3
          ? `Stand-off must be set by tides: the crew would be torn apart at ${f(rt / rs, 0)}× r_s, long before the horizon. Keep beyond ${f(rt / 1000, 0)} km.`
          : `Tides are survivable far outside the horizon. The real limit is the ISCO at 3 r_s (${f(3 * rs / 1000, 0)} km), inside which no stable orbit exists.`} Never plan closer than that.</p>`) : '') +
      card('🧭 Recommended staged plan',
        `<p>1) Launch to Jupiter and use its gravity assist to gain Δv, as Voyager did (Voyager 1 now moves at 17 km/s and crossed the heliopause at about 121 AU in 2012). 2) Study the target remotely with JWST, EHT and radio arrays, whose cost and risk are far lower. 3) For stars under 10 ly, concept missions such as Breakthrough Starshot propose gram-scale probes at about 0.2 c (≈20 years). 4) Reserve crewed exploration for the Moon, Mars and the inner Solar System, where trip times are months.</p>` +
        `<p class="mu">Caution λ=${lam.toFixed(1)} only applies to Solar System routing.</p>` +
        `<button onclick="navigator.clipboard&&navigator.clipboard.writeText($('rep').innerText).catch(()=>{})">Copy report</button> ` +
        `<button onclick="print()">Print</button>`);
  });
}

