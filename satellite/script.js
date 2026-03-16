import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── satellite.js SGP4 (no backend needed) ───────────────────────────────────
// Loaded via importmap in index.html as 'satellite'
import * as satellite from 'satellite';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 7);

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
const SCALE = 40;
const COLORS = [0xff4444, 0x00ff88, 0x4488ff, 0xffcc00];

// Satellites to track — NORAD IDs + display names
const SAT_IDS = [
  { id: '25544', name: 'ISS' },
  { id: '20580', name: 'Hubble' },
  { id: '33591', name: 'NOAA 19' },
  { id: '25994', name: 'Terra' },
];

const satRecords = {};   // name → satrec object
const satMeshes  = {};   // name → THREE.Mesh
const satTrails  = {};   // name → { points, geom, line }
const satLabels  = {};   // name → DOM div

const labelContainer = document.getElementById('labels');
const toggleContainer = document.getElementById('sat-toggles');

// Status message while loading
const statusEl = document.createElement('div');
statusEl.style.cssText = 'color:#aaa;font-size:12px;margin-top:8px;';
statusEl.textContent = 'Loading TLE data…';
toggleContainer.parentElement.appendChild(statusEl);

// ─── Fetch TLE directly from CelesTrak (no CORS issues) ──────────────────────
async function fetchTLEs() {
  const results = [];

  for (const { id, name } of SAT_IDS) {
    try {
      // CelesTrak GP API returns TLE text for a single satellite by NORAD ID
      const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`;
      const res  = await fetch(url);
      const text = await res.text();
      const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);

      if (lines.length >= 3) {
        // lines[0] = name line, lines[1] = TLE line 1, lines[2] = TLE line 2
        const satrec = satellite.twoline2satrec(lines[1], lines[2]);
        results.push({ name, satrec });
      } else if (lines.length === 2) {
        // Some responses omit the name line
        const satrec = satellite.twoline2satrec(lines[0], lines[1]);
        results.push({ name, satrec });
      }
    } catch (e) {
      console.warn(`Could not fetch TLE for ${name}:`, e);
    }
  }

  return results;
}

// ─── Convert lat/lon/alt → Three.js XYZ ──────────────────────────────────────
function latLonAltToXYZ(lat, lon, alt) {
  const r   = 1 + (alt / 6371) * SCALE;
  const phi = (90 - lat) * Math.PI / 180;
  const tht = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(tht),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(tht)
  );
}

// ─── Propagate all satellites to current time ─────────────────────────────────
function propagateAll() {
  const now         = new Date();
  const gmst        = satellite.gstime(now);

  for (const [name, satrec] of Object.entries(satRecords)) {
    try {
      const posVel = satellite.propagate(satrec, now);
      if (!posVel.position) continue;

      const geo = satellite.eciToGeodetic(posVel.position, gmst);
      const lat  = satellite.degreesLat(geo.latitude);
      const lon  = satellite.degreesLong(geo.longitude);
      const alt  = geo.height;   // km above ellipsoid

      const pos = latLonAltToXYZ(lat, lon, alt);
      satMeshes[name].position.copy(pos);

      // Trail
      const trail = satTrails[name];
      trail.points.push(pos.clone());
      if (trail.points.length > 300) trail.points.shift();
      trail.geom.setFromPoints(trail.points);

      // Label
      satLabels[name].innerHTML =
        `<strong>${name}</strong><br>` +
        `Lat: ${lat.toFixed(2)}°<br>` +
        `Lon: ${lon.toFixed(2)}°<br>` +
        `Alt: ${alt.toFixed(1)} km`;

    } catch (e) { /* skip bad propagation frame */ }
  }
}

// ─── Create scene objects for each satellite ──────────────────────────────────
function createSatelliteObjects(tleList) {
  tleList.forEach(({ name, satrec }, i) => {
    satRecords[name] = satrec;
    const color = COLORS[i % COLORS.length];

    // Mesh
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    scene.add(mesh);
    satMeshes[name] = mesh;

    // Trail
    const geom = new THREE.BufferGeometry();
    const line = new THREE.Line(geom, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.6
    }));
    scene.add(line);
    satTrails[name] = { points: [], geom, line };

    // HTML label
    const label = document.createElement('div');
    label.className = 'sat-label';
    labelContainer.appendChild(label);
    satLabels[name] = label;

    // Toggle button
    const btn = document.createElement('button');
    btn.innerText = name;
    btn.style.borderLeft = `3px solid #${color.toString(16).padStart(6, '0')}`;
    btn.onclick = () => {
      const v = !mesh.visible;
      mesh.visible  = v;
      line.visible  = v;
      label.style.display = v ? 'block' : 'none';
      btn.style.opacity = v ? '1' : '0.4';
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
    if (!mesh.visible) continue;

    const v = mesh.position.clone().project(camera);
    label.style.left = `${(v.x *  0.5 + 0.5) * window.innerWidth  + 8}px`;
    label.style.top  = `${(v.y * -0.5 + 0.5) * window.innerHeight    }px`;
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
  setInterval(propagateAll, 1000);   // update positions every second
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
