import constants from './constants';

interface State {
    torque: number;
    pitchSpeed: number;
    rollSpeed: number;
    yawSpeed: number;
    update(): void;
}

interface Actions {
    increaseTorque(): void;
    decreaseTorque(): void;
    setPitch(direction: -1|0|1): void;
    setRoll(direction: -1|0|1): void;
    setYaw(direction: -1|0|1): void;
}

export default (function() {
    const keysPressed: Set<string> = new Set();
    const isKeyPressed = (key: string) => keysPressed.has(key);
    let torque = 0;
    let pitchSpeed = 0;
    let rollSpeed = 0;
    let yawSpeed = 0;

    window.onkeydown = (e) => keysPressed.add(e.key) && preventPageScrolling(e);
    window.onkeyup = (e) => keysPressed.delete(e.key);

    const actions: Actions = {
        increaseTorque: () => torque = Math.min(torque + constants.power, constants.maxTorque),
        decreaseTorque: () => torque = Math.max(torque - constants.power, 0),
        setPitch: (direction) => pitchSpeed = 0.5 * direction * Math.min(torque / 100, 1),
        setRoll: (direction) => rollSpeed = 0.5 * direction * Math.min(torque / 100, 1),
        setYaw: (direction) => yawSpeed = 1 * direction * Math.min(torque / 100, 1),
    };

    function updateState() {
        if (isKeyPressed('+')) {
            actions.increaseTorque();
        } else if (isKeyPressed('-')) {
            actions.decreaseTorque();
        }
        // rotate on X axis [forth|back]
        if (isKeyPressed('w')) {
            actions.setPitch(-1);
        } else if (isKeyPressed('s')) {
            actions.setPitch(1);
        } else {
            actions.setPitch(0);
        }
        // rotate on Z axis [left|right]
        if (isKeyPressed('a')) {
            actions.setRoll(1);
        } else if (isKeyPressed('d')) {
            actions.setRoll(-1);
        } else {
            actions.setRoll(0);
        }
        // rotate on Y axis [left|right]
        if (isKeyPressed('q')) {
            actions.setYaw(1);
        } else if (isKeyPressed('e')) {
            actions.setYaw(-1);
        } else {
            actions.setYaw(0);
        }
    }

    return {
        get torque() {
            return torque;
        },
        get pitchSpeed() {
            return pitchSpeed;
        },
        get rollSpeed() {
            return rollSpeed;
        },
        get yawSpeed() {
            return yawSpeed;
        },
        update: updateState,
    } as State;
})();

function preventPageScrolling(e: KeyboardEvent) {
    const navigationKeys = [
        ' ', // 32
        'PageUp', // 33
        'PageDown', // 34
        'End', // 35
        'Home', // 36
        'ArrowLeft', // 37
        'ArrowUp', // 38
        'ArrowRight', // 39
        'ArrowDown', // 40
    ];

    if (navigationKeys.includes(e.key)) {
        e.preventDefault();
    }
}
