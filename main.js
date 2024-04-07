import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let camera, scene, renderer, controller, hiroMarkerMesh;

function init() {
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

  document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ['image-tracking'],
    trackedImages: [
      {
        image: createImageBitmap(document.getElementById('imgMarkerHiro')),
        widthInMeters: 0.2,
      },
    ],
  }));

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

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const results = frame.getUpdatedTrackableObjects(referenceSpace);

    for (const result of results) {
      if (result.type === 'image') {
        hiroMarkerMesh.visible = true;
        hiroMarkerMesh.matrix.fromArray(result.transform.matrix);
      }
    }
  }

  renderer.render(scene, camera);
}

init();
animate();