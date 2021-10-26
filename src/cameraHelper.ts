import { Camera, Vector3, Matrix4 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default (camera: Camera, domElement: HTMLCanvasElement) => {
    const orbitCamera = new OrbitControls(camera, domElement);

    // orbitCamera.position0 = new Vector3(0, 5, 20);
    orbitCamera.minDistance = 10;
    //     orbitCamera.mouseButtons = {
    //         ORBIT: THREE.MOUSE.RIGHT,
    //         ZOOM: THREE.MOUSE.LEFT,
    //         PAN: THREE.MOUSE.MIDDLE,
    //     };

    const dist = 20; // ToDo change on scroll
    const cameraTargetPosition = new Vector3();
    const cameraOffset = new Vector3();
    const rotationMatrix = new Matrix4();

    function updateChaseCamera(target: THREE.Scene) {
        cameraOffset.set(0, 5, dist);
        rotationMatrix.makeRotationFromQuaternion(target.quaternion);

        cameraOffset.applyMatrix4(rotationMatrix);
        cameraTargetPosition.copy(target.position).add(cameraOffset);

        camera.position.lerp(cameraTargetPosition, 0.1);
        camera.lookAt(target.position);
    }

    let cameraId = 1;

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

    return {
        getNextCamera,
    };
};
