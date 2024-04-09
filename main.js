import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, canvas, scene, renderer;
let mesh, mesh1;

init();
animate();

async function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;

  const material = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.matrixAutoUpdate = false; // important we have to set this to false because we'll update the position when we track an image
  mesh.visible = false;
  scene.add(mesh);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  const img = document.getElementById('imgMarkerHiro');
  const imgBitmap = await createImageBitmap(img);
  console.log(imgBitmap);

  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["image-tracking"],
    trackedImages: [
      {
        image: imgBitmap,
        widthInMeters: 0.7
      }
    ],
    optionalFeatures: ["dom-overlay", "dom-overlay-for-handheld-ar"],
    domOverlay: {
      root: document.body
    }
  });
  document.body.appendChild(button);
  button.addEventListener('click', addButton);
  window.addEventListener("resize", onWindowResize, false);
}

function addButton() {
  // Create a new button
  const newButton = document.createElement('button');
  newButton.textContent = 'New Button';
  newButton.style.position = 'absolute';
  newButton.style.top = '20px';
  newButton.style.left = '20px';
  document.body.appendChild(newButton);

  newButton.addEventListener('click', () => {
    captureMarkerPosition();
  });
}

function captureMarkerPosition() {
  if (mesh) {
    const markerPosition = mesh.position.clone(); // Capture the position of the marker
    addBoxAtMarkerPosition(markerPosition); // Add a box mesh at the captured position
  }
}

function addBoxAtMarkerPosition(position) {
  const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const boxMaterial = new THREE.MeshNormalMaterial();
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.position.copy(position); // Set the position of the box mesh to the captured marker position
  scene.add(boxMesh);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function animate() {
  if (renderer) {
    renderer.setAnimationLoop(render);
  } else {
    console.log("no renderer");
  }
}

function render(timestamp, frame) {
  if (frame) {
    const results = frame.getImageTrackingResults();
    const referenceSpace = renderer.xr.getReferenceSpace();
    const viewerPose = frame.getViewerPose(referenceSpace);
    console.log(viewerPose);
    for (const result of results) {
      const imageIndex = result.index;
      const pose = frame.getPose(result.imageSpace, referenceSpace);
      console.log(pose);
      const state = result.trackingState;
      console.log(state);
      if (state == "tracked") {
        console.log("Image target has been found")
        mesh.visible = true;
        mesh.matrix.fromArray(pose.transform.matrix);
      } else if (state == "emulated") {
        mesh.visible = false;
        console.log("Image target no longer seen")
      }
    }
  }
  renderer.render(scene, camera);
}
