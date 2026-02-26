/* Chemistry Simulation Core Logic - Advanced Version */

let rotationAngles = {};
let reflectionStates = {};
let inversionStates = {};

/**
 * Update Matrix Display
 * @param {string} containerId - ID of the div to show the matrix
 * @param {Array} matrix - 3x3 array
 */
function updateMatrixDisplay(containerId, matrix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '<div class="matrix-grid grid grid-cols-3 gap-2 font-mono text-center bg-slate-900 text-cyan-400 p-4 rounded-lg border-2 border-cyan-800 shadow-inner">';
    matrix.flat().forEach(val => {
        const displayVal = Number.isInteger(val) ? val : val.toFixed(2);
        html += `<div class="p-2 border border-slate-700">${displayVal}</div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Enhanced Rotation with Matrix
 */
function simulateRotation(id, step = 180, logId = null, matrixId = null) {
    const mol = document.getElementById(id);
    if (!mol) return;
    
    if (!rotationAngles[id]) rotationAngles[id] = 0;
    rotationAngles[id] += step;
    
    const rad = (rotationAngles[id] * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Z-axis rotation matrix
    const matrix = [
        [Math.cos((step*Math.PI)/180), -Math.sin((step*Math.PI)/180), 0],
        [Math.sin((step*Math.PI)/180), Math.cos((step*Math.PI)/180), 0],
        [0, 0, 1]
    ];

    mol.style.transform = `rotateZ(${rotationAngles[id]}deg)`;
    
    if (logId) {
        document.getElementById(logId).innerText = `Operation: C${360/step} (Total: ${rotationAngles[id] % 360}°)`;
    }
    if (matrixId) updateMatrixDisplay(matrixId, matrix);
}

/**
 * Orbital Phase Flip Logic
 */
function simulateOrbitalTransform(id, type, matrixId = null) {
    const orbital = document.getElementById(id);
    if (!orbital) return;

    let matrix = [[1,0,0],[0,1,0],[0,0,1]];
    
    if (type === 'reflection') {
        reflectionStates[id] = !reflectionStates[id];
        orbital.classList.toggle('phase-flipped');
        matrix = [[-1,0,0],[0,1,0],[0,0,1]]; // Sigma_yz (reflect X)
    } else if (type === 'inversion') {
        inversionStates[id] = !inversionStates[id];
        orbital.classList.toggle('inverted');
        matrix = [[-1,0,0],[0,-1,0],[0,0,-1]];
    }
    
    if (matrixId) updateMatrixDisplay(matrixId, matrix);
}

window.MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
    svg: { fontCache: 'global' }
};
