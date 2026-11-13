/* ============================================================
   data.js — static astronomical datasets (ES module)
   ============================================================ */

// Planet data: [name, a(AU), L0(deg J2000), period(days), radius(km),
//               mass(kg), surface-g(m/s²), mean-temp(°C), colour-hex, fact]
export const P = [
  ['Mercury', .387,  252.25,   87.969,  2439.7, 3.30e23,  3.7,  167, 0xb5b5b5, 'No atmosphere: surface swings from −180 °C to 430 °C.'],
  ['Venus',   .723,  181.98,  224.701,  6051.8, 4.87e24,  8.87, 464, 0xe8c98a, 'Surface pressure about 92 bar; hottest planet (CO₂ greenhouse).'],
  ['Earth',   1,     100.46,  365.256,  6371,   5.97e24,  9.81,  15, 0x4aa3ff, 'Home. Mean orbital speed about 29.8 km/s.'],
  ['Mars',    1.524, 355.45,  686.98,   3389.5, 6.42e23,  3.71, -65, 0xe2623a, 'Thin CO₂ air. Surface radiation about 0.64 mSv/day (MSL RAD).'],
  ['Jupiter', 5.203,  34.40, 4332.59,  69911,  1.898e27, 24.79,-110, 0xe0b98a, "Intense radiation belts; Europa's surface gets about 5 Sv/day, lethal to humans."],
  ['Saturn',  9.555,  49.94,10759.22,  58232,  5.683e26, 10.44,-140, 0xf0dca0, 'Rings span 282,000 km yet are about 10 m thick. Density below water.'],
  ['Uranus', 19.218, 313.23,30688.5,   25362,  8.68e25,  8.87, -195, 0x8fe3e8, 'Axis tilted 98°. Coldest measured planetary atmosphere (−224 °C).'],
  ['Neptune',30.11,  304.88,60182,     24622,  1.024e26, 11.15,-200, 0x4a6bff, 'Winds near 2,100 km/h. Visited once, by Voyager 2 in 1989.'],
  ['Pluto',  39.48,  238.93,90560,      1188,  1.3e22,    .62, -225, 0xd9c3a5, 'Dwarf planet, 248-year orbit. New Horizons flyby in 2015.'],
];

// Deep-space objects: [id, name, type, distance(ly), BH-mass(Msun), colour-hex, fact]
export const D = [
  ['alpha', 'Alpha Centauri',                    'Star system',               4.37,       0, 0xffe9a8, 'Nearest star system. Proxima b, an Earth-mass planet in the habitable zone, orbits Proxima.'],
  ['sirius','Sirius',                             'Star',                      8.6,        0, 0xaad4ff, 'Brightest star in the night sky. Its companion Sirius B is a white dwarf.'],
  ['betel', 'Betelgeuse',                         'Red supergiant',            550,        0, 0xff7a4a, 'Hundreds of times wider than the Sun; expected to explode as a supernova within about 100,000 years.'],
  ['m42',   'Orion Nebula (M42)',                 'Nebula',                   1344,        0, 0xff6ad5, 'Stellar nursery about 24 ly across; hundreds of young stars are forming.'],
  ['m1',    'Crab Nebula (M1)',                   'Supernova remnant',        6500,        0, 0x66ccff, 'Remnant of SN 1054. Its pulsar spins about 30 times per second.'],
  ['m16',   'Eagle Nebula (Pillars of Creation)', 'Nebula',                   7000,        0, 0x66ff99, 'Gas columns 4–5 ly tall where stars are born.'],
  ['cygx1', 'Cygnus X-1',                        'Stellar black hole',       7200,       21.2,0xff9a3a,'Black hole of about 21 M☉ feeding on a blue supergiant; strong X-ray source.'],
  ['sgra',  'Sagittarius A*',                     'Supermassive black hole', 26670,     4.3e6, 0xffd27a, "Milky Way's central black hole, 4.3 million M☉. Imaged by the EHT in 2022."],
  ['lmc',   'Large Magellanic Cloud',             'Galaxy',                 160000,         0, 0xbfd0ff, 'Dwarf satellite galaxy with about 30 billion stars; home of SN 1987A.'],
  ['m31',   'Andromeda Galaxy (M31)',             'Galaxy',               2537000,         0, 0x9db8ff, 'Nearest large galaxy, about 1 trillion stars; approaching at about 110 km/s.'],
  ['m51',   'Whirlpool Galaxy (M51)',             'Galaxy',              23000000,         0, 0x88aaff, 'Face-on spiral interacting with the companion NGC 5195.'],
  ['m87',   'M87 and its black hole M87*',        'Galaxy + black hole', 53500000,    6.5e9, 0xffb86b, 'Giant elliptical galaxy; its 6.5 billion M☉ black hole made the first black-hole image (EHT, 2019).'],
];

