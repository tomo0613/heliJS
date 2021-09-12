import { ImageLoader } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

type ResourceType = GLTF|HTMLImageElement;

export function loadResource<T extends ResourceType>(url: string, size = '?'): Promise<T> {
    const extension = url.split('.').pop();
    let loader: ImageLoader|GLTFLoader;

    switch (extension) {
        case 'jpg':
            loader = new ImageLoader();
            break;
        case 'glb':
        case 'gltf':
            loader = new GLTFLoader();
            break;
        default:
            return Promise.reject(new Error(`unknown resource type [${extension}]`));
    }

    return new Promise((resolve, reject) => {
        const onLoad = (resource) => {
            resolve(resource);
        };
        const onError = (e: ErrorEvent) => {
            // eslint-disable-next-line no-console
            console.error(`Failed to load resource: ${url}`);
            reject(e);
        };

        loader.load(url, onLoad, onProgress, onError);
    });

    function onProgress({ loaded, total, lengthComputable }: ProgressEvent) {
        const totalSize = lengthComputable ? `${bytesToReadable(total, 'k')} kB` : size;

        console.info(
            `Loading resource: ${url} (${bytesToReadable(loaded, 'k')} / ${totalSize})`,
        );
    }
}

function bytesToReadable(value: number, scale: 'k'|'M'|'G'|'T') {
    let result = value;
    const n = ['k', 'M', 'G', 'T'].indexOf(scale) + 1;

    for (let i = 0; i < n; i++) {
        result /= 1024;
    }

    return result.toFixed(2);
}

export function sliceCubeTexture(img: HTMLImageElement, imgSize = 1024) {
    const cubeTextureMap = [
        { x: 2, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 3, y: 1 },
    ];

    return cubeTextureMap.map(getFace);

    function getFace({ x, y }: { x: number; y: number }) {
        const canvas = document.createElement('canvas');
        canvas.width = imgSize;
        canvas.height = imgSize;
        canvas.getContext('2d').drawImage(img, -x * imgSize, -y * imgSize);

        return canvas;
    }
}

export function debounce(fnc: (...a: any[]) => void, delay = 200, immediate = false) {
    let timeoutId: number;

    return (...args: unknown[]) => {
        if (immediate && !timeoutId) {
            fnc(...args);
        }
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            if (!immediate) {
                fnc(...args);
            } else {
                timeoutId = undefined;
            }
        }, delay);
    };
}

export function throttle(fnc: (...a: any[]) => void, timeToWaitBeforeNextCall = 200) {
    let timeoutId: number;
    let prevCallTime: number;
    let now: number;
    let nextScheduledCallTime: number;

    return (...args: unknown[]) => {
        nextScheduledCallTime = prevCallTime + timeToWaitBeforeNextCall;
        now = performance.now();

        if (!prevCallTime || now > nextScheduledCallTime) {
            fnc(...args);
            prevCallTime = now;
        } else {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                fnc(...args);
                prevCallTime = now;
            }, timeToWaitBeforeNextCall - (now - prevCallTime));
        }
    };
}

export function round(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

// export function valueBetween(value: number, min: number, max: number) {
//     return Math.max(min, Math.min(value, max));
// }

// function omit<O extends Record<K, unknown>, K extends keyof O = keyof O>(obj: O, ...keysToOmit: K[]) {
//     return Object.keys(obj).reduce((targetObj, key) => {
//         if (!keysToOmit.includes(key as K)) {
//             targetObj[key] = obj[key];
//         }

//         return targetObj;
//     }, {} as Omit<O, K>);
// }

// function pick<O extends Record<K, unknown>, K extends keyof O = keyof O>(obj: O, ...keysToPick: K[]) {
//     return keysToPick.reduce((targetObj, key) => {
//         if (obj.hasOwnProperty(key)) {
//             targetObj[key] = obj[key];
//         }

//         return targetObj;
//     }, {} as Pick<O, K>);
// }

// Object.defineProperties(Object, {
//     omit: { value: omit },
//     pick: { value: pick },
// });
