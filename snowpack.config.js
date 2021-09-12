/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        'home': '/',
        'assets': '/',
        'src': '/_src_',
    },
    plugins: [
        '@snowpack/plugin-typescript',
    ],
    devOptions: {
        port: 3000,
    },
};
