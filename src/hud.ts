import constants from './constants';

export default function () {
    const hud = document.createElement('aside');
    const torqueBar = document.createElement('section');
    const altMeter = document.createElement('section');

    torqueBar.setAttribute('id', 'torqueBar');
    hud.setAttribute('id', 'hud');
    hud.appendChild(torqueBar);
    hud.appendChild(altMeter);

    function update(state: {torque: number; altitude: number}) {
        torqueBar.style.width = `${constants.maxTorque - state.torque}px`;
        altMeter.textContent = `alt: ${(state.altitude - 1).toFixed(1)}`;
    }

    return {
        update,
        domElement: hud,
    };
}
