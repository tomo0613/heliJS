import {
    Heightfield,
Body,
Box,
Vec3,
Cylinder, Quaternion
} from 'cannon-es';

const props = {
    modelMass: 10,
    rotorBladeLength: 2.6,
    rotorBladeThickness: 0.05,
    rotorBladeWidth: 0.2,
};

export default (function bodies () {
    return {
        terrain: createTerrain(),
        heli: createHeliBody(),
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
        const terrainShape = new Heightfield(heightMap, {elementSize: 10});
        const terrain = new Body({mass: 0, shape: terrainShape});

        terrain.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
        terrain.position.set(-mapRows * terrainShape.elementSize / 2, 0, mapColumns * terrainShape.elementSize / 2);

        return terrain;
    }

    function createHeliBody() {
        const heli = new Body({mass: props.modelMass});
        const landingSkidShape = new Box(new Vec3(0.1, 0.1, 1.8));
        const heliCenterShape = new Box(new Vec3(1, 1, 2));
        const heliTailShape = new Box(new Vec3(0.2, 0.2, 2));
        const heliRearShape = new Box(new Vec3(0.1, 1, 0.2));
        const heliWingShape = new Box(new Vec3(1.3, 0.1, 0.2));
        const rotorCylinderShape = new Cylinder(
            props.rotorBladeLength * 2,
            props.rotorBladeLength * 2,
            props.rotorBladeThickness * 2,
            10,
        );

        const quat = new Quaternion();
        quat.setFromAxisAngle(new Vec3(0, 1, 0), Math.PI / 2);

        heli.addShape(landingSkidShape, new Vec3(1.2, -1.9, -0.7))
            .addShape(landingSkidShape, new Vec3(-1.2, -1.9, -0.7))
            .addShape(heliCenterShape, new Vec3(0, 0, 0))
            .addShape(heliTailShape, new Vec3(0, 0.5, 3.8))
            .addShape(heliRearShape, new Vec3(0, 0.5, 6.1))
            .addShape(heliWingShape, new Vec3(0, 1.9, 6.5))
            .addShape(rotorCylinderShape, new Vec3(0, 1.5 , 0), quat);

        return heli;
    }
})();
