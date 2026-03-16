import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

// --------------------
// Earth
// --------------------
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load(
      'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
    )
  })
);
scene.add(earth);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(5, 3, 5);
scene.add(sun);

// --------------------
// Satellite system
// --------------------
const SCALE = 40;
const satellites = {};
const trails = {};
const labels = {};

const COLORS = [0xff4444, 0x00ff88, 0x4488ff, 0xffcc00];

const labelContainer = document.getElementById("labels");

function latLonAltToXYZ(lat, lon, alt) {
  const r = 1 + (alt / 6371) * SCALE;
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

async function fetchTelemetry() {
  const r = await fetch("http://127.0.0.1:8000/telemetry");
  return await r.json();
}

async function update() {
  const data = await fetchTelemetry();

  data.forEach((sat, i) => {
    const { name, latitude, longitude, altitude } = sat;
    const pos = latLonAltToXYZ(latitude, longitude, altitude);

    if (!satellites[name]) {
      const color = COLORS[i % COLORS.length];

      // Satellite mesh
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 16, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      scene.add(mesh);
      satellites[name] = mesh;

      // Orbit trail
      const geom = new THREE.BufferGeometry();
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6
      });
      const line = new THREE.Line(geom, mat);
      scene.add(line);

      trails[name] = { points: [], geom };

      // HTML label
      const label = document.createElement("div");
      label.className = "sat-label";
      labelContainer.appendChild(label);
      labels[name] = label;

      // Toggle button
      const btn = document.createElement("button");
      btn.innerText = name;
      btn.onclick = () => {
        const visible = !mesh.visible;
        mesh.visible = visible;
        line.visible = visible;
        label.style.display = visible ? "block" : "none";
      };
      document.getElementById("sat-toggles").appendChild(btn);
    }

    satellites[name].position.copy(pos);

    // Trail update
    const trail = trails[name];
    trail.points.push(pos.clone());
    if (trail.points.length > 300) trail.points.shift();
    trail.geom.setFromPoints(trail.points);

    // Update label content
    labels[name].innerHTML = `
      <strong>${name}</strong><br>
      Lat: ${latitude.toFixed(2)}°<br>
      Lon: ${longitude.toFixed(2)}°<br>
      Alt: ${altitude.toFixed(1)} km
    `;
  });
}

// Convert 3D → screen position
function updateLabels() {
  for (const name in satellites) {
    const mesh = satellites[name];
    const label = labels[name];

    if (!mesh.visible) continue;

    const vector = mesh.position.clone();
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    label.style.left = `${x + 8}px`;
    label.style.top = `${y}px`;
  }
}

setInterval(update, 1000);
update();

function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0005;
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
