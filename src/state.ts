import constants from './constants';

interface State {
    torque: number;
    pitchForce: number;
    rollForce: number;
    yawForce: number;
    update(): void;
}

interface Actions {
    increaseTorque(): void;
    decreaseTorque(): void;
    setPitch(direction: number): void;
    setRoll(direction: number): void;
    setYaw(direction: number): void;
}

const keys = {
    increaseTorque: 'Space',
    decreaseTorque: 'Slash',
    pitchForward: 'KeyW',
    pitchBack: 'KeyS',
    rollLeft: 'KeyA',
    rollRight: 'KeyD',
    yawLeft: 'KeyQ',
    yawRight: 'KeyE',
};

Object.defineProperty(window, 'controls', {
    get() {
        return keys;
    },
});

export default (() => {
    const keysPressed: Set<string> = new Set();
    const isKeyDown = (key: string) => keysPressed.has(key);
    let torque = 0;
    let pitchForce = 0;
    let pitchSpeed = 0;
    let rollForce = 0;
    let rollSpeed = 0;
    let yawForce = 0;
    let yawSpeed = 0;

    window.onkeydown = (e: KeyboardEvent) => {
        keysPressed.add(e.code);
        preventPageScrolling(e);
    };
    window.onkeyup = (e: KeyboardEvent) => {
        keysPressed.delete(e.code);
    };

    const actions: Actions = {
        increaseTorque: () => {
            torque = Math.min(torque + constants.power, constants.maxTorque);
        },
        decreaseTorque: () => {
            torque = Math.max(torque - constants.power, 0);
        },
        setPitch: (direction) => {
            pitchForce = direction * Math.min(torque / 100, 1);
        },
        setRoll: (direction) => {
            rollForce = direction * Math.min(torque / 100, 1);
        },
        setYaw: (direction) => {
            yawForce = direction * Math.min(torque / 100, 1);
        },
    };

    function updateState() {
        if (isKeyDown(keys.increaseTorque)) {
            actions.increaseTorque();
        } else if (isKeyDown(keys.decreaseTorque)) {
            actions.decreaseTorque();
        }
        // rotate on X axis [forth|back]
        if (isKeyDown(keys.pitchForward) || isKeyDown(keys.pitchBack)) {
            const pitchDirection = isKeyDown(keys.pitchForward) ? -1 : 1;

            pitchSpeed = Math.min(pitchSpeed + 0.05, 1);
            actions.setPitch(pitchDirection * pitchSpeed);
        } else {
            pitchSpeed = 0;
            actions.setPitch(0);
        }
        // rotate on Z axis [left|right]
        if (isKeyDown(keys.rollLeft) || isKeyDown(keys.rollRight)) {
            const rollDirection = isKeyDown(keys.rollLeft) ? 1 : -1;

            rollSpeed = Math.min(rollSpeed + 0.05, 1);
            actions.setRoll(rollDirection * rollSpeed);
        } else {
            rollSpeed = 0;
            actions.setRoll(0);
        }
        // rotate on Y axis [left|right]
        if (isKeyDown(keys.yawLeft) || isKeyDown(keys.yawRight)) {
            const yawDirection = isKeyDown(keys.yawLeft) ? 1 : -1;

            yawSpeed = Math.min(yawSpeed + 0.05, 1);
            actions.setYaw(yawDirection * yawSpeed);
        } else {
            yawSpeed = 0;
            actions.setYaw(0);
        }
    }

    return {
        get torque() {
            return torque;
        },
        get pitchForce() {
            return pitchForce;
        },
        get rollForce() {
            return rollForce;
        },
        get yawForce() {
            return yawForce;
        },
        update: updateState,
    } as State;
})();

function preventPageScrolling(e: KeyboardEvent) {
    const navigationKeys = [
        'Space',
        'PageUp',
        'PageDown',
        'End',
        'Home',
        'ArrowLeft',
        'ArrowUp',
        'ArrowRight',
        'ArrowDown',
    ];

    if (navigationKeys.includes(e.code)) {
        e.preventDefault();
    }
}
