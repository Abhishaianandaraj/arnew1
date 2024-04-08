import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let hiroMarkerMesh;

init();

async function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;

    const container = document.querySelector("#scene-container");
    container.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    ambient.position.set(0.5, 1, 0.25);
    scene.add(ambient);

    const imgMarkerHiro = document.getElementById("imgMarkerHiro");
    const imgMarkerHiroBitmap = await createImageBitmap(imgMarkerHiro);
    console.log(imgMarkerHiroBitmap);

    const button = ARButton.createButton(renderer, {
      requiredFeatures: ['image-tracking'],
      trackedImages: [
        {
          image: imgBitmap,
          widthInMeters: 0.2
        }
      ],
        optionalFeatures: ["dom-overlay"],
        domOverlay: {
            root: document.body,
        },
    });
    document.body.appendChild(button);

    const hiroMarkerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    hiroMarkerGeometry.translate(0, 0.1, 0);
    const hiroMarkerMaterial = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
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
        console.log(results);

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
