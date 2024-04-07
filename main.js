import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let camera, scene, renderer, hiroMarkerMesh;

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const button = await ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    sessionInit: {
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body },
    },
  });
  document.body.appendChild(button);

  const imgMarkerHiro = document.getElementById("imgMarkerHiro");
  const imgMarkerHiroBitmap = await createImageBitmap(imgMarkerHiro);

  const hiroMarkerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  hiroMarkerGeometry.translate(0, 0.1, 0);
  const hiroMarkerMaterial = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  hiroMarkerMesh = new THREE.Mesh(hiroMarkerGeometry, hiroMarkerMaterial);
  hiroMarkerMesh.name = "HiroMarkerCube";
  hiroMarkerMesh.matrixAutoUpdate = false;
  hiroMarkerMesh.visible = false;
  scene.add(hiroMarkerMesh);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function animate() {
  renderer.setAnimationLoop(render);
}

async function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const hitTestResults = await frame.getHitTestResults(referenceSpace);

    for (const result of hitTestResults) {
      const pose = result.getPose(referenceSpace);
      if (pose) {
        hiroMarkerMesh.visible = true;
        hiroMarkerMesh.matrix.fromArray(pose.transform.matrix);
      }
    }
  }

  renderer.render(scene, camera);
}

async function checkCameraPermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('Camera permission granted');
    init();
    animate();
  } catch (error) {
    console.error('Camera permission denied:', error);
  }
}

checkCameraPermission();