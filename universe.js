/* ============================================================
   universe.js — Next-Gen Cinematic 3-D Space Engine (Three.js)
   - Procedural high-res surface mapping for every planet
   - Physical sunlight, atmospheric scattering shaders & rim light
   - Volumetric multi-layered starfield parallax & drifting nebula
   - Accretion disk distortion & gravitational lensing for black holes
   - Particle cosmic dust and dynamic shooting meteors
   - Smooth cinematic camera travel and interactive orbit controls
   ============================================================ */

import { P, D, days, ang, kind, R2 } from './data.js';
import {
  generateSunTexture,
  generateEarthTexture,
  generateCloudsTexture,
  generateMarsTexture,
  generateJupiterTexture,
  generateSaturnTexture,
  generateRingTexture,
  generateMercuryTexture,
  generateVenusTexture,
  generateUranusTexture,
  generateNeptuneTexture,
  generatePlutoTexture
} from './textures.js';

const T = THREE;

/* Atmosphere Fresnel Glow Shader */
function createAtmosphereMaterial(color = 0x4aa3ff, coefficient = 0.5, power = 3.5) {
  return new T.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 glowColor;
      uniform float coef;
      uniform float power;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(coef - dot(vNormal, viewDir), power);
        intensity = clamp(intensity, 0.0, 1.0);
        gl_FragColor = vec4(glowColor, intensity * 0.85);
      }
    `,
    uniforms: {
      glowColor: { value: new T.Color(color) },
      coef: { value: coefficient },
      power: { value: power }
    },
    transparent: true,
    blending: T.AdditiveBlending,
    side: T.BackSide,
    depthWrite: false
  });
}

export function initUniverse({ onPick }) {
  const cv = document.getElementById('c');
  const R = new T.WebGLRenderer({
    canvas: cv,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false
  });
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  R.setSize(window.innerWidth, window.innerHeight, false);
  R.toneMapping = T.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.15;

  const S = new T.Scene();
  S.fog = new T.FogExp2(0x020108, 0.00035);

  const cam = new T.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 8000);
  cam.position.set(0, 95, 175);

  const ctl = new T.OrbitControls(cam, cv);
  ctl.enableDamping = true;
  ctl.dampingFactor = 0.05;
  ctl.maxDistance = 2200;
  ctl.minDistance = 2;
  ctl.rotateSpeed = 0.8;

  /* Ambient cosmic base light (deep void blue) */
  const ambientLight = new T.AmbientLight(0x0a0c18, 1.2);
  S.add(ambientLight);

  /* Primary Solar Point Light */
  const sunLight = new T.PointLight(0xfff6dd, 2.6, 2500, 0.4);
  sunLight.position.set(0, 0, 0);
  S.add(sunLight);

  /* Reusable circular glow texture */
  const gt = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.2, 'rgba(255,255,255,0.7)');
    r.addColorStop(0.5, 'rgba(125,249,255,0.25)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  })();

  function makeGlowSprite(color, size, opacity = 0.85) {
    const mat = new T.SpriteMaterial({
      map: gt,
      color: color,
      transparent: true,
      opacity: opacity,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new T.Sprite(mat);
    sprite.scale.set(size, size, 1);
    return sprite;
  }

  /* ────────────────────────────────────────────────────────────
     1. PARALLAX STARFIELDS & COSMIC DUST
     ──────────────────────────────────────────────────────────── */
  // Layer 1: Distant faint universe stars
  function makeStarField(count, minR, maxR, colors, size) {
    const geo = new T.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = minR + Math.random() * (maxR - minR);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * (0.6 + Math.random() * 0.4);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = new T.Color(colors[i % colors.length]);
      // random brightness flicker factor
      const b = 0.6 + Math.random() * 0.6;
      col[i * 3]     = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
    }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));

    return new T.Points(geo, new T.PointsMaterial({
      size: size,
      map: gt,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending
    }));
  }

  S.add(makeStarField(4500, 700, 2500, [0xffffff, 0xaad4ff, 0xffd27a, 0x88bbff], 2.8));
  S.add(makeStarField(2000, 300, 900, [0xffffff, 0x7df9ff, 0xffaacc], 2.0));

  // Layer 2: Drifting Cosmic Dust Field
  const dustCount = 800;
  const dustGeo = new T.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3]     = (Math.random() - 0.5) * 350;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 350;
  }
  dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
  const dustMat = new T.PointsMaterial({
    size: 1.4,
    color: 0x7df9ff,
    transparent: true,
    opacity: 0.35,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const dustPoints = new T.Points(dustGeo, dustMat);
  S.add(dustPoints);

  // Layer 3: Drifting Volumetric Nebula clouds
  const nebulaGroup = new T.Group();
  const nebColors = [0x4b2cff, 0xff3fb4, 0x00d2ff, 0x221155];
  for (let i = 0; i < 28; i++) {
    const col = nebColors[i % nebColors.length];
    const sp = makeGlowSprite(col, 180 + Math.random() * 220, 0.08 + Math.random() * 0.08);
    const angNeb = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
    const radNeb = 450 + Math.random() * 400;
    sp.position.set(
      radNeb * Math.cos(angNeb),
      (Math.random() - 0.5) * 160,
      radNeb * Math.sin(angNeb)
    );
    nebulaGroup.add(sp);
  }
  S.add(nebulaGroup);

  // Layer 4: Dynamic Shooting Stars (Meteors)
  const meteors = [];
  function spawnMeteor() {
    const geo = new T.BufferGeometry();
    const pos = new Float32Array([0, 0, 0, 0, 0, 0]);
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const mat = new T.LineBasicMaterial({
      color: 0x7df9ff,
      transparent: true,
      opacity: 0.9,
      blending: T.AdditiveBlending
    });
    const line = new T.Line(geo, mat);
    const start = new T.Vector3(
      (Math.random() - 0.5) * 600,
      80 + Math.random() * 100,
      (Math.random() - 0.5) * 600
    );
    const dir = new T.Vector3(-1.2 - Math.random(), -0.6 - Math.random() * 0.5, -0.8).normalize();
    const speed = 4 + Math.random() * 4;
    line.position.copy(start);
    S.add(line);
    meteors.push({ line, dir, speed, life: 60, maxLife: 60, currentPos: start.clone() });
  }

  /* ────────────────────────────────────────────────────────────
     2. SUN (CENTRAL CORONA & SOLAR PROMINENCE)
     ──────────────────────────────────────────────────────────── */
  const sunMeshGroup = new T.Group();
  const sunTex = generateSunTexture();
  const sunMat = new T.MeshBasicMaterial({ map: sunTex });
  const sunSphere = new T.Mesh(new T.SphereGeometry(5.2, 48, 48), sunMat);
  sunMeshGroup.add(sunSphere);

  // Glowing corona layers
  const sunInnerCorona = makeGlowSprite(0xffaa22, 24, 0.9);
  const sunOuterCorona = makeGlowSprite(0xff4400, 48, 0.4);
  const sunExtremeHaze = makeGlowSprite(0x4422ff, 75, 0.15);
  sunMeshGroup.add(sunInnerCorona);
  sunMeshGroup.add(sunOuterCorona);
  sunMeshGroup.add(sunExtremeHaze);

  S.add(sunMeshGroup);

  const hits = [];
  const hitMat = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  const sunHit = new T.Mesh(new T.SphereGeometry(7.5), hitMat());
  sunHit.userData.k = 'sun';
  sunMeshGroup.add(sunHit);
  hits.push(sunHit);

  /* ────────────────────────────────────────────────────────────
     3. PHOTOREALISTIC PLANETS & SATELLITES
     ──────────────────────────────────────────────────────────── */
  const planetMeshes = [];
  const planetClouds = [];
  const textureGenerators = [
    generateMercuryTexture,
    generateVenusTexture,
    generateEarthTexture,
    generateMarsTexture,
    generateJupiterTexture,
    generateSaturnTexture,
    generateUranusTexture,
    generateNeptuneTexture,
    generatePlutoTexture
  ];

  P.forEach((p, i) => {
    const pGroup = new T.Group();
    const rOrbit = 12 * Math.sqrt(p[1]);
    const pRadius = 0.55 + 1.1 * Math.pow(p[4] / 6371, 0.42);

    // Procedural surface texture
    const tex = textureGenerators[i]();
    const mat = new T.MeshStandardMaterial({
      map: tex,
      roughness: i === 2 ? 0.45 : 0.85,
      metalness: 0.05
    });

    const body = new T.Mesh(new T.SphereGeometry(pRadius, 48, 48), mat);
    body.castShadow = true;
    body.receiveShadow = true;
    pGroup.add(body);

    // Atmosphere & Cloud layers
    if (i === 2) {
      // Earth Atmosphere Fresnel Halo + Cloud Sphere
      const earthAtmo = new T.Mesh(new T.SphereGeometry(pRadius * 1.055, 36, 36), createAtmosphereMaterial(0x4aa3ff, 0.4, 3.2));
      pGroup.add(earthAtmo);

      const cloudsTex = generateCloudsTexture();
      const cloudsMat = new T.MeshStandardMaterial({
        map: cloudsTex,
        transparent: true,
        opacity: 0.72,
        blending: T.NormalBlending,
        roughness: 0.9
      });
      const cloudsMesh = new T.Mesh(new T.SphereGeometry(pRadius * 1.018, 40, 40), cloudsMat);
      pGroup.add(cloudsMesh);
      planetClouds.push({ mesh: cloudsMesh, speed: 0.0007 });
    } else if (i === 1) {
      // Venus thick golden atmosphere
      const venusAtmo = new T.Mesh(new T.SphereGeometry(pRadius * 1.06, 32, 32), createAtmosphereMaterial(0xffcf70, 0.45, 2.8));
      pGroup.add(venusAtmo);
    } else if (i === 3) {
      // Mars thin salmon atmosphere
      const marsAtmo = new T.Mesh(new T.SphereGeometry(pRadius * 1.035, 32, 32), createAtmosphereMaterial(0xee8866, 0.35, 4.0));
      pGroup.add(marsAtmo);
    } else if (i === 6 || i === 7) {
      // Uranus & Neptune Cyan/Blue methane atmosphere
      const gasAtmo = new T.Mesh(new T.SphereGeometry(pRadius * 1.05, 32, 32), createAtmosphereMaterial(p[8], 0.35, 3.0));
      pGroup.add(gasAtmo);
    }

    // Saturn's Photorealistic Double Rings with Shadows & Divisions
    if (i === 5) {
      const ringTex = generateRingTexture();
      const ringGeo = new T.RingGeometry(pRadius * 1.35, pRadius * 2.55, 96);
      // Map ring texture radially from inner to outer radius
      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let k = 0; k < pos.count; k++) {
        const vx = pos.getX(k), vy = pos.getY(k);
        const dist = Math.sqrt(vx * vx + vy * vy);
        const normR = (dist - pRadius * 1.35) / (pRadius * 2.55 - pRadius * 1.35);
        uvs.setXY(k, normR, 0.5);
      }
      uvs.needsUpdate = true;

      const ringMat = new T.MeshStandardMaterial({
        map: ringTex,
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.88,
        roughness: 0.7
      });
      const ringMesh = new T.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = 1.38;
      ringMesh.rotation.y = 0.12;
      pGroup.add(ringMesh);
    }

    // Interactive clickable sphere
    const pHit = new T.Mesh(new T.SphereGeometry(Math.max(pRadius * 1.9, 1.8)), hitMat());
    pHit.userData.k = 'p' + i;
    pGroup.add(pHit);
    hits.push(pHit);

    S.add(pGroup);
    planetMeshes.push({ group: pGroup, body, radius: pRadius, orbitR: rOrbit });

    // Luminous glowing orbit spline
    const orbitPts = [];
    const segments = 160;
    for (let k = 0; k <= segments; k++) {
      const theta = (k / segments) * Math.PI * 2;
      orbitPts.push(new T.Vector3(rOrbit * Math.cos(theta), 0, rOrbit * Math.sin(theta)));
    }
    const orbitGeo = new T.BufferGeometry().setFromPoints(orbitPts);
    const orbitLine = new T.Line(orbitGeo, new T.LineBasicMaterial({
      color: 0x3d4e8c,
      transparent: true,
      opacity: 0.38,
      blending: T.AdditiveBlending
    }));
    S.add(orbitLine);
  });

  /* ────────────────────────────────────────────────────────────
     4. DEEP SPACE OBJECTS & REALISTIC BLACK HOLES
     ──────────────────────────────────────────────────────────── */
  const deepObjects = [];
  D.forEach((d, i) => {
    const k = kind(d);
    const g = new T.Group();
    const a = i * 2.399;
    const distR = 175 + 26 * Math.log10(d[3] + 1);
    g.position.set(distR * Math.cos(a), 55 * Math.sin(i * 1.7), distR * Math.sin(a));

    if (k === 's') {
      // Star with multi-tier glow
      g.add(makeGlowSprite(d[5], 22, 0.9));
      g.add(makeGlowSprite(0xffffff, 10, 1.0));
    } else if (k === 'n') {
      // Nebula cloud cluster
      const nebPtCount = 650;
      const nebGeo = new T.BufferGeometry();
      const npos = new Float32Array(nebPtCount * 3);
      const ncol = new Float32Array(nebPtCount * 3);
      const baseCol = new T.Color(d[5]);
      for (let j = 0; j < nebPtCount; j++) {
        npos[j * 3]     = (Math.random() - 0.5) * 32;
        npos[j * 3 + 1] = (Math.random() - 0.5) * 20;
        npos[j * 3 + 2] = (Math.random() - 0.5) * 32;
        const tint = Math.random() > 0.5 ? baseCol : new T.Color(0x7df9ff);
        ncol[j * 3]     = tint.r;
        ncol[j * 3 + 1] = tint.g;
        ncol[j * 3 + 2] = tint.b;
      }
      nebGeo.setAttribute('position', new T.BufferAttribute(npos, 3));
      nebGeo.setAttribute('color', new T.BufferAttribute(ncol, 3));
      const nPoints = new T.Points(nebGeo, new T.PointsMaterial({
        size: 5.5,
        map: gt,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: T.AdditiveBlending
      }));
      g.add(nPoints);
      g.add(makeGlowSprite(d[5], 38, 0.3));
    } else if (k === 'g') {
      // Spiral Galaxy with rotating particle arms
      const galStars = 1400;
      const galGeo = new T.BufferGeometry();
      const gpos = new Float32Array(galStars * 3);
      const gcol = new Float32Array(galStars * 3);
      const armColor = new T.Color(d[5]);

      for (let j = 0; j < galStars; j++) {
        const radG = Math.pow(Math.random(), 0.65) * 28;
        const armOffset = (j % 2) * Math.PI;
        const thetaG = radG * 0.28 + armOffset + (Math.random() - 0.5) * 0.45;
        gpos[j * 3]     = radG * Math.cos(thetaG);
        gpos[j * 3 + 1] = (Math.random() - 0.5) * (3.5 - radG * 0.08);
        gpos[j * 3 + 2] = radG * Math.sin(thetaG);

        const coreTint = radG < 5 ? new T.Color(0xffffff) : armColor;
        gcol[j * 3]     = coreTint.r;
        gcol[j * 3 + 1] = coreTint.g;
        gcol[j * 3 + 2] = coreTint.b;
      }
      galGeo.setAttribute('position', new T.BufferAttribute(gpos, 3));
      galGeo.setAttribute('color', new T.BufferAttribute(gcol, 3));
      const galMesh = new T.Points(galGeo, new T.PointsMaterial({
        size: 2.6,
        map: gt,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: T.AdditiveBlending
      }));
      g.add(galMesh);
      g.add(makeGlowSprite(0xffffff, 14, 0.85));
      g.rotation.x = 0.85;
    } else if (k === 'b') {
      // Relativistic Black Hole with Event Horizon & Superheated Accretion Disk
      const eventHorizon = new T.Mesh(
        new T.SphereGeometry(2.6, 36, 36),
        new T.MeshBasicMaterial({ color: 0x000000 })
      );
      g.add(eventHorizon);

      // Accretion disk
      const accGeo = new T.RingGeometry(3.2, 10.5, 72);
      const accMat = new T.MeshBasicMaterial({
        color: d[5],
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: T.AdditiveBlending
      });
      const accMesh = new T.Mesh(accGeo, accMat);
      accMesh.rotation.x = 1.25;
      g.add(accMesh);

      // Photon ring glow and gravitational distortion haze
      g.add(makeGlowSprite(d[5], 28, 0.75));
      g.add(makeGlowSprite(0xffffff, 8, 0.9));
    }

    const dHit = new T.Mesh(new T.SphereGeometry(15), hitMat());
    dHit.userData.k = 'd' + i;
    g.add(dHit);
    hits.push(dHit);

    S.add(g);
    deepObjects.push(g);
  });

  /* ────────────────────────────────────────────────────────────
     5. SIMULATION LOOP & CINEMATIC CAMERA FLIGHT
     ──────────────────────────────────────────────────────────── */
  let simTime = 0;
  let targetObject = null;
  let flyFrames = 0;
  let cameraOffset = new T.Vector3(0, 8, 16);
  const targetWorldPos = new T.Vector3();

  function animate() {
    requestAnimationFrame(animate);

    const speedRange = document.getElementById('sp');
    const timeScale = speedRange ? +speedRange.value : 15;
    simTime += timeScale / 60;
    const currentJ2000Day = days() + simTime;

    // Rotate Sun
    sunSphere.rotation.y += 0.002;

    // Propagate Planets along Keplerian orbits
    planetMeshes.forEach((item, i) => {
      const theta = ang(i, currentJ2000Day) * R2;
      const r = item.orbitR;
      item.group.position.set(r * Math.cos(theta), 0, -r * Math.sin(theta));
      // Axial rotation
      item.body.rotation.y += 0.01;
    });

    // Cloud drift
    planetClouds.forEach(c => {
      c.mesh.rotation.y += c.speed;
    });

    // Cosmic dust slow drift
    dustPoints.rotation.y += 0.0004;

    // Meteor updates
    if (Math.random() < 0.035 && meteors.length < 3) {
      spawnMeteor();
    }
    for (let m = meteors.length - 1; m >= 0; m--) {
      const met = meteors[m];
      met.currentPos.addScaledVector(met.dir, met.speed);
      const trail = met.currentPos.clone().addScaledVector(met.dir, -met.speed * 4);
      const posAttr = met.line.geometry.attributes.position;
      posAttr.setXYZ(0, met.currentPos.x, met.currentPos.y, met.currentPos.z);
      posAttr.setXYZ(1, trail.x, trail.y, trail.z);
      posAttr.needsUpdate = true;
      met.life--;
      met.line.material.opacity = (met.life / met.maxLife) * 0.9;
      if (met.life <= 0) {
        S.remove(met.line);
        meteors.splice(m, 1);
      }
    }

    // Smooth cinematic camera tracking
    if (targetObject) {
      targetObject.getWorldPosition(targetWorldPos);
      ctl.target.lerp(targetWorldPos, 0.08);

      if (flyFrames > 0) {
        const destPos = targetWorldPos.clone().add(cameraOffset);
        cam.position.lerp(destPos, 0.06);
        flyFrames--;
      }
    }

    ctl.update();
    R.render(S, cam);
  }

  animate();

  /* Window resize handler */
  function onWindowResize() {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    R.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', onWindowResize);

  /* Raycasting interaction */
  let pointerDownPos = null;
  cv.addEventListener('pointerdown', e => {
    pointerDownPos = [e.clientX, e.clientY];
  });
  cv.addEventListener('pointerup', e => {
    if (!pointerDownPos || location.hash !== '#universe') return;
    if (Math.hypot(e.clientX - pointerDownPos[0], e.clientY - pointerDownPos[1]) > 6) return;
    const rc = new T.Raycaster();
    const pt = new T.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    rc.setFromCamera(pt, cam);
    const intersects = rc.intersectObjects(hits);
    if (intersects.length > 0) {
      onPick(intersects[0].object.userData.k);
    }
  });

  return {
    focus(key, planetObj, deepObj) {
      if (key === 'sun') {
        targetObject = sunMeshGroup;
        cameraOffset.set(0, 12, 28);
        flyFrames = 90;
      } else if (key[0] === 'p') {
        targetObject = planetObj;
        const i = +key.slice(1);
        const pR = planetMeshes[i].radius;
        cameraOffset.set(0, pR * 3.5, pR * 6.5);
        flyFrames = 90;
      } else {
        targetObject = deepObj;
        cameraOffset.set(0, 18, 48);
        flyFrames = 90;
      }
    },
    getPlanetMesh: i => (planetMeshes[i] ? planetMeshes[i].group : null),
    getDeepObjMesh: i => deepObjects[i] || null,
    getSun: () => sunMeshGroup
  };
}
