import * as THREE from 'three';
import { XRWebGLLayer, XRSessionMode } from 'three/examples/jsm/webxr/XRWebGLBinding.js';

let camera, scene, renderer, hiroMarkerMesh;

async function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.sRGBEncoding;
  renderer.xr.enabled = true;

  const container = document.querySelector("#scene-container");
  container.appendChild(renderer.domElement);

  const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  ambient.position.set(0.5, 1, 0.25);
  scene.add(ambient);

  const imgMarkerHiro = document.getElementById("imgMarkerHiro");
  const imgMarkerHiroBitmap = await createImageBitmap(imgMarkerHiro);

  const button = document.createElement('button');
  button.textContent = 'Start AR';
  button.addEventListener('click', async () => {
    try {
      await renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.requestSession('immersive-ar', {
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      });
      renderer.setAnimationLoop(render);
      button.style.display = 'none';
    } catch (error) {
      console.error('Failed to start AR session:', error);
    }
  });
  document.body.appendChild(button);

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
}

function render(timestamp, frame) {
  if (frame) {
    const results = frame.getHitTestResults();
    for (const result of results) {
      const pose = result.getPose(renderer.xr.getReferenceSpace());
      if (pose) {
        hiroMarkerMesh.visible = true;
        hiroMarkerMesh.matrix.fromArray(pose.transform.matrix);
      }
    }
  }
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init();