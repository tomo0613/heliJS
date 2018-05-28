import * as THREE from 'three';
import * as CANNON from 'cannon';

interface Options {
    color?: number;
}

interface Config {
    color: number;
}

interface CommonShapeProps {
    geometryId?: number;
}

export interface IDebugRenderer {
    update(): void;
    reset(): void;
}

type Vec3 = CANNON.Vec3 & THREE.Vector3;
type Quat = CANNON.Quaternion & THREE.Quaternion;
type Shape = CommonShapeProps
    & CANNON.Sphere
    & CANNON.Plane
    & CANNON.Box
    & CANNON.ConvexPolyhedron
    & CANNON.Heightfield
    & CANNON.Particle
    & CANNON.Cylinder
    & CANNON.Trimesh;

const defaultConfig = {
    color: 0x007700,
};

export function CannonDebugRenderer(gScene: THREE.Scene, gWorld: CANNON.World, options: Options = {}): IDebugRenderer {
    const config: Config = Object.assign({}, defaultConfig, options);

    const meshes: (THREE.Mesh|undefined)[] = [];
    const tmpVectors: CANNON.Vec3[] = Array(3).fill({}).map(() => new CANNON.Vec3());

    const tmpQuaternion = new CANNON.Quaternion();

    const material = new THREE.MeshBasicMaterial({color: config.color, wireframe: true});
    const sphereGeometry = new THREE.SphereGeometry(1);
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const planeGeometry = new THREE.PlaneGeometry(40, 40, 10, 10);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10, 10);

    return {
        update,
        reset: () => meshes.forEach((mesh) => gScene.remove(mesh)),
    };

    function update() {
        const shapeWorldPosition = tmpVectors[0];
        const shapeWorldQuaternion = tmpQuaternion;

        let meshIndex = 0;

        gWorld.bodies.forEach((body: CANNON.Body) => {
            body.shapes.forEach((shape: Shape, index) => {
                updateMesh(meshIndex, shape);

                const mesh = meshes[meshIndex];

                if (mesh) {
                    // Get world position
                    body.quaternion.vmult(body.shapeOffsets[index], shapeWorldPosition);
                    body.position.vadd(shapeWorldPosition, shapeWorldPosition);
                    // Get world quaternion
                    body.quaternion.mult(body.shapeOrientations[index], shapeWorldQuaternion);
                    // Copy to meshes
                    mesh.position.copy(shapeWorldPosition as Vec3);
                    mesh.quaternion.copy(shapeWorldQuaternion as Quat);
                }

                meshIndex++;
            });
        });

        for (let i = meshIndex; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (mesh) {
                gScene.remove(mesh);
            }
        }

        meshes.length = meshIndex;
    }

    function updateMesh(index: number, shape: Shape) {
        let mesh = meshes[index];

        if (!typeMatch(mesh, shape)) {
            if (mesh) {
                gScene.remove(mesh);
            }

            mesh = createMesh(shape);
            meshes[index] = mesh;

            if (mesh) {
                gScene.add(mesh);
            }
        }

        scaleMesh(mesh, shape);
    }

    function typeMatch(mesh: THREE.Mesh|undefined, shape: Shape) {
        if (!mesh) {
            return false;
        }
        const geometry = mesh.geometry;

        return (
            (geometry instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
            (geometry instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
            (geometry instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
            (geometry.id === shape.geometryId && shape instanceof CANNON.ConvexPolyhedron) ||
            (geometry.id === shape.geometryId && shape instanceof CANNON.Trimesh) ||
            (geometry.id === shape.geometryId && shape instanceof CANNON.Heightfield)
        );
    }

    function createMesh(shape: Shape) {
        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                return new THREE.Mesh(sphereGeometry, material);
            case CANNON.Shape.types.BOX:
                return new THREE.Mesh(boxGeometry, material);
            case CANNON.Shape.types.PLANE:
                return new THREE.Mesh(planeGeometry, material);
            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                const convexPolyhedronGeometry = createConvexPolyhedronGeometry(shape);
                shape.geometryId = convexPolyhedronGeometry.id;
                return new THREE.Mesh(convexPolyhedronGeometry, material);
            case CANNON.Shape.types.TRIMESH:
                const trimeshGeometry = createTrimeshGeometry(shape);
                shape.geometryId = trimeshGeometry.id;
                return new THREE.Mesh(trimeshGeometry, material);
            case CANNON.Shape.types.HEIGHTFIELD:
                const heightfieldGeometry = createHeightfieldGeometry(shape);
                shape.geometryId = heightfieldGeometry.id;
                return new THREE.Mesh(heightfieldGeometry, material);
        }
    }

    function scaleMesh(mesh: THREE.Mesh, shape: Shape) {
        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                const {radius} = shape;
                mesh.scale.set(radius, radius, radius);
                break;
            case CANNON.Shape.types.BOX:
                mesh.scale.copy(shape.halfExtents as Vec3);
                mesh.scale.multiplyScalar(2);
                break;
            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                mesh.scale.set(1, 1, 1);
                break;
            case CANNON.Shape.types.TRIMESH:
                mesh.scale.copy(shape.scale as Vec3);
                break;
            case CANNON.Shape.types.HEIGHTFIELD:
                mesh.scale.set(1, 1, 1);
                break;
        }
    }

    function createConvexPolyhedronGeometry(shape: CANNON.ConvexPolyhedron) {
        const geometry = new THREE.Geometry();

        shape.vertices.forEach((vertex) => {
            geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
        });

        shape.faces.forEach((face) => {
            // add triangles
            const a = face[0];
            for (let i = 1; i < face.length - 1; i++) {
                const b = face[i];
                const c = face[i + 1];

                geometry.faces.push(new THREE.Face3(a, b, c));
            }
        });

        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();

        return geometry;
    }

    function createTrimeshGeometry(shape: CANNON.Trimesh) {
        const geometry = new THREE.Geometry();
        const v0 = tmpVectors[0];
        const v1 = tmpVectors[1];
        const v2 = tmpVectors[2];

        for (let i = 0; i < shape.indices.length / 3; i++) {
            shape.getTriangleVertices(i, v0, v1, v2);
            geometry.vertices.push(
              new THREE.Vector3(v0.x, v0.y, v0.z),
              new THREE.Vector3(v1.x, v1.y, v1.z),
              new THREE.Vector3(v2.x, v2.y, v2.z),
            );
            const n = geometry.vertices.length - 3;
            geometry.faces.push(new THREE.Face3(n, n + 1, n + 2));
        }

        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();

        return geometry;
    }

    function createHeightfieldGeometry(shape: CANNON.Heightfield) {
        const geometry = new THREE.Geometry();
        const v0 = tmpVectors[0];
        const v1 = tmpVectors[1];
        const v2 = tmpVectors[2];

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

        return geometry;
    }
}
