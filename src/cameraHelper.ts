import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';

export default function (camera: THREE.Camera) {
    const orbitCamera: THREE.OrbitControls = new OrbitControls(camera);
    const dist = 20; // ToDo change on scroll

    let cameraId = 0;

    (<any>orbitCamera).position0 = new THREE.Vector3(0, 4, 20); // ToDo fix types
    orbitCamera.minDistance = 10;
    orbitCamera.mouseButtons = {
        ORBIT: THREE.MOUSE.RIGHT,
        ZOOM: THREE.MOUSE.LEFT,
        PAN: THREE.MOUSE.MIDDLE,
    };

    return {
        getNextCamera,
    };

    function updateChaseCamera(target: THREE.Scene) {
        const offset = new THREE.Vector3(0, 0, dist);
        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(target.quaternion);

        offset.applyMatrix4(rotationMatrix);
        offset.y = 5;

        camera.position.copy(target.position).add(offset);
        camera.lookAt(target.position);
    }

    function getNextCamera(target: THREE.Scene) {
        switch (cameraId++) {
            case 0:
                console.info('Orbit camera (use mouse to control)');
                orbitCamera.reset();
                target.add(camera);

                return orbitCamera.update;
            case 1:
                console.info('Chase camera');
                target.remove(camera);

                return () => updateChaseCamera(target);
            case 2:
                console.info('Static camera');

                return () => camera.lookAt(target.position);
            default:
                cameraId = 0;

                return getNextCamera(target);
        }
    }
}
