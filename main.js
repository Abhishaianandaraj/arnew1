import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

const img = document.getElementById('imgMarkerHiro');
let imgBitmap = null;

// Ensure the image is loaded and ready for use
createImageBitmap(img).then(bitmap => {
    imgBitmap = bitmap;
    console.log(imgBitmap);
});

let camera, scene, renderer, xrRefSpace, gl;

function init() {
    scene = new THREE.Scene();

    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const desktopCube = new THREE.Mesh(geometry, material);
    scene.add(desktopCube);
    desktopCube.position.z -= 0.5;

    const geometry1 = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material1 = new THREE.MeshStandardMaterial({ color: 0xcc6600 });
    const earthCube = new THREE.Mesh(geometry1, material1);
    scene.add(earthCube);

    const ambient = new THREE.AmbientLight(0x222222);
    scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0xdddddd, 1.5);
    directionalLight.position.set(0.9, 1, 0.6).normalize();
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xdddddd, 1);
    directionalLight2.position.set(-0.9, -1, -0.4).normalize();
    scene.add(directionalLight2);

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 20000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
    document.body.appendChild(renderer.domElement);
    renderer.xr.enabled = true;

    window.addEventListener('resize', onWindowResize, false);
}

function getXRSessionInit(mode, options) {
    if (options && options.referenceSpaceType) {
        renderer.xr.setReferenceSpaceType(options.referenceSpaceType);
    }
    const space = (options || {}).referenceSpaceType || 'local-floor';
    const sessionInit = (options && options.sessionInit) || {};

    // Nothing to do for default features.
    if (space === 'viewer') return sessionInit;
    if (space === 'local' && mode.startsWith('immersive')) return sessionInit;

    // If the user already specified the space as an optional or required feature, don't do anything.
    if (sessionInit.optionalFeatures && sessionInit.optionalFeatures.includes(space)) return sessionInit;
    if (sessionInit.requiredFeatures && sessionInit.requiredFeatures.includes(space)) return sessionInit;

    const newInit = Object.assign({}, sessionInit);
    newInit.requiredFeatures = [space];
    if (sessionInit.requiredFeatures) {
        newInit.requiredFeatures = newInit.requiredFeatures.concat(sessionInit.requiredFeatures);
    }
    return newInit;
}

function AR() {
    console.log("session started");
    let currentSession = null;

    function onSessionStarted(session) {
        session.addEventListener('end', onSessionEnded);
        renderer.xr.setSession(session);
        gl = renderer.getContext();
        button.style.display = 'none';
        button.textContent = 'EXIT AR';
        currentSession = session;
        session.requestReferenceSpace('local').then(refSpace => {
            xrRefSpace = refSpace;
            session.requestAnimationFrame(onXRFrame);
        });

        const scores = session.getTrackedImageScores();
        let trackableImages = 0;
        for (let index = 0; index < scores.length; ++index) {
            if (scores[index] === 'untrackable') {
                MarkImageUntrackable(index);
            } else {
                ++trackableImages;
            }
        }
        if (trackableImages === 0) {
            console.log("No trackable images");
        }
    }

    function onSessionEnded() {
        currentSession.removeEventListener('end', onSessionEnded);
        renderer.xr.setSession(null);
        button.textContent = 'ENTER AR';
        currentSession = null;
    }

    if (currentSession === null) {
        const options = {
            requiredFeatures: ['dom-overlay', 'image-tracking'],
            trackedImages: [
                {
                    image: imgBitmap,
                    widthInMeters: 0.2
                }
            ],
            domOverlay: { root: document.body }
        };
        const sessionInit = getXRSessionInit('immersive-ar', {
            mode: 'immersive-ar',
            referenceSpaceType: 'local', // 'local-floor'
            sessionInit: options
        });
        navigator.xr.requestSession('immersive-ar', sessionInit).then(onSessionStarted);
    } else {
        currentSession.end();
    }

    renderer.xr.addEventListener('sessionstart', ev => {
        console.log('sessionstart', ev);
        document.body.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        renderer.domElement.style.display = 'none';
    });

    renderer.xr.addEventListener('sessionend', ev => {
        console.log('sessionend', ev);
        document.body.style.backgroundColor = '';
        renderer.domElement.style.display = '';
    });
}

function onXRFrame(t, frame) {
    const session = frame.session;
    session.requestAnimationFrame(onXRFrame);
    const baseLayer = session.renderState.baseLayer;
    const pose = frame.getViewerPose(xrRefSpace);

    if (pose) {
        for (const view of pose.views) {
            const viewport = baseLayer.getViewport(view);
            gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
            const results = frame.getImageTrackingResults();
            for (const result of results) {
                const imageIndex = result.index;
                const pose1 = frame.getPose(result.imageSpace, xrRefSpace);
                if (pose1) {
                    const state = result.trackingState;
                    if (state === 'tracked') {
                        HighlightImage(imageIndex, pose);
                    } else if (state === 'emulated') {
                        FadeImage(imageIndex, pose);
                    }
                    const pos = pose1.transform.position;
                    const quat = pose1.transform.orientation;

                    earthCube.position.set(pos.x, pos.y, pos.z);
                    earthCube.quaternion.set(quat.x, quat.y, quat.z, quat.w);

                    // Update the position and orientation elements
                    positionElement.textContent = `Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`;
                    orientationElement.textContent = `Orientation: x=${quat.x.toFixed(2)}, y=${quat.y.toFixed(2)}, z=${quat.z.toFixed(2)}, w=${quat.w.toFixed(2)}`;
                }
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();

// Create HTML elements to display the position and orientation
const positionElement = document.createElement('div');
positionElement.id = 'position';
positionElement.style.position = 'absolute';
positionElement.style.top = '10px';
positionElement.style.left = '10px';
document.body.appendChild(positionElement);

const orientationElement = document.createElement('div');
orientationElement.id = 'orientation';
orientationElement.style.position = 'absolute';
orientationElement.style.top = '30px';
orientationElement.style.left = '10px';
document.body.appendChild(orientationElement);

const button = document.createElement('button');
button.id = 'ArButton';
button.textContent = 'ENTER AR';
button.style.cssText += `position: absolute;top:80%;left:40%;width:20%;height:2rem;`;

document.body.appendChild(button);
document.getElementById('ArButton').addEventListener('click', () => {
    console.log("Button Clicked");
    AR();
});
