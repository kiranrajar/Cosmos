/* ============================================================
   universe.js — Three.js 3-D scene (ES module)
   ============================================================ */
import { P, D, days, ang, kind, R2 } from './data.js';

const T = THREE;

export function initUniverse({ onPick }) {
  const cv = document.getElementById('c');
  const R  = new T.WebGLRenderer({ canvas: cv, antialias: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 2));

  const S   = new T.Scene();
  const cam = new T.PerspectiveCamera(55, 1, .1, 5000);
  cam.position.set(0, 70, 120);

  const ctl = new T.OrbitControls(cam, cv);
  ctl.enableDamping  = true;
  ctl.maxDistance    = 1500;

  /* Glow sprite texture */
  const gt = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0,   '#fff');
    r.addColorStop(.35, 'rgba(255,255,255,.45)');
    r.addColorStop(1,   'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();

  const gs  = () => Math.random() + Math.random() + Math.random() - 1.5;

  function pts(n, fn, cols, size) {
    const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = fn(i); p.set(v, i * 3);
      const k = new T.Color(cols[i % cols.length]); c.set([k.r, k.g, k.b], i * 3);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    g.setAttribute('color',    new T.BufferAttribute(c, 3));
    return new T.Points(g, new T.PointsMaterial({
      size, map: gt, vertexColors: true,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    }));
  }

  function glow(col, s) {
    const m = new T.Sprite(new T.SpriteMaterial({
      map: gt, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    }));
    m.scale.set(s, s, 1);
    return m;
  }

  /* Background stars */
  S.add(pts(3500,
    () => {
      const r = 500 + Math.random() * 900;
      const a = Math.random() * 6.283;
      const b = Math.acos(2 * Math.random() - 1);
      return [r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)];
    },
    [0xffffff, 0xaaccff, 0xffddaa], 3));

  const hits = [], pm = [];
  const hm   = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  /* Sun */
  const sun = new T.Mesh(new T.SphereGeometry(4.5, 32, 32),
                         new T.MeshBasicMaterial({ color: 0xffcc55 }));
  sun.add(glow(0xffaa33, 22));
  S.add(sun);
  const hs = new T.Mesh(new T.SphereGeometry(7), hm());
  hs.userData.k = 'sun'; sun.add(hs); hits.push(hs);

  /* Planets */
  P.forEach((p, i) => {
    const r  = 10 * Math.sqrt(p[1]);
    const sz = .45 + .9 * Math.pow(p[4] / 6371, .4);
    const m  = new T.Mesh(new T.SphereGeometry(sz, 24, 24),
                           new T.MeshBasicMaterial({ color: p[8] }));
    const h  = new T.Mesh(new T.SphereGeometry(sz * 1.8 + .6), hm());
    h.userData.k = 'p' + i; m.add(h); hits.push(h);

    /* Saturn rings */
    if (i === 5) {
      const rg = new T.Mesh(
        new T.RingGeometry(sz * 1.3, sz * 2.3, 48),
        new T.MeshBasicMaterial({ color: 0xd9c28a, side: 2, transparent: true, opacity: .7 }),
      );
      rg.rotation.x = 1.35; m.add(rg);
    }
    S.add(m); pm.push(m);

    /* Orbit ring */
    const o = [];
    for (let k = 0; k <= 128; k++)
      o.push(new T.Vector3(r * Math.cos(k / 128 * 6.283), 0, r * Math.sin(k / 128 * 6.283)));
    S.add(new T.Line(new T.BufferGeometry().setFromPoints(o),
                     new T.LineBasicMaterial({ color: 0x4455aa, transparent: true, opacity: .35 })));
  });

  /* Deep-space objects */
  const dobj = [];
  D.forEach((d, i) => {
    const k = kind(d);
    const g = new T.Group();
    const a = i * 2.399;
    const r = 150 + 24 * Math.log10(d[3] + 1);
    g.position.set(r * Math.cos(a), 60 * Math.sin(i * 1.7), r * Math.sin(a));

    if (k === 's') g.add(glow(d[5], 16));
    if (k === 'n') g.add(pts(500, () => [gs() * 14, gs() * 9, gs() * 14],
                             [d[5], 0xffffff, 0x6644ff], 5));
    if (k === 'g') {
      g.add(pts(900, i2 => {
        const r2 = Math.pow(Math.random(), .7) * 20;
        const t  = r2 * .32 + (i2 % 2) * 3.14 + gs() * .35;
        return [r2 * Math.cos(t), gs() * 1.2, r2 * Math.sin(t)];
      }, [d[5], 0xffffff, 0xaabbff], 2.2));
      g.add(glow(d[5], 9));
      g.rotation.x = .8;
    }
    if (k === 'b') {
      g.add(new T.Mesh(new T.SphereGeometry(2.2, 24, 24),
                        new T.MeshBasicMaterial({ color: 0 })));
      const dk = new T.Mesh(new T.RingGeometry(3, 8, 64),
                             new T.MeshBasicMaterial({ color: d[5], side: 2, transparent: true, opacity: .75 }));
      dk.rotation.x = 1.2; g.add(dk);
      g.add(glow(d[5], 20));
    }
    const h = new T.Mesh(new T.SphereGeometry(13), hm());
    h.userData.k = 'd' + i; g.add(h); hits.push(h);
    S.add(g); dobj.push(g);
  });

  let sim = 0, sel = null, fly = 0;
  const off = new T.Vector3(), v3 = new T.Vector3();

  /* Animation loop */
  (function loop() {
    requestAnimationFrame(loop);
    const sp = +document.getElementById('sp').value;
    sim += sp / 60;
    const d = days() + sim;
    P.forEach((p, i) => {
      const a = ang(i, d) * R2;
      const r = 10 * Math.sqrt(p[1]);
      pm[i].position.set(r * Math.cos(a), 0, -r * Math.sin(a));
    });
    if (sel) {
      sel.getWorldPosition(v3);
      ctl.target.lerp(v3, .12);
      if (fly > 0) { cam.position.lerp(v3.clone().add(off), .07); fly--; }
    }
    ctl.update();
    R.render(S, cam);
  })();

  /* Resize */
  function size() {
    R.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  /* Click raycasting */
  let dn = null;
  cv.addEventListener('pointerdown', e => { dn = [e.clientX, e.clientY]; });
  cv.addEventListener('pointerup',   e => {
    if (!dn || location.hash !== '#universe') return;
    if (Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) > 5) return;
    const rc = new T.Raycaster();
    const pt = new T.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
    rc.setFromCamera(pt, cam);
    const x = rc.intersectObjects(hits)[0];
    if (x) onPick(x.object.userData.k);
  });

  return {
    focus(k, planet, deepObj) {
      if (k === 'sun')        { sel = sun;       off.set(0, 10, 20); }
      else if (k[0] === 'p')  { sel = planet;    off.set(0,  5, 10); fly = 100; }
      else                    { sel = deepObj;   off.set(0, 12, 34); fly = 100; }
    },
    getPlanetMesh:   i => pm[i],
    getDeepObjMesh:  i => dobj[i],
    getSun:          () => sun,
  };
}

