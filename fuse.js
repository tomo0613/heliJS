const {FuseBox, CSSPlugin, WebIndexPlugin, QuantumPlugin} = require('fuse-box');
const devMode = process.env.NODE_ENV === 'dev';

const fuse = FuseBox.init({
    homeDir: 'src',
    output: 'build/$name.js',
    useTypescriptCompiler: true,
    experimentalFeatures: true,
    plugins: [
        CSSPlugin(),
        WebIndexPlugin({
            template: 'src/index.html',
            path: '.',
        }),
        !devMode && QuantumPlugin({
            treeshake: true,
            uglify: {es6: true},
        }),
    ],
    target: 'browser',
    sourceMaps: devMode,
    cache: devMode,
});

const app = fuse.bundle('bundle').instructions('>index.ts');

if (devMode) {
    const staticFileServer = require('./staticFileServer');
    const staticServerPort = 4445;
    staticFileServer.start(staticServerPort);

    fuse.dev({
        open : true,
        port: 4444,
        proxy: {
            '/resources': {target: 'http://localhost:' + staticServerPort},
        },
    });
    
    app.hmr({reload : true}).watch();
}

fuse.run();
