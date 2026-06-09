/* Chemistry Simulation Core Logic - Advanced Version */

let rotationAngles = {};
let reflectionStates = {};
let inversionStates = {};

/**
 * Update Matrix Display
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
 * Core Rotation Simulation
 */
function coreSimulateRotation(id, step = 180, logId = null, matrixId = null) {
    const mol = document.getElementById(id);
    if (!mol) return;
    
    if (!rotationAngles[id]) rotationAngles[id] = 0;
    rotationAngles[id] += step;
    
    const rad_step = (step * Math.PI) / 180;
    const matrix = [
        [Math.cos(rad_step), -Math.sin(rad_step), 0],
        [Math.sin(rad_step), Math.cos(rad_step), 0],
        [0, 0, 1]
    ];

    mol.style.transform = `rotateZ(${rotationAngles[id]}deg)`;
    
    if (logId) {
        const logEl = document.getElementById(logId);
        if (logEl) logEl.innerText = `Operation: C${Math.round(360/step)} (Total: ${rotationAngles[id] % 360}°)`;
    }
    if (matrixId) updateMatrixDisplay(matrixId, matrix);
}

function coreSimulateReflection(id) {
    const mol = document.getElementById(id);
    if (!mol) return;
    reflectionStates[id] = !reflectionStates[id];
    mol.style.transform = reflectionStates[id] ? 'scaleX(-1)' : 'scaleX(1)';
}

function coreSimulateInversion(id) {
    const mol = document.getElementById(id);
    if (!mol) return;
    inversionStates[id] = !inversionStates[id];
    mol.style.transform = inversionStates[id] ? 'scale(-1)' : 'scale(1)';
}

function coreSimulateOrbitalTransform(id, type, matrixId = null) {
    const orbital = document.getElementById(id);
    if (!orbital) return;

    let matrix = [[1,0,0],[0,1,0],[0,0,1]];
    
    if (type === 'reflection') {
        reflectionStates[id] = !reflectionStates[id];
        orbital.classList.toggle('phase-flipped');
        matrix = [[-1,0,0],[0,1,0],[0,0,1]];
    } else if (type === 'inversion') {
        inversionStates[id] = !inversionStates[id];
        orbital.classList.toggle('inverted');
        matrix = [[-1,0,0],[0,-1,0],[0,0,-1]];
    }
    
    if (matrixId) updateMatrixDisplay(matrixId, matrix);
}

/**
 * Reduction Formula Tool (C2v Example)
 */
function calculateReduction() {
    // C2v Character Table
    const table = {
        'A1': [1, 1, 1, 1],
        'A2': [1, 1, -1, -1],
        'B1': [1, -1, 1, -1],
        'B2': [1, -1, -1, 1]
    };
    const h = 4;
    const gc = [1, 1, 1, 1]; // Number of ops in each class
    
    // Get user input
    const chiGamma = [
        parseFloat(document.getElementById('chi-E').value) || 0,
        parseFloat(document.getElementById('chi-C2').value) || 0,
        parseFloat(document.getElementById('chi-sv').value) || 0,
        parseFloat(document.getElementById('chi-sv2').value) || 0
    ];
    
    let resultText = "Γ = ";
    let terms = [];
    
    for (let ir in table) {
        let n = 0;
        for (let i = 0; i < 4; i++) {
            n += gc[i] * table[ir][i] * chiGamma[i];
        }
        n = n / h;
        if (n > 0) {
            terms.push((n > 1 ? n : "") + ir);
        }
    }
    
    document.getElementById('reduction-result').innerText = resultText + (terms.length > 0 ? terms.join(" + ") : "0");
}

window.simulateRotation = coreSimulateRotation;
window.simulateReflection = coreSimulateReflection;
window.simulateInversion = coreSimulateInversion;
window.simulateOrbitalTransform = coreSimulateOrbitalTransform;
window.calculateReduction = calculateReduction;
