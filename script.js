// === Scene setup ===
const scene = new THREE.Scene();

// === Stars background setup ===
const starGeometry = new THREE.BufferGeometry();
const starCount = 200;
const starVertices = [];
for (let i = 0; i < starCount; i++) {
  let x, y, z, safe = false;
  while (!safe) {
    x = THREE.MathUtils.randFloatSpread(400);
    y = THREE.MathUtils.randFloatSpread(400);
    z = THREE.MathUtils.randFloatSpread(400);
    if (Math.sqrt(x * x + y * y + z * z) > 40) safe = true;
  }
  starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff })));

// === Camera Setup ===
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const defaultCameraPosition = new THREE.Vector3(0, 10, 30);
camera.position.copy(defaultCameraPosition);
camera.lookAt(0, 0, 0);

// === Renderer Setup ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Raycaster and pointer vector for interaction ===
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// === Planet Data ===
const planetData = [
  { name: 'Mercury', size: 0.3, distance: 4, color: 0xaaaaaa, info: "Mercury is the smallest planet, closest to the Sun." },
  { name: 'Venus', size: 0.5, distance: 6, color: 0xffcc66, info: "Venus has a thick toxic atmosphere and intense heat." },
  { name: 'Earth', size: 0.6, distance: 8, color: 0x3399ff, info: "Earth supports life with water and a breathable atmosphere." },
  { name: 'Mars', size: 0.4, distance: 10, color: 0xff3300, info: "Mars is a red desert world with frozen poles." },
  { name: 'Jupiter', size: 1.1, distance: 13, color: 0xff9966, info: "Jupiter is the largest gas giant with a huge storm." },
  { name: 'Saturn', size: 0.9, distance: 16, color: 0xffcc99, info: "Saturn is famous for its spectacular ring system." },
  { name: 'Uranus', size: 0.7, distance: 19, color: 0x66ffff, info: "Uranus rotates sideways and is icy cold." },
  { name: 'Neptune', size: 0.7, distance: 22, color: 0x3366ff, info: "Neptune has supersonic winds and dark storms." }
];

const planets = [], labels = [], orbitSpeeds = [], rotations = [], sliders = [];
let zoomedPlanet = null;
const selectedPlanetLabel = document.getElementById('selectedPlanetLabel');
const infoBox = document.getElementById('infoBox');

// === Create planets and their controls dynamically ===
planetData.forEach((data, index) => {
  const geometry = new THREE.SphereGeometry(data.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: data.color });
  const planet = new THREE.Mesh(geometry, material);
  planet.userData = { distance: data.distance, name: data.name, info: data.info, originalScale: data.size };
  scene.add(planet);
  planets.push(planet);
  orbitSpeeds.push(1);
  rotations.push(0.01 + Math.random() * 0.01);

  if (['Saturn', 'Uranus', 'Neptune'].includes(data.name)) {
    const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 1.7, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: data.name === 'Saturn' ? 0xdeb887 : 0xcccccc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: data.name === 'Saturn' ? 0.7 : 0.3
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);
  }

  const label = document.createElement('label');
  label.textContent = `${data.name} Speed:`;
  label.dataset.planetName = data.name;
  label.style.cursor = 'pointer'; // Better touch indication
  
  // Combined click/touch handler
  const handlePlanetSelect = () => {
    if (zoomedPlanet === planet) {
      zoomedPlanet = null;
      selectedPlanetLabel.style.display = 'none';
      infoBox.style.display = 'none';
      camera.position.copy(defaultCameraPosition);
      camera.lookAt(0, 0, 0);
      document.querySelectorAll('#controls label').forEach(l => l.classList.remove('highlighted'));
    } else {
      zoomedPlanet = planet;
      selectedPlanetLabel.innerText = data.name;
      selectedPlanetLabel.style.display = 'block';
      infoBox.innerText = data.info;
      infoBox.style.display = 'block';
      document.querySelectorAll('#controls label').forEach(l => {
        l.classList.remove('highlighted');
        if (l.dataset.planetName === data.name) l.classList.add('highlighted');
      });
    }
  };
  
  label.addEventListener('click', handlePlanetSelect);
  label.addEventListener('touchend', handlePlanetSelect);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0.1';
  input.max = '2';
  input.step = '0.1';
  input.value = '1';
  input.style.width = '100%'; // Better mobile sizing
  input.addEventListener('input', () => {
    orbitSpeeds[index] = parseFloat(input.value);
  });
  sliders.push(input);

  const wrapper = document.createElement('div');
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  document.getElementById('controls').appendChild(wrapper);

  const nameTag = document.createElement('div');
  nameTag.className = 'planetLabel';
  nameTag.innerText = data.name;
  document.body.appendChild(nameTag);
  labels.push(nameTag);
});

