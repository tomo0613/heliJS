import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import {CannonDebugRenderer, IDebugRenderer} from './CannonDebugRenderer';
import CameraHelper from './cameraHelper';
import bodies from './bodies';
import gState from './state';

import HUD from './hud';
import _C from './constants';
import utils from './utils';

type Vec3 = CANNON.Vec3 & THREE.Vector3;
type Quat = CANNON.Quaternion & THREE.Quaternion;
type ColladaObjectProps = {
    material: THREE.MeshPhongMaterial|THREE.MeshBasicMaterial|THREE.MeshLambertMaterial;
};
type MeshOptions = {
    enableShadows?: boolean;
};
type Heli = {
    scene: THREE.Scene;
    methods: {
        applyControls(state: typeof gState): void;
        applyPhysics(): void;
        rotateRotors(state: typeof gState): void;
    }
};

interface Models {
    heli?: Heli;
}

let paused: boolean = false;

const gWorld = new CANNON.World();
gWorld.gravity.set(_C.gravity.x, _C.gravity.y, _C.gravity.z);
gWorld.broadphase = new CANNON.NaiveBroadphase();
gWorld.solver.iterations = 5;

const gScene = new THREE.Scene();
const gCamera = new THREE.PerspectiveCamera(45, getAspectRatio(), 0.1, 1000);
const cameraHelper = CameraHelper(gCamera);
const gRenderer = new THREE.WebGLRenderer(/*{antialias: true}*/);
gRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(gRenderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const sunLight = new THREE.DirectionalLight(0xf5f4d3, 0.9);
sunLight.position.set(-1, 0.5, -1).normalize();

gScene.add(ambientLight);
gScene.add(sunLight); // ToDo fix THREE types (Object3D.add(): should return Object3D , to be able to chain)

const gModels: Models = {};
const hud = HUD();
document.body.appendChild(hud.domElement);

let gDebugRenderer: IDebugRenderer;
let updateCamera = () => {};

init();

function switchCamera () {
    updateCamera = cameraHelper.getNextCamera(gModels.heli.scene);
}

function init() {
    gWorld.addBody(bodies.terrain);
    gScene.add(heightFieldToMesh(bodies.terrain));

    utils.loadResource('image', '../resources/images/skybox.jpg').then((img: ImageBitmap) => {
        const skyBox = new THREE.CubeTexture(utils.sliceCubeTexture(img));
        skyBox.needsUpdate = true;

        gScene.background = skyBox;
    }).catch(e => console.error(e));

    utils.loadResource('collada', '../resources/models/ah6.dae').then((collada: THREE.ColladaModel) => {
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

        body.position.set(0, 3, 0); // initial model position
        body.linearDamping = 0.5;
        body.angularDamping = 0.9;

        gScene.add(model);
        gWorld.addBody(body);

        let rotation = 0;
        const deg1 = Math.PI / 180;
        const deg360 = Math.PI * 2;
        const rotateRotors = (state: typeof gState) => {
            const speed = deg1 * state.torque;
            rotation = rotation > deg360 ? rotation - deg360 + speed : rotation + speed;

            setRotation.main(-rotation);
            setRotation.tail(-rotation);
        };

        const rotationForce = new CANNON.Vec3();
        const accelerationForce = new CANNON.Vec3();
        const mainRotorPosition = new CANNON.Vec3();
        const applyControls = (state: typeof gState) => {
            rotationForce.set(state.pitchForce, state.yawForce, state.rollForce);
            accelerationForce.set(0, state.torque, 0);
            mainRotorPosition.set(body.position.x, body.position.y - 0.5, body.position.z);

            body.quaternion.vmult(rotationForce, rotationForce);
            body.quaternion.vmult(accelerationForce, accelerationForce);

            body.applyForce(accelerationForce, mainRotorPosition);

            if (!rotationForce.isZero()) {
                body.angularVelocity.copy(rotationForce);
            }
        };

        const applyPhysics = () => {
            model.position.copy(body.position as Vec3);
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

        switchCamera();
        render();
    }).catch(e => console.error(e));
}

function render() {
    if (paused) {
        return;
    }

    gWorld.step(_C.timeStep);

    gState.update();

    hud.update({torque: gState.torque, altitude: gModels.heli.scene.position.y});

    animateHeli();
    updateCamera();

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
}

function heightFieldToMesh(body: CANNON.Body, options: MeshOptions = {}): THREE.Object3D {
    const shape = body.shapes[0] as CANNON.Heightfield;
    const geometry = new THREE.Geometry();
    const material = new THREE.MeshLambertMaterial({color: 0xB59058});
    const v0 = new CANNON.Vec3();
    const v1 = new CANNON.Vec3();
    const v2 = new CANNON.Vec3();

    for (let i = 0; i < shape.data.length - 1; i++) {
        for (let j = 0; j < shape.data[i].length - 1; j++) {
            for (let k = 0; k < 2; k++) {
                shape.getConvexTrianglePillar(i, j, k === 0);

                v0.copy(shape.pillarConvex.vertices[0]);
                v1.copy(shape.pillarConvex.vertices[1]);
                v2.copy(shape.pillarConvex.vertices[2]);
                v0.vadd(shape.pillarOffset, v0);
                v1.vadd(shape.pillarOffset, v1);
                v2.vadd(shape.pillarOffset, v2);

                geometry.vertices.push(
                  new THREE.Vector3(v0.x, v0.y, v0.z),
                  new THREE.Vector3(v1.x, v1.y, v1.z),
                  new THREE.Vector3(v2.x, v2.y, v2.z),
                );

                const n = geometry.vertices.length - 3;
                geometry.faces.push(new THREE.Face3(n, n + 1, n + 2));
            }
        }
    }

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = options.enableShadows;
    mesh.castShadow = options.enableShadows;
    mesh.position.set(body.position.x, body.position.y, body.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);

    const obj = new THREE.Object3D();
    obj.add(mesh);

    return obj;
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
    // if (e.key === 'h') console.log('h');

    if (e.key === 'c') {
        switchCamera();
    }

    if (e.key === 'p') {
        if (paused) {
            paused = false;
            render();
        } else {
            paused = true;
            console.info('Pause');
        }
    }
});
