import * as CANNON from 'cannon';

const props = {
    modelMass: 10,
    rotorBladeLength: 2.6,
    rotorBladeThickness: 0.05,
    rotorBladeWidth: 0.2,
};

export default (function bodies () {
    return {
        terrain: createTerrain(),
        heli: createHeli(),
    };

    function createTerrain() {
        // ToDo (something better & load from JSON)
        const heightMap = [
            [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
            [10, 10, 8, 8, 8, 8, 6, 6, 6, 6, 8, 8, 8, 10, 10, 10],
            [10, 8, 6, 6, 4, 0, 0, 0, 0, 2, 4, 6, 8, 8, 10, 10],
            [10, 6, 6, 4, 2, 0, 0, 0, 0, 0, 2, 4, 6, 8, 8, 10],
            [6, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 6, 8, 10],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 6, 8],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 6],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0],
            [0, 0.5, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 2, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        const mapRows = heightMap.length;
        const mapColumns = heightMap[0].length;
        const terrainShape = new CANNON.Heightfield(heightMap, {elementSize: 10});
        const terrain = new CANNON.Body({mass: 0, shape: terrainShape});

        terrain.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        terrain.position.set(-mapRows * terrainShape.elementSize / 2, 0, mapColumns * terrainShape.elementSize / 2);

        return terrain;
    }

    function createHeli() {
        const heli = new CANNON.Body({mass: props.modelMass});
        const landingSkidShape = new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 1.8));
        const heliCenterShape = new CANNON.Box(new CANNON.Vec3(1, 1, 2));
        const heliTailShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.2, 2));
        const heliRearShape = new CANNON.Box(new CANNON.Vec3(0.1, 1, 0.2));
        const heliWingShape = new CANNON.Box(new CANNON.Vec3(1.3, 0.1, 0.2));
        const rotorCylinderShape = new CANNON.Cylinder(
            props.rotorBladeLength * 2,
            props.rotorBladeLength * 2,
            props.rotorBladeThickness * 2,
            10,
        );

        const quat = new CANNON.Quaternion();
        quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        heli.addShape(landingSkidShape, new CANNON.Vec3(1.2, -1.9, -0.7))
            .addShape(landingSkidShape, new CANNON.Vec3(-1.2, -1.9, -0.7))
            .addShape(heliCenterShape, new CANNON.Vec3(0, 0, 0))
            .addShape(heliTailShape, new CANNON.Vec3(0, 0.5, 3.8))
            .addShape(heliRearShape, new CANNON.Vec3(0, 0.5, 6.1))
            .addShape(heliWingShape, new CANNON.Vec3(0, 1.9, 6.5))
            .addShape(rotorCylinderShape, new CANNON.Vec3(0, 1.5 , 0), quat);

        return heli;
    }
})();
