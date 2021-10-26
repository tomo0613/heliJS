interface Constants {
    timeStep: number;
    gravity: {x: number; y: number; z: number};
    maxTorque: number;
    power: number;
}

export default {
    timeStep: 1 / 60,
    gravity: { x: 0, y: -9.80665, z: 0 },
    maxTorque: 200,
    power: 1,
} as Constants;
