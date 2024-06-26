import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let mesh;
let secondMesh
let trackedPose;
let trackingStopped = false;
let ViewerPose;

init();
animate();

async function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 40);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  const radius = 0.2;
  const height = 0.3;
  const geometry = new THREE.ConeGeometry(radius, height, 32);
  geometry.translate(0, height / 2, 0);

  const material = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  scene.add(mesh);
  
  // Define the geometry and material for the second mesh
  const secondGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const secondMaterial = new THREE.MeshNormalMaterial();

  // Create the second mesh
  secondMesh = new THREE.Mesh(secondGeometry, secondMaterial);
  secondMesh.matrixAutoUpdate = false;
  secondMesh.visible = false;
  scene.add(secondMesh);


  const img = document.getElementById('imgMarkerHiro');
  const imgBitmap = await createImageBitmap(img);

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

  window.addEventListener("resize", onWindowResize, false);
}

function log(position,Vposition) {
  mesh.visible = true;
  mesh.position.copy(Vposition.transform.position);
  mesh.quaternion.copy(Vposition.transform.orientation);
  secondMesh.visible =true;
  secondMesh.position.copy(Vposition.transform.position);
  secondMesh.quaternion.copy(Vposition.transform.orientation);
  renderer.render(scene, camera);
}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function animate() {
  if(renderer) {
    renderer.setAnimationLoop(render);
  } else {
    console.log("no renderer");
  }
}

function render(timestamp, frame) {
  if (frame) {
    const results = frame.getImageTrackingResults();
    const referenceSpace = renderer.xr.getReferenceSpace();
    for (const result of results) {
      const pose = frame.getPose(result.imageSpace, referenceSpace);
      const state = result.trackingState;
      if (state === "tracked" && !trackingStopped) {
        trackingStopped = true;
        trackedPose = pose;
        ViewerPose = frame.getViewerPose(referenceSpace);
        console.log(frame);
        console.log(ViewerPose);
        break;
      } else if (state === "emulated") {
        console.log("Image target no longer seen");
      }
    }
  }

  if (trackingStopped && trackedPose && ViewerPose) {
    console.log("check",ViewerPose);
    log(trackedPose , ViewerPose);
  }
}
