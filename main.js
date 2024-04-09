import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';


let camera, canvas, scene, renderer;
let mesh;

init();
animate();

async function init() {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50,
    window.innerWidth / window.innerHeight,
    0.01,
    40
  );

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  // setup a cone mesh to put on top of the image target when it is seen
  const radius = 0.2;
  const height = 0.3;
  const geometry = new THREE.ConeGeometry(radius, height, 32);
  //by default the image will be rendered in the middle, so we need to push half of the height up to be exactly on top of the img
  geometry.translate(0, height / 2, 0);

  const material = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.matrixAutoUpdate = false; // important we have to set this to false because we'll update the position when we track an image
  mesh.visible = false;
  scene.add(mesh);
  
  // setup the image target
  const img = document.getElementById('imgMarkerHiro');
  const imgBitmap = await createImageBitmap(img);
  console.log(imgBitmap);

  //more on image-tracking feature: https://github.com/immersive-web/marker-tracking/blob/main/explainer.md
  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["image-tracking"], // notice a new required feature
    trackedImages: [
      {
        image: imgBitmap, // tell WebXR this is the image target we want to track
        widthInMeters: 0.7 // in meters what the size of the PRINTED image in the real world
      }
    ],
    //this is for the mobile debug
    optionalFeatures: ["dom-overlay", "dom-overlay-for-handheld-ar"],
    domOverlay: {
      root: document.body
    }
  });
  document.body.appendChild(button);

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function animate() {
  if(renderer){
  renderer.setAnimationLoop(render);}
  else{
    console.log("no renderer");
  }
}

function render( timestamp, frame ) {

	if ( frame ) {

		const results = frame.getImageTrackingResults();
		
		for ( const result of results ) {
		
			// The result's index is the image's position in the trackedImages array specified at session creation
			const imageIndex = result.index;
      console.log(result);
			// Get the pose of the image relative to a reference space.
      const referenceSpace = renderer.xr.getReferenceSpace();
      console.log(referenceSpace);
			const pose = frame.getPose( result.imageSpace, referenceSpace );

			const state = result.trackingState;

			if ( state == "tracked" ) {
			
				HighlightImage( imageIndex, pose );
				
			} else if ( state == "emulated" ) {
			
				FadeImage( imageIndex, pose );
				
			}
			
		}

	}

	renderer.render( scene, camera );

}

  