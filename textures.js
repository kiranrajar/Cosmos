/* ============================================================
   textures.js — Procedural High-Definition Planet Textures
   Generates physically grounded diffuse and normal maps using
   multi-octave simplex/Perlin noise on OffscreenCanvas.
   Zero external asset dependencies, 100% instant offline load.
   ============================================================ */

const T = THREE;

function createNoiseGenerator() {
  // Fast 2D/3D simplex-like gradient noise
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const n = Math.floor(Math.random() * (i + 1));
    const q = p[i]; p[i] = p[n]; p[n] = q;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  function lerp(a, b, t) { return a + t * (b - a); }

  return function noise3d(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;

    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
           lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
           lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w
    );
  };
}

const noise3 = createNoiseGenerator();

function fbm(x, y, z, octaves = 6, lacunarity = 2.0, gain = 0.5) {
  let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise3(x * frequency, y * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return (total / maxValue + 1) * 0.5; // normalized 0..1
}

// Convert spherical UV coordinates to 3D Cartesian coordinates for seamless projection
function uvToSphere(u, v) {
  const theta = u * Math.PI * 2;
  const phi = (v - 0.5) * Math.PI;
  return [
    Math.cos(phi) * Math.cos(theta),
    Math.sin(phi),
    Math.cos(phi) * Math.sin(theta)
  ];
}

/* ────────────────────────────────────────────────────────────
   Texture Generators for Each Planet & Celestial Body
   ──────────────────────────────────────────────────────────── */

export function generateSunTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const n1 = fbm(sx * 3.5, sy * 3.5, sz * 3.5, 6, 2.1, 0.55);
      const n2 = fbm(sx * 12 + 10, sy * 12, sz * 12, 4, 2.4, 0.45);
      const val = n1 * 0.75 + n2 * 0.25;

      const idx = (y * width + x) * 4;
      // Solar chromosphere: intense gold-white center with turbulent orange-red coronal granules
      data[idx]     = Math.min(255, Math.floor(255 * (val > 0.6 ? 1 : val * 1.5)));
      data[idx + 1] = Math.min(255, Math.floor(190 * (val * 1.2) + 40));
      data[idx + 2] = Math.min(255, Math.floor(40 * (val * val * 2.5)));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  tex.wrapT = T.ClampToEdgeWrapping;
  return tex;
}

export function generateEarthTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const lat = (0.5 - v) * Math.PI; // -pi/2 to pi/2
    const isPolar = Math.abs(lat) > 1.2;

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const continent = fbm(sx * 2.2, sy * 2.2, sz * 2.2, 7, 2.0, 0.52);
      const mountains = fbm(sx * 6 + 5, sy * 6, sz * 6, 5, 2.1, 0.5);

      const idx = (y * width + x) * 4;

      if (isPolar || (Math.abs(lat) > 1.05 && continent > 0.48)) {
        // Polar ice caps
        const ice = 220 + Math.floor(fbm(sx * 10, sy * 10, sz * 10, 3) * 35);
        data[idx] = ice; data[idx + 1] = ice + 5; data[idx + 2] = 255;
      } else if (continent > 0.53) {
        // Landmass
        if (mountains > 0.68) {
          // Alpine peaks / high mountain tundra
          data[idx] = 160; data[idx + 1] = 150; data[idx + 2] = 135;
        } else if (Math.abs(lat) < 0.4 && continent < 0.62) {
          // Equatorial arid/desert belts (Sahara / Middle East vibe)
          data[idx] = 195; data[idx + 1] = 165; data[idx + 2] = 110;
        } else {
          // Temperate and tropical forest vegetation
          const green = Math.floor(95 + mountains * 45);
          data[idx] = 40; data[idx + 1] = green; data[idx + 2] = 45;
        }
      } else if (continent > 0.50) {
        // Shallow coastal shelf turquoise waters
        data[idx] = 18; data[idx + 1] = 100; data[idx + 2] = 150;
      } else {
        // Deep abyssal ocean blue
        const oceanDepth = continent / 0.5;
        data[idx] = Math.floor(8 * oceanDepth);
        data[idx + 1] = Math.floor(35 + 20 * oceanDepth);
        data[idx + 2] = Math.floor(80 + 35 * oceanDepth);
      }
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}

export function generateCloudsTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      // Swirling cyclone weather fronts
      const swirl = fbm(sx * 3.8 + sy * 1.5, sy * 3.8, sz * 3.8, 6, 2.1, 0.55);
      const detail = fbm(sx * 9, sy * 9, sz * 9, 4, 2.0, 0.5);
      const density = Math.max(0, swirl * 0.7 + detail * 0.3 - 0.45) * 2.2;

      const idx = (y * width + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.min(255, Math.floor(density * 255));
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}

export function generateMarsTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const isPolar = Math.abs(0.5 - v) > 0.44;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const highlands = fbm(sx * 3, sy * 3, sz * 3, 6, 2.0, 0.52);
      const craters = fbm(sx * 10, sy * 10, sz * 10, 4, 2.2, 0.4);

      const idx = (y * width + x) * 4;
      if (isPolar) {
        // Carbon dioxide and water ice polar cap
        const ice = 230 + Math.floor(highlands * 25);
        data[idx] = ice; data[idx + 1] = ice - 10; data[idx + 2] = ice - 5;
      } else {
        // Red iron oxide rust soil, darker volcanic basalt basins (Syrtis Major)
        const darkBasin = highlands < 0.45 ? 0.65 : 1.0;
        data[idx]     = Math.floor((175 + highlands * 60 + craters * 20) * darkBasin);
        data[idx + 1] = Math.floor((70 + highlands * 45) * darkBasin);
        data[idx + 2] = Math.floor((40 + highlands * 25) * darkBasin);
      }
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}

