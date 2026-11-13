# COSMOS · Calculus Navigation for Deep Space

> Navigate the universe with calculus — an interactive educational space-mission planner.

[![Live Demo](https://img.shields.io/badge/Live-Demo-7df9ff?style=flat-square)](https://cosmos-delta.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff6ad5?style=flat-square)](LICENSE)

---

## ✨ Features

| Section | What it does |
|---------|-------------|
| 🌌 **3-D Universe** | Interactive Three.js scene — Sun, 8 planets + Pluto, stars, nebulae, galaxies, and black holes. Click any object to inspect it. |
| 🛰️ **AI Mission Analyst** | On-device agent that reads real JPL orbital elements, builds a 2-D hazard field, and finds the optimal route using Dijkstra on a 140 × 140 grid. Outputs a full mission report with Δv, launch window, radiation dose, and risk integrals. |
| 🕳️ **Black Hole Lab** | Live Schwarzschild radius, time dilation, tidal forces, escape velocity, and Hawking temperature for Cygnus X-1, Sgr A*, and M87*. |
| 📐 **Maths Guide** | Cards explaining parametric curves, line integrals, gradients, calculus of variations, the Tsiolkovsky equation, and special relativity. |
| 📖 **Glossary** | 15 key terms — AU, Δv, Hohmann transfer, Lorentz factor, and more. |

---

## 🚀 Getting Started

No build step required — pure HTML/CSS/JS ES modules.

```bash
# Clone
git clone https://github.com/kiranrajar/cosmos.git
cd cosmos

# Open locally (needs a local server for ES modules)
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080` (or `http://localhost:5000` with `npx serve`).

---

## 🗂 File Structure

```
cosmos/
├── index.html      # App shell, navigation, section markup
├── main.js         # Entry point — wires all modules together
├── universe.js     # Three.js 3-D scene (planets, stars, deep-space objects)
├── agent.js        # AI Mission Analyst — orbital mechanics & pathfinding
├── blackhole.js    # Black Hole Lab physics
├── data.js         # Astronomical data, constants, helpers, glossary
├── styles.css      # All CSS (design tokens, layout, animations)
├── favicon.svg     # SVG favicon (solar-system motif)
└── vercel.json     # Vercel deployment config
```

---

## 🧮 The Maths

The mission planner uses real orbital mechanics:

- **Vis-viva equation** `v² = μ(2/r − 1/a)` for Δv at each burn
- **Kepler's third law** `T = π√(a³/μ)` for transfer time
- **Tsiolkovsky equation** `Δv = vₑ ln(m₀/mf)` for fuel mass ratio
- **Line integral** `R = ∫ h(r(s)) ds` to quantify path risk
- **Dijkstra / eikonal solver** to minimise `∫(1 + λh) ds` on a 140×140 grid
- **Schwarzschild metric** for black-hole physics

---

## 📡 Data Sources

- Planetary orbital elements: **JPL J2000 mean elements**
- Deep-space object distances & masses: published astronomical catalogues
- Radiation model: **Mars Science Laboratory RAD** (≈1.8 mSv/day cruise dose)

---

## 🛠 Deployment

Deployed automatically via **Vercel** on every push to `main`.

```bash
vercel --prod
```

---

## 📄 License

MIT © 2026 Kiran Rajar

