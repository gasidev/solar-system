import * as THREE from "three";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, //fov
  window.innerWidth / window.innerHeight, //aspect ratio
  0.1, //near
  20000, //far
);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0x000000);

camera.position.z = 1000;
camera.position.y = 200;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

//CSS2DRenderer setup
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.pointerEvents = "none";
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.left = "0";
document.body.appendChild(labelRenderer.domElement);

//planets data
const planets = [
  {
    name: "Sun",
    radius: 100,
    diameter: "1,391,400",
    color: 0xffd700,
    position: { x: 0, y: 0, z: 0 },
    rotationSpeed: 0.001,
  },
  {
    name: "Mercury",
    radius: 4,
    diameter: "4,900",
    color: 0x504e51,
    position: { x: 150, y: 0, z: 0 },
    rotationSpeed: 0.02,
    orbitSpeed: 0.00479,
    orbitComplete: "88 days",
  },
  {
    name: "Venus",
    radius: 9,
    diameter: "12,100",
    color: 0xffc649,
    position: { x: 208, y: 0, z: 0 },
    rotationSpeed: 0.01,
    orbitSpeed: 0.0035,
    orbitComplete: "225 days",
  },
  {
    name: "Earth",
    radius: 10,
    diameter: "12,800",
    color: 0x9fc164,
    position: { x: 258, y: 0, z: 0 },
    rotationSpeed: 0.01,
    orbitSpeed: 0.00298,
    orbitComplete: "365 days",
  },
  {
    name: "Mars",
    radius: 5,
    diameter: "6,800",
    color: 0xfda600,
    position: { x: 335, y: 0, z: 0 },
    rotationSpeed: 0.01,
    orbitSpeed: 0.0024,
    orbitComplete: "688 days",
  },
  {
    name: "Jupiter",
    radius: 50,
    diameter: "143,000",
    color: 0xd8ca9d,
    position: { x: 858, y: 0, z: 0 },
    rotationSpeed: 0.01,
    orbitSpeed: 0.00131,
    orbitComplete: "11.8 years",
  },
  {
    name: "Saturn",
    radius: 30,
    diameter: "120,500",
    color: 0x343e47,
    position: { x: 1542, y: 0, z: 0 },
    rotationSpeed: 0.01,
    orbitSpeed: 0.000969,
    orbitComplete: "29.5 years",
    ring: {
      innerRadius: 40,
      outerRadius: 50,
      color: 0xcccccc,
      rotation: 1.7,
    },
  },
  {
    name: "Uranus",
    radius: 20,
    diameter: "51,100",
    color: 0xd9ddf4,
    position: { x: 3000, y: 0, z: 0 },
    rotationSpeed: 0.01,
    orbitSpeed: 0.000681,
    orbitComplete: "84 years",
    ring: {
      innerRadius: 40,
      outerRadius: 45,
      color: 0xcccccc,
      rotation: -6,
    },
  },
  {
    name: "Neptune",
    radius: 19,
    diameter: "49,500",
    color: 0x5b5ddf,
    position: { x: 4500, y: 0, z: 0 },
    rotationSpeed: 0.01,
    orbitSpeed: 0.000543,
    orbitComplete: "164.8 years",
  },
];

//creates the planets
planets.forEach((planet) => {
  const geometry = new THREE.SphereGeometry(planet.radius, 32, 16);
  const material = new THREE.MeshBasicMaterial({ color: planet.color });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(planet.position.x, planet.position.y, planet.position.z);

  planet.mesh = mesh;

  scene.add(mesh);

  //creates orbits
  if (planet.name !== "Sun") {
    const orbit = createOrbit(planet.position.x);
    scene.add(orbit);
  }

  //creates rings if planets have them
  if (planet.ring) {
    const ringGeometry = new THREE.RingGeometry(
      planet.ring.innerRadius,
      planet.ring.outerRadius,
      64,
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: planet.ring.color,
      side: THREE.DoubleSide, //makes sure it can be seen from both sides
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    //setting position of ring
    ring.position.set(planet.position.x, planet.position.y, planet.position.z);

    ring.rotation.x = Math.PI / planet.ring.rotation;

    planet.ring = ring;

    scene.add(ring);
  }

  //creates text for planets
  const labelDiv = document.createElement("div");
  labelDiv.className = "label";
  labelDiv.textContent = planet.name;
  labelDiv.style.color = "white";
  labelDiv.style.backgroundColor = "rgba(0,0,0,0.5)";
  labelDiv.style.padding = "5px";
  labelDiv.style.borderRadius = "5px";

  const label = new CSS2DObject(labelDiv);
  label.position.set(0, planet.radius + 20, 0); //above planet
  mesh.add(label); //attach label tothe planet
});

const controls = new OrbitControls(camera, renderer.domElement); //easily set camera controls
controls.enableDamping = true;

//calculates mouse position in device coordinates
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const infoPanel = document.getElementById("info-panel");

//when a planet is clicked event
window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map((p) => p.mesh));

  if (intersects.length > 0) {
    const clickedPlanet = intersects[0].object;
    const planetData = planets.find((p) => p.mesh === clickedPlanet);

    //update and display info panel
    infoPanel.innerHTML = `<h3>${planetData.name}</h3>
                           <p>Radius: ${planetData.radius}</p>
                           <p>Orbit Completion Speed: ${planetData.orbitComplete || "N/A"}</p>
                           <p>Diameter: ${planetData.diameter}</p>`;
    infoPanel.style.display = "block";
  }
});

//responsive canvas
window.addEventListener("resize", () => {
  //update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  //update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

planets.forEach((planet) => {
  if (planet.name !== "Sun") {
    planet.orbitRadius = Math.sqrt(
      planet.position.x ** 2 + planet.position.y ** 2,
    );
    planet.orbitAngle = 0;
  }
});

//creating orbit for the planets
function createOrbit(radius) {
  const points = [];
  const segments = 100;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  return new THREE.Line(geometry, material);
}

function animate() {
  requestAnimationFrame(animate);

  planets.forEach((planet) => {
    if (planet.name !== "Sun") {
      planet.orbitAngle += planet.orbitSpeed; //update orbit angle
      planet.mesh.position.x = planet.orbitRadius * Math.cos(planet.orbitAngle);
      planet.mesh.position.z = planet.orbitRadius * Math.sin(planet.orbitAngle);
    }

    if (planet.ring) {
      planet.ring.position.copy(planet.mesh.position);
      planet.ring.rotation.y += planet.rotationSpeed;
    }
  });

  controls.update();
  labelRenderer.render(scene, camera);
  renderer.render(scene, camera);
}

animate();
