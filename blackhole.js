/* ============================================================
   blackhole.js — Black Hole Lab (ES module)
   ============================================================ */
import { G, C, MS, f, fe } from './data.js';

const $ = id => document.getElementById(id);
const row = (a, b) => `<div class="k"><span>${a}</span><span>${b}</span></div>`;

export function initBlackHoleLab() {
  function bh() {
    const e = +$('bm').value;
    const k = +$('bk').value;
    const M  = Math.pow(10, e) * MS;
    const rs = 2 * G * M / C ** 2;
    const r  = k * rs;
    const hb = 1.0546e-34 * C ** 3 / (8 * Math.PI * G * M * 1.3807e-23);

    $('bn').textContent = fe(Math.pow(10, e));
    $('kn').textContent = k.toFixed(2);

    $('bo').innerHTML =
      row('Schwarzschild radius',             f(rs / 1000, 1) + ' km') +
      row('Photon sphere / ISCO',             f(1.5 * rs / 1000, 1) + ' / ' + f(3 * rs / 1000, 1) + ' km') +
      row('Your distance',                    f(r / 1000, 1) + ' km') +
      row('Time dilation (your clock vs far away)', f(Math.sqrt(1 - 1 / k), 4)) +
      row('Escape speed',                     f(C * Math.sqrt(1 / k) / 1000, 0) + ' km/s (' + f(Math.sqrt(1 / k) * 100, 1) + '% c)') +
      row('Tidal stretch over 2 m',           `<span class="${4 * G * M / r ** 3 > 10 ? 'warn' : ''}">${fe(4 * G * M / r ** 3)} m/s²</span>`) +
      row('Hawking temperature',              fe(hb) + ' K');
  }

  $('bm').oninput = $('bk').oninput = bh;
  document.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { $('bm').value = b.dataset.e; bh(); });
  bh();
}

