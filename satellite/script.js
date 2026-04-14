import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as satellite from 'satellite';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// FIX 3: Camera pulled back to z=4 to match the reduced SCALE
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ─── Earth ────────────────────────────────────────────────────────────────────
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load(
      'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
    )
  })
);
scene.add(earth);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(5, 3, 5);
scene.add(sun);

// ─── Satellite setup ──────────────────────────────────────────────────────────
// FIX 1: SCALE reduced from 40 → 5 so satellites orbit just outside Earth sphere
// With Earth radius = 1 and SCALE = 5:
//   ISS at 408 km  → r ≈ 1.32  (visible ring around Earth)
//   Hubble at 547km → r ≈ 1.43
//   NOAA at 870km  → r ≈ 1.68
const SCALE = 5;

const COLORS = [0xff4444, 0x00ff88, 0x4488ff, 0xffcc00];

const SAT_IDS = [
  { id: '25544', name: 'ISS' },
  { id: '20580', name: 'Hubble' },
  { id: '33591', name: 'NOAA 19' },
  { id: '25994', name: 'Terra' },
];

const satRecords = {};
const satMeshes  = {};
const satTrails  = {};
const satLabels  = {};

const labelContainer  = document.getElementById('labels');
const toggleContainer = document.getElementById('sat-toggles');

const statusEl = document.createElement('div');
statusEl.style.cssText = 'color:#aaa;font-size:12px;margin-top:8px;';
statusEl.textContent = 'Loading TLE data…';
toggleContainer.parentElement.appendChild(statusEl);

// ─── Fetch TLE data ───────────────────────────────────────────────────────────
async function fetchTLEs() {
  const results = [];
  for (const { id, name } of SAT_IDS) {
    try {
      const url  = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`;
      const res  = await fetch(url);
      const text = await res.text();
      const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);

      if (lines.length >= 3) {
        const satrec = satellite.twoline2satrec(lines[1], lines[2]);
        results.push({ name, satrec });
      } else if (lines.length === 2) {
        const satrec = satellite.twoline2satrec(lines[0], lines[1]);
        results.push({ name, satrec });
      }
    } catch (e) {
      console.warn(`Could not fetch TLE for ${name}:`, e);
    }
  }
  return results;
}

// ─── Convert geodetic coords → Three.js XYZ ──────────────────────────────────
function latLonAltToXYZ(lat, lon, alt) {
  // alt is in km; Earth radius 6371 km; scene Earth radius = 1 unit
  const r   = 1 + (alt / 6371) * SCALE;
  const phi = (90 - lat) * Math.PI / 180;
  const tht = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(tht),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(tht)
  );
}

// ─── Propagate all satellites ─────────────────────────────────────────────────
function propagateAll() {
  const now  = new Date();
  const gmst = satellite.gstime(now);

  for (const [name, satrec] of Object.entries(satRecords)) {
    try {
      const posVel = satellite.propagate(satrec, now);
      if (!posVel.position) continue;

      const geo = satellite.eciToGeodetic(posVel.position, gmst);
      const lat  = satellite.degreesLat(geo.latitude);
      const lon  = satellite.degreesLong(geo.longitude);
      const alt  = geo.height;

      const pos = latLonAltToXYZ(lat, lon, alt);
      satMeshes[name].position.copy(pos);

      // Trail
      const trail = satTrails[name];
      trail.points.push(pos.clone());
      if (trail.points.length > 300) trail.points.shift();
      trail.geom.setFromPoints(trail.points);

      // FIX 2: Update label text AND make it visible after first data arrives
      const label = satLabels[name];
      label.innerHTML =
        `<strong>${name}</strong><br>` +
        `Lat: ${lat.toFixed(2)}°<br>` +
        `Lon: ${lon.toFixed(2)}°<br>` +
        `Alt: ${alt.toFixed(1)} km`;

      // Show label only once real data has been populated
      if (label.style.display === 'none') {
        label.style.display = 'block';
      }

    } catch (e) { /* skip bad propagation frame */ }
  }
}

// ─── Create scene objects ─────────────────────────────────────────────────────
function createSatelliteObjects(tleList) {
  tleList.forEach(({ name, satrec }, i) => {
    satRecords[name] = satrec;
    const color = COLORS[i % COLORS.length];

    // Satellite dot mesh
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    scene.add(mesh);
    satMeshes[name] = mesh;

    // Orbital trail
    const geom = new THREE.BufferGeometry();
    const line  = new THREE.Line(geom, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.6
    }));
    scene.add(line);
    satTrails[name] = { points: [], geom, line };

    // FIX 2: Label starts hidden — shown only after propagateAll populates data
    const label = document.createElement('div');
    label.className = 'sat-label';
    label.style.display = 'none';
    labelContainer.appendChild(label);
    satLabels[name] = label;

    // Toggle button
    const colorHex = '#' + color.toString(16).padStart(6, '0');
    const btn = document.createElement('button');
    btn.innerText = name;
    btn.style.borderLeft = `3px solid ${colorHex}`;
    btn.onclick = () => {
      const v = !mesh.visible;
      mesh.visible       = v;
      line.visible       = v;
      label.style.display = v ? 'block' : 'none';
      btn.style.opacity   = v ? '1' : '0.4';
    };
    toggleContainer.appendChild(btn);
  });

  statusEl.textContent = `Tracking ${tleList.length} satellite${tleList.length !== 1 ? 's' : ''} live`;
}

// ─── Project 3D → screen coords for labels ───────────────────────────────────
function updateLabelPositions() {
  for (const name in satMeshes) {
    const mesh  = satMeshes[name];
    const label = satLabels[name];

    // Skip if hidden or not yet shown
    if (!mesh.visible || label.style.display === 'none') continue;

    const v = mesh.position.clone().project(camera);

    // Clamp so labels never go off-screen edges
    const x = Math.max(4, Math.min(window.innerWidth  - 140, (v.x *  0.5 + 0.5) * window.innerWidth  + 8));
    const y = Math.max(4, Math.min(window.innerHeight - 80,  (v.y * -0.5 + 0.5) * window.innerHeight));

    label.style.left = x + 'px';
    label.style.top  = y + 'px';
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
fetchTLEs().then(tleList => {
  if (tleList.length === 0) {
    statusEl.textContent = 'Could not load TLE data. Check network.';
    return;
  }
  createSatelliteObjects(tleList);
  propagateAll();
  setInterval(propagateAll, 1000);
});

// ─── Render loop ──────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0005;
  controls.update();
  updateLabelPositions();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