// Physical & orbital constants
export const AU  = 1.496e8;    // km per AU
export const MU  = 1.32712e11; // heliocentric GM (km³/s²)
export const G   = 6.674e-11;  // m³ kg⁻¹ s⁻²
export const C   = 2.998e8;    // m/s
export const MS  = 1.989e30;   // solar mass (kg)
export const R2  = Math.PI / 180;

// Helpers
export const f   = (x, d = 2) => Number(x).toLocaleString('en', { maximumFractionDigits: d });
export const fe  = x => Number(x).toExponential(2);
export const mod = (a, m) => ((a % m) + m) % m;

export const days  = ()        => (Date.now() - Date.UTC(2000, 0, 1, 12)) / 864e5;
export const ang   = (i, d)    => P[i][2] + 360 * d / P[i][3];
export const dstr  = d         => new Date(Date.UTC(2000, 0, 1, 12) + d * 864e5).toISOString().slice(0, 10);
export const vorb  = i         => 2 * Math.PI * P[i][1] * AU / (P[i][3] * 86400);
export const kind  = d         => /Nebula|remnant/.test(d[2]) ? 'n' : /^Galaxy/.test(d[2]) ? 'g' : /black hole/.test(d[2]) ? 'b' : 's';

// Glossary entries
export const GLOSSARY = [
  { term: 'Astronomical Unit (AU)', symbol: '1 AU ≈ 1.496 × 10⁸ km', def: 'The mean Earth–Sun distance. Used as the ruler of the Solar System.' },
  { term: 'Light-year (ly)',        symbol: '1 ly ≈ 9.461 × 10¹² km', def: 'Distance light travels in one year. Used for stellar and galactic scales.' },
  { term: 'Δv (Delta-v)',           symbol: 'km/s',                    def: 'Change in velocity. The key currency of spaceflight — every manoeuvre costs Δv, which costs fuel.' },
  { term: 'Hohmann Transfer',       symbol: 'Minimum-energy ellipse',  def: 'An orbital manoeuvre using two engine burns to move between two circular orbits with least fuel.' },
  { term: 'Vis-viva Equation',      symbol: 'v² = μ(2/r − 1/a)',       def: 'Gives orbital speed at any point r on an ellipse with semi-major axis a. Fundamental to calculating Δv.' },
  { term: 'Tsiolkovsky Equation',   symbol: 'Δv = vₑ ln(m₀/mf)',       def: 'Relates Δv to exhaust velocity and the ratio of initial to final mass. The rocket equation.' },
  { term: 'Schwarzschild Radius',   symbol: 'rₛ = 2GM/c²',             def: 'The event-horizon radius of a non-rotating black hole. Below this, escape velocity exceeds c.' },
  { term: 'Time Dilation',          symbol: 'τ = t √(1 − rₛ/r)',       def: 'Clocks run slower in stronger gravity (or at high speed). Crew age less than observers far away.' },
  { term: 'Lorentz Factor (γ)',      symbol: 'γ = 1/√(1 − v²/c²)',      def: 'Scales relativistic mass, time, and length. At v = 0.1c, γ ≈ 1.005; at 0.5c, γ ≈ 1.155.' },
  { term: 'Synodic Period',         symbol: '1/S = |1/T₁ − 1/T₂|',    def: 'Time between successive alignments of two planets as seen from the Sun. Sets the launch-window cadence.' },
  { term: 'Hazard Field h(x,y)',    symbol: 'dimensionless scalar',     def: 'The agent\'s model of radiation and gravity danger at each point. Radiation + proximity to Jupiter + solar wind.' },
  { term: 'Line Integral R = ∫h ds',symbol: 'AU (weighted)',           def: 'Total risk accumulated along a path — the integral of the hazard field over arc length.' },
  { term: 'Eikonal / Dijkstra',     symbol: 'Grid pathfinding',        def: 'Numerical method to find the path that minimises ∫(1 + λh) ds over a discretised 2-D grid.' },
  { term: 'J2000 Epoch',            symbol: '2000-01-01 12:00 TT',     def: 'Standard astronomical reference instant. Orbital elements are measured from this date.' },
  { term: 'Hawking Temperature',    symbol: 'T = ħc³ / (8πGMk_B)',    def: 'Tiny thermal radiation emitted by black holes. Smaller black holes are hotter; stellar BHs are far cooler than the CMB.' },
];
