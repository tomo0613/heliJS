import { Quaternion, World, SAPBroadphase, Vec3 } from 'cannon-es';
import cannonDebugRenderer from 'cannon-es-debugger';
import {
    AmbientLight, Clock, CubeTexture, DirectionalLight, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer,
} from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import bodies from './bodies';
import CameraHelper from './cameraHelper';
import _C from './constants';
import HUD from './hud';
import gState from './state';
import * as utils from './utils';

type Vector3 = Vec3 & THREE.Vector3;
type Quat = Quaternion & THREE.Quaternion;

type Heli = {
    scene: THREE.Group;
    methods: {
        applyControls(state: typeof gState): void;
        applyPhysics(): void;
        rotateRotors(state: typeof gState): void;
    };
};

interface Models {
    heli?: Heli;
}

let paused = false;

const gClock = new Clock();
const gWorld = new World();
gWorld.gravity.set(_C.gravity.x, _C.gravity.y, _C.gravity.z);
gWorld.broadphase = new SAPBroadphase(gWorld);

const gScene = new Scene();
const gCamera = new PerspectiveCamera(45, getAspectRatio(), 0.1, 1000);
const gRenderer = new WebGLRenderer(/* {antialias: true} */);
gRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(gRenderer.domElement);
const cameraHelper = CameraHelper(gCamera, gRenderer.domElement);

const ambientLight = new AmbientLight(0xffffff, 0.5);
const sunLight = new DirectionalLight(0xf5f4d3, 0.9);
sunLight.position.set(-1, 0.5, -1).normalize();

gScene.add(ambientLight);
gScene.add(sunLight); // ToDo fix THREE types (Object3D.add(): should return Object3D , to be able to chain)

const gModels: Models = {};
const hud = HUD();
document.body.appendChild(hud.domElement);

init();

function setSceneBackground(skyboxTexture: HTMLImageElement) {
    const skyBox = new CubeTexture(utils.sliceCubeTexture(skyboxTexture));
    skyBox.needsUpdate = true;

    gScene.background = skyBox;
}

function initHeli({ scene: model }: GLTF) {
    const body = bodies.heli;
    const rotorMaterial = new MeshBasicMaterial({ color: 0x555555 });
    const setRotation = {
        main: utils.noop as (rotation: number) => void,
        tail: utils.noop as (rotation: number) => void,
    };

    model.children.forEach((child: any) => {
        switch (child.name) {
            case 'MainRotor':
                child.material = rotorMaterial;
                setRotation.main = (rad) => {
                    child.rotation.y = rad;
                };
                break;
            case 'TailRotor':
                child.material = rotorMaterial;
                setRotation.tail = (rad) => {
                    child.rotation.x = rad;
                };
                break;
            case 'HeliBody':
                // child.material.color.setHex(0xe4e4e4);
                break;
            default:
                break;
        }
    });

    body.position.set(0, 3, 0); // initial model position
    body.linearDamping = 0.5;
    body.angularDamping = 0.9;

    gScene.add(model);
    gWorld.addBody(body);
    cameraHelper.setCameraTarget(model);

    let rotation = 0;
    const deg1 = Math.PI / 180;
    const deg360 = Math.PI * 2;

    const rotateRotors = (state: typeof gState) => {
        const speed = deg1 * state.torque;
        rotation = rotation > deg360 ? rotation - deg360 + speed : rotation + speed;

        setRotation.main(-rotation);
        setRotation.tail(-rotation);
    };

    const angularVelocity = new Vec3();
    const liftForce = new Vec3();
    const mainRotorPosition = new Vec3(0, -0.5, 0);

    const applyControls = (state: typeof gState) => {
        angularVelocity.set(state.pitchForce, state.yawForce, state.rollForce);
        liftForce.set(0, state.torque, 0);

        body.quaternion.vmult(angularVelocity, angularVelocity);
        body.quaternion.vmult(liftForce, liftForce);

        body.applyForce(liftForce, mainRotorPosition);

        if (!angularVelocity.isZero()) {
            body.angularVelocity.copy(angularVelocity);
        }
    };

    const applyPhysics = () => {
        model.position.copy(body.position as Vector3);
        model.quaternion.copy(body.quaternion as Quat);
    };

    gModels.heli = {
        scene: model,
        methods: {
            applyControls,
            applyPhysics,
            rotateRotors,
        },
    };
}

function init() {
    gWorld.addBody(bodies.terrain);
    // gScene.add(heightFieldToMesh(bodies.terrain));

    Promise.all([
        utils.loadResource<HTMLImageElement>('images/skybox.jpg', '398 kB'),
        utils.loadResource<GLTF>('models/Heli.gltf', '164 kB'),
    ]).then(([
        skyboxTexture,
        heliModel,
    ]) => {
        setSceneBackground(skyboxTexture);

        initHeli(heliModel);

        if (true /* cfg.renderWireFrame */) {
            cannonDebugRenderer(gScene, gWorld.bodies);
        }

        gRenderer.setAnimationLoop(animationLoop);
    }).catch((err) => {
        console.error(err);
    });
}

function animationLoop() {
    const delta = gClock.getDelta();

    gRenderer.render(gScene, gCamera);

    gWorld.step(_C.timeStep, delta);
    animateHeli();

    gState.update();

    hud.update({ torque: gState.torque, altitude: gModels.heli.scene.position.y });

    cameraHelper.update(delta);
}

function animateHeli() {
    gModels.heli.methods.applyControls(gState);
    gModels.heli.methods.rotateRotors(gState);
    gModels.heli.methods.applyPhysics();
}

function getAspectRatio() {
    return window.innerWidth / window.innerHeight;
}

function windowResizeHandler() {
    gCamera.aspect = getAspectRatio();
    gCamera.updateProjectionMatrix();
    gRenderer.setSize(window.innerWidth, window.innerHeight);
}

window.onresize = utils.debounce(windowResizeHandler, 500);

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyC') {
        cameraHelper.switchCameraMode();
    }

    if (e.code === 'KeyP') {
        if (paused) {
            paused = false;
            gRenderer.setAnimationLoop(animationLoop);
        } else {
            paused = true;
            gRenderer.setAnimationLoop(null);
        }
    }
});
