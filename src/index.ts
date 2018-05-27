import './style.css';
import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';
import * as CANNON from 'cannon';
import {CannonDebugRenderer, IDebugRenderer} from './CannonDebugRenderer';
import bodies from './bodies';
import gState from './state';

import HUD from './hud';
import constants from './constants';
import utils from './utils';

type Vec3 = CANNON.Vec3 & THREE.Vector3;
type Quat = CANNON.Quaternion & THREE.Quaternion;
type ColladaObjectProps = {
    material: THREE.MeshPhongMaterial|THREE.MeshBasicMaterial|THREE.MeshLambertMaterial;
};
type Heli = {
    model: THREE.Scene;
    methods: {
        applyControls(state: typeof gState): void;
        applyPhysics(): void;
        rotateRotors(state: typeof gState): void;
        updateCameraControls(): void;
    }
};

interface Models {
    heli?: Heli;
}

let paused: boolean = false;

const gWorld = new CANNON.World();
gWorld.gravity.set(constants.gravity.x, constants.gravity.y, constants.gravity.z);
gWorld.broadphase = new CANNON.NaiveBroadphase();
gWorld.solver.iterations = 5;

const gScene = new THREE.Scene();
const gCamera = new THREE.PerspectiveCamera(45, getAspectRatio(), 0.1, 1000);
const gRenderer = new THREE.WebGLRenderer(/*{antialias: true}*/);
gRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(gRenderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const sunLight = new THREE.DirectionalLight(0xf5f4d3, 0.9);
sunLight.position.set(-1, 0.5, -1).normalize();

gScene.add(ambientLight);
gScene.add(sunLight); // ToDo fix THREE types (Object3D.add(): should return Object3D , to be able to chain)

gCamera.position.set(0, 4, 20);

const gModels: Models = {};

// let gDebugRenderer: IDebugRenderer;
let gDebugRenderer: IDebugRenderer = CannonDebugRenderer(gScene, gWorld);

const hud = HUD();
document.body.appendChild(hud.domElement);

init();

function init() {
    gWorld.addBody(bodies.ground);

    utils.loadResource('image', '../resources/images/skybox.jpg').then((img: ImageBitmap) => {
        const skyBox = new THREE.CubeTexture(utils.sliceCubeTexture(img));
        skyBox.needsUpdate = true;

        gScene.background = skyBox;
    }).catch(e => console.error(e));

    utils.loadResource('collada', 'resources/models/ah6.dae').then((collada: THREE.ColladaModel) => {
        const model = collada.scene;
        const body = bodies.heli;
        const rotorMaterial = new THREE.MeshBasicMaterial({color: 0x555555});
        const setRotation = {
            main: (rad: number) => {},
            tail: (rad: number) => {},
        };

        model.children.forEach((child: THREE.Object3D & ColladaObjectProps) => {
            switch (child.name) {
                case 'MainRotor':
                    child.material = rotorMaterial;
                    setRotation.main = (rad) => child.rotation.z = rad;
                    break;
                case 'TailRotor':
                    child.material = rotorMaterial;
                    setRotation.tail = (rad) => child.rotation.x = rad;
                    break;
                case 'HeliBody':
                    child.material.color.setHex(0xe4e4e4);
                    break;
                default:
                    break;
            }
        });

        body.position.set(0, 3 + 2, 0); // initialPosition
        body.linearDamping = 0.5;
        body.angularDamping = 0.9;

        gScene.add(model);
        gWorld.addBody(body);

        let rotation = 0;
        const rotateRotors = (state: typeof gState) => {
            const speed = Math.PI / 180 * state.torque;
            rotation = rotation > Math.PI * 2 ? rotation - Math.PI * 2 + speed : rotation + speed;

            setRotation.main(-rotation);
            setRotation.tail(-rotation);
        };

        const applyControls = (state: typeof gState) => {
            const movementDirection = body.quaternion.vmult(
                new CANNON.Vec3(state.pitchSpeed, state.yawSpeed, state.rollSpeed),
            );
            const accelerationForce = body.quaternion.vmult(new CANNON.Vec3(0, state.torque, 0));
            const center = [body.position.x, body.position.y - 0.5, body.position.z];

            body.applyForce(accelerationForce, new CANNON.Vec3(...center));

            if (!movementDirection.isZero()) {
                body.angularVelocity.set(movementDirection.x, movementDirection.y, movementDirection.z);
            }
        };

        const applyPhysics = () => {
            model.position.copy(body.position as Vec3);
            model.quaternion.copy(body.quaternion as Quat);
        };

        model.add(gCamera);

        const cameraControls: THREE.OrbitControls = new OrbitControls(gCamera);
        cameraControls.minDistance = 10;
        cameraControls.mouseButtons = {
            ORBIT: THREE.MOUSE.RIGHT,
            ZOOM: THREE.MOUSE.LEFT,
            PAN: THREE.MOUSE.MIDDLE,
        };

        gModels.heli = {
            model,
            methods: {
                applyControls,
                applyPhysics,
                rotateRotors,
                updateCameraControls: cameraControls.update,
            },
        };

        render();
    }).catch(e => console.error(e));
}

function render() {
    if (paused) {
        return;
    }

    gWorld.step(constants.timeStep);

    gState.update();

    hud.update({torque: gState.torque, altitude: gModels.heli.model.position.y});

    animateHeli();

    if (gDebugRenderer) {
        gDebugRenderer.update();
    }

    gRenderer.render(gScene, gCamera);

    requestAnimationFrame(render);
}

function animateHeli() {
    gModels.heli.methods.applyControls(gState);
    gModels.heli.methods.rotateRotors(gState);
    gModels.heli.methods.applyPhysics();
    gModels.heli.methods.updateCameraControls();
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

Object.defineProperty(window, 'debug', {
    set(value: any) {
        gDebugRenderer && gDebugRenderer.reset();

        if (value) {
            gDebugRenderer = CannonDebugRenderer(gScene, gWorld, {color: 0x0077AA});
        } else {
            gDebugRenderer = null;
        }
    },
});

window.addEventListener('keyup', (e) => {
    if (e.key !== 'p') {
        return;
    }

    if (paused) {
        paused = false;
        render();
    } else {
        paused = true;
        console.info('Pause');
    }
});
