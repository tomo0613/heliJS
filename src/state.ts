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

export default (function() {
    const keysPressed: Set<string> = new Set();
    const isKeyDown = (key: string) => keysPressed.has(key);
    let torque = 0;
    let pitchForce = 0;
    let pitchSpeed = 0;
    let rollForce = 0;
    let rollSpeed = 0;
    let yawForce = 0;
    let yawSpeed = 0;

    window.onkeydown = (e) => keysPressed.add(e.key) && preventPageScrolling(e);
    window.onkeyup = (e) => keysPressed.delete(e.key);

    const actions: Actions = {
        increaseTorque: () => torque = Math.min(torque + constants.power, constants.maxTorque),
        decreaseTorque: () => torque = Math.max(torque - constants.power, 0),
        setPitch: (direction) => pitchForce = direction * Math.min(torque / 100, 1),
        setRoll: (direction) => rollForce = direction * Math.min(torque / 100, 1),
        setYaw: (direction) => yawForce = direction * Math.min(torque / 100, 1),
    };

    function updateState() {
        if (isKeyDown('+')) {
            actions.increaseTorque();
        } else if (isKeyDown('-')) {
            actions.decreaseTorque();
        }
        // rotate on X axis [forth|back]
        if (isKeyDown('w') || isKeyDown('s')) {
            const pitchDirection = isKeyDown('w') ? -1 : 1;

            pitchSpeed = Math.min(pitchSpeed + 0.05, 1);
            actions.setPitch(pitchDirection * pitchSpeed);
        } else {
            pitchSpeed = 0;
            actions.setPitch(0);
        }
        // rotate on Z axis [left|right]
        if (isKeyDown('a') || isKeyDown('d')) {
            const rollDirection = isKeyDown('a') ? 1 : -1;

            rollSpeed = Math.min(rollSpeed + 0.05, 1);
            actions.setRoll(rollDirection * rollSpeed);
        } else {
            rollSpeed = 0;
            actions.setRoll(0);
        }
        // rotate on Y axis [left|right]
        if (isKeyDown('q') || isKeyDown('e')) {
            const yawDirection = isKeyDown('q') ? 1 : -1;

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
