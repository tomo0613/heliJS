import {ImageLoader} from 'three';
import * as ColladaLoader from 'three-collada-loader-2';

type ResourceType = 'image'|'collada';

function Utils() {
    const loadResource = (resourceType: ResourceType, resourceUrl: string): Promise<any> => {
        let loader;

        switch (resourceType) {
            case 'image':
                loader = new ImageLoader();
                break;
            case 'collada':
                loader = new ColladaLoader();
                break;
            default:
                return Promise.reject(new Error('unknown resource type [' + resourceType + ']'));
        }

        return new Promise((resolve, reject) => {
            const onLoad = (resource)  => resolve(resource);
            const onProgress = () => {};
            const onError = (e)  => {
                console.error('Failed to load resource: ' + e.target.src);
                reject(e);
            };

            loader.load(resourceUrl, onLoad, onProgress, onError);
        });
    };

    const sliceCubeTexture = (img: ImageBitmap, imgSize: number = 1024): HTMLCanvasElement[] => {
        const cubeImageMap = [
            {x: 2, y: 1},
            {x: 0, y: 1},
            {x: 1, y: 0},
            {x: 1, y: 2},
            {x: 1, y: 1},
            {x: 3, y: 1},
        ];

        return cubeImageMap.map((positionOffset) => getFace(positionOffset.x, positionOffset.y));

        function getFace(x, y) {
            const canvas = document.createElement('canvas');
            canvas.width = imgSize;
            canvas.height = imgSize;
            canvas.getContext('2d').drawImage(img, -x * imgSize, -y * imgSize);

            return canvas;
        }
    };

    const lcFirst = (str: string): string => {
        return str.charAt(0).toLowerCase() + str.slice(1);
    };

    // type Callback = (...args: any[]) => void; // ToDo

    // const debounce = <F extends Callback>(fnc: F, delay: number = 200, immediate: boolean = false): F => {
    const debounce = (fnc: any, delay: number = 200, immediate: boolean = false): any => {
        let timeoutId: number;

        return (...args) => {
            if (immediate && !timeoutId) {
                fnc(...args);
            }
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fnc(...args), delay);
        };
    };

    const throttle = function (fnc, timeToWaitBeforeNextCall = 200) {
        let timeoutId: number;
        let prevCallTime: number;
        let now: number;

        return (...args) => {
            const nextScheduledCallTime = prevCallTime + timeToWaitBeforeNextCall;
            now = performance.now();

            if (!prevCallTime || now > nextScheduledCallTime) {
                fnc(...args);
                prevCallTime = now;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    fnc(...args);
                    prevCallTime = now;
                }, timeToWaitBeforeNextCall - (now - prevCallTime));
            }
        };
    };

    return {
        debounce,
        loadResource,
        sliceCubeTexture,
        lcFirst,
    };
}

export default Utils();
