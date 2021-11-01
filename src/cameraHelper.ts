import { Camera, Vector3, Group } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export enum CameraMode {
    chase = "chase",
    orbit = "orbit",
    static = "static",
}

const cameraModeOrder = [
    CameraMode.chase,
    CameraMode.orbit,
    CameraMode.static,
];

export default (camera: Camera, domElement: HTMLCanvasElement) => {
    const orbitCamera = new OrbitControls(camera, domElement);
    orbitCamera.enabled = false;
    orbitCamera.minDistance = 10;
    //     orbitCamera.mouseButtons = {
    //         ORBIT: THREE.MOUSE.RIGHT,
    //         ZOOM: THREE.MOUSE.LEFT,
    //         PAN: THREE.MOUSE.MIDDLE,
    //     };

    const cameraTargetPosition = new Vector3();
    const chaseCameraMountOffset = new Vector3(0, 5, 20);
    const chaseCameraMountPosition = new Vector3();
    const cameraSpeed = 0.2;
    let currentCameraMode = CameraMode.chase;
    let cameraTarget: THREE.Scene | Group | undefined = undefined;
    let onUpdate = updateChaseCamera;

    function update(delta: number) {
        onUpdate(delta);
    }

    function updateChaseCamera(delta: number) {
        const dt = 1 - cameraSpeed ** delta;

        chaseCameraMountPosition.copy(chaseCameraMountOffset);
        chaseCameraMountPosition.applyQuaternion(cameraTarget.quaternion);
        chaseCameraMountPosition.add(cameraTarget.position);

        camera.position.lerp(chaseCameraMountPosition, dt);
        camera.lookAt(cameraTarget.position);
    }

    function updateOrbitCamera() {
        
    }

    function updateStaticCamera() {
        camera.lookAt(cameraTarget.position);
    }

    // function mountOrbitCamera() {
    // }

    function setCameraTarget(target: THREE.Scene | Group) {
        cameraTarget = target;
    }

    function getNextCameraMode() {
        const currentCameraModeIndex = cameraModeOrder.indexOf(currentCameraMode);
        const _nextCameraModeIndex = currentCameraModeIndex + 1;
        const nextCameraModeIndex = cameraModeOrder.length > _nextCameraModeIndex ? _nextCameraModeIndex : 0;

        return cameraModeOrder[nextCameraModeIndex];
    }

    function switchCameraMode(nextCameraMode = getNextCameraMode()) {
        switch (nextCameraMode) {
            case CameraMode.chase:
                console.info('Chase camera');
                onUpdate = updateChaseCamera;
                break;
            case CameraMode.orbit:
                console.info('Orbit camera (use mouse to control)');
                onUpdate = updateOrbitCamera;
                break;
            case CameraMode.static:
                console.info('Static camera');
                onUpdate = updateStaticCamera;
                break;
            default:
        }

        currentCameraMode = nextCameraMode;
    }

    return {
        update,
        setCameraTarget,
        switchCameraMode,
    };
};