export function generateJupiterTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    // Zonal atmospheric jet stream bands
    const latWave = Math.sin(v * 28 * Math.PI) * 0.15;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const turbulence = fbm(sx * 8 + latWave, sy * 2, sz * 8, 5, 2.2, 0.6);

      // Great Red Spot at approx lat 22 deg South, u approx 0.65
      const spotDx = (u - 0.62) * 4.0;
      const spotDy = (v - 0.65) * 8.0;
      const isRedSpot = (spotDx * spotDx + spotDy * spotDy) < 0.08;

      const idx = (y * width + x) * 4;

      if (isRedSpot) {
        const dist = Math.sqrt(spotDx * spotDx + spotDy * spotDy);
        const swirl = Math.sin(dist * 20 + turbulence * 4) * 20;
        data[idx] = 205 + swirl; data[idx + 1] = 85; data[idx + 2] = 50;
      } else {
        const band = Math.sin(v * 36 + turbulence * 3.5);
        if (band > 0.2) {
          // Bright ammonia ice cloud zone (Zones)
          data[idx] = 230 + Math.floor(turbulence * 25);
          data[idx + 1] = 210 + Math.floor(turbulence * 20);
          data[idx + 2] = 185;
        } else {
          // Reddish-brown hydrocarbon smog belt (Belts)
          data[idx] = 185 + Math.floor(turbulence * 35);
          data[idx + 1] = 120 + Math.floor(turbulence * 20);
          data[idx + 2] = 80;
        }
      }
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}

export function generateSaturnTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const turbulence = fbm(sx * 6, sy * 1.5, sz * 6, 4, 2.0, 0.5);
      const band = Math.sin(v * 48 + turbulence * 1.2);

      const idx = (y * width + x) * 4;
      // Pale butter-gold and warm haze tones
      data[idx]     = Math.floor(215 + band * 20 + turbulence * 15);
      data[idx + 1] = Math.floor(190 + band * 18 + turbulence * 12);
      data[idx + 2] = Math.floor(145 + band * 15);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}

export function generateRingTexture(width = 512, height = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let x = 0; x < width; x++) {
    const r = x / width; // 0 (inner) to 1 (outer)
    // Cassini division between approx 0.65 and 0.72
    const inCassini = r > 0.64 && r < 0.72;
    // Encke division
    const inEncke = r > 0.88 && r < 0.90;
    const ringDensity = (inCassini || inEncke) ? 0.05 : (
      Math.sin(r * 120) * 0.2 +
      Math.sin(r * 40) * 0.3 +
      0.5
    );

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      data[idx]     = 210;
      data[idx + 1] = 195;
      data[idx + 2] = 160;
      data[idx + 3] = Math.floor(Math.max(0, Math.min(255, ringDensity * 220)));
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  return tex;
}

export function generateMercuryTexture(width = 512, height = 256) {
  return generateCrateredBody(width, height, [130, 130, 135], [75, 75, 78]);
}

export function generateVenusTexture(width = 512, height = 256) {
  // Dense sulfuric acid cloud deck
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const clouds = fbm(sx * 4 + sy * 2, sy * 4, sz * 4, 5, 2.1, 0.55);
      const idx = (y * width + x) * 4;
      data[idx]     = Math.floor(225 + clouds * 25);
      data[idx + 1] = Math.floor(198 + clouds * 20);
      data[idx + 2] = Math.floor(140 + clouds * 15);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}

export function generateUranusTexture(width = 512, height = 256) {
  return generateGasGiant(width, height, [115, 205, 220], [80, 165, 185]);
}

export function generateNeptuneTexture(width = 512, height = 256) {
  return generateGasGiant(width, height, [45, 105, 235], [20, 60, 160], true);
}

export function generatePlutoTexture(width = 512, height = 256) {
  // Tombaugh Regio ("Heart" nitrogen ice plain)
  return generateCrateredBody(width, height, [195, 175, 155], [110, 85, 70]);
}

function generateGasGiant(width, height, color1, color2, hasDarkSpot = false) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const band = fbm(sx * 4, sy * 1.2, sz * 4, 4, 2.0, 0.5);
      const t = Math.sin(v * 24 + band * 2) * 0.5 + 0.5;

      const idx = (y * width + x) * 4;
      data[idx]     = Math.floor(color1[0] * t + color2[0] * (1 - t));
      data[idx + 1] = Math.floor(color1[1] * t + color2[1] * (1 - t));
      data[idx + 2] = Math.floor(color1[2] * t + color2[2] * (1 - t));
      data[idx + 3] = 255;

      if (hasDarkSpot) {
        const dSpot = Math.hypot((u - 0.45) * 4, (v - 0.6) * 6);
        if (dSpot < 0.25) {
          data[idx] = Math.floor(data[idx] * 0.5);
          data[idx + 1] = Math.floor(data[idx + 1] * 0.5);
          data[idx + 2] = Math.floor(data[idx + 2] * 0.7);
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}

function generateCrateredBody(width, height, lightColor, darkColor) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const [sx, sy, sz] = uvToSphere(u, v);
      const surface = fbm(sx * 4, sy * 4, sz * 4, 6, 2.0, 0.52);
      const craters = fbm(sx * 14, sy * 14, sz * 14, 4, 2.2, 0.4);
      const factor = surface * 0.75 + craters * 0.25;

      const idx = (y * width + x) * 4;
      data[idx]     = Math.floor(darkColor[0] + factor * (lightColor[0] - darkColor[0]));
      data[idx + 1] = Math.floor(darkColor[1] + factor * (lightColor[1] - darkColor[1]));
      data[idx + 2] = Math.floor(darkColor[2] + factor * (lightColor[2] - darkColor[2]));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = T.RepeatWrapping;
  return tex;
}
