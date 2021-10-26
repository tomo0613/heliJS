import { defineConfig, Plugin } from 'vite';

export default defineConfig({
    publicDir: 'assets',
    plugins: [
        devServer_crossOriginIsolation(),
    ],
    server: {
        open: true,
    },
});

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
function devServer_crossOriginIsolation(): Plugin {
    return {
        name: 'crossOrigin-server',
        apply: 'serve',
        configureServer({ middlewares }) {
            middlewares.use((req, res, next) => {
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                next();
            });
        },
    };
}