// === Add the Sun ===
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2, 64, 64),
  new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load('https://raw.githubusercontent.com/rajatkantinandi/solar-system-threejs/main/assets/textures/sun.jpg'),
    emissive: 0xffaa00,
    emissiveIntensity: 1.5,
    roughness: 0.7,
    metalness: 0.2
  })
);
scene.add(sun);

// === Light source ===
const light = new THREE.PointLight(0xffffff, 2, 100);
scene.add(light);

// === Pause and Resume ===
let isPaused = false;
const togglePause = () => {
  isPaused = !isPaused;
  document.getElementById('toggleButton').innerText = isPaused ? 'Resume' : 'Pause';
};
document.getElementById('toggleButton').addEventListener('click', togglePause);
document.getElementById('toggleButton').addEventListener('touchend', togglePause);

// === Dark/Light Theme ===
const toggleTheme = () => {
  document.body.classList.toggle('light-mode');
};
document.getElementById('themeButton').addEventListener('click', toggleTheme);
document.getElementById('themeButton').addEventListener('touchend', toggleTheme);

// === Reset Speeds ===
const resetSpeeds = () => {
  orbitSpeeds.forEach((_, i) => {
    orbitSpeeds[i] = 1;
    sliders[i].value = '1';
  });
};
document.getElementById('resetSpeedsButton').addEventListener('click', resetSpeeds);
document.getElementById('resetSpeedsButton').addEventListener('touchend', resetSpeeds);

const clock = new THREE.Clock();

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    const elapsed = clock.getElapsedTime();
    planets.forEach((planet, i) => {
      const d = planet.userData.distance;
      const angle = elapsed * orbitSpeeds[i];
      planet.position.set(Math.cos(angle + i) * d, 0, Math.sin(angle + i) * d);
      planet.rotation.y += rotations[i];
    });
    sun.rotation.y += 0.001;

    if (zoomedPlanet) {
      const target = zoomedPlanet.position.clone();
      camera.position.lerp(target.clone().add(new THREE.Vector3(0, 1, 3)), 0.05);
      camera.lookAt(target);
      const vector = target.project(camera);
      selectedPlanetLabel.style.left = (vector.x * 0.5 + 0.5) * window.innerWidth + 'px';
      selectedPlanetLabel.style.top = (-vector.y * 0.5 + 0.5) * window.innerHeight + 'px';
    }
  }

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(planets);
  planets.forEach((p, i) => {
    p.scale.setScalar(p.userData.originalScale);
    labels[i].style.display = 'none';
  });
  if (intersects.length > 0) {
    const p = intersects[0].object;
    const i = planets.indexOf(p);
    p.scale.setScalar(p.userData.originalScale * 1.5);
    const v = p.position.clone().project(camera);
    labels[i].style.display = 'block';
    labels[i].style.left = (v.x * 0.5 + 0.5) * window.innerWidth + 'px';
    labels[i].style.top = (-v.y * 0.5 + 0.5) * window.innerHeight - 60 + 'px';
  }

  renderer.render(scene, camera);
}
animate();

// === Pointer Movement (Mouse + Touch) ===
function updatePointerPosition(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = e.clientX || e.touches?.[0]?.clientX;
  const clientY = e.clientY || e.touches?.[0]?.clientY;
  
  if (clientX && clientY) {
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }
}

window.addEventListener('mousemove', updatePointerPosition);
window.addEventListener('touchmove', updatePointerPosition);
window.addEventListener('touchstart', updatePointerPosition);

// === Window Resize ===
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize); // For mobile rotation

