// assets/js/algorithms/falcon.js

let wasmModule = null;
let currentMode = 'normal';
let latticeVisualization = null;

// WASM 모듈 초기화
async function initializeWasm() {
    try {
        const loader = new WasmLoader('../assets/wasm/falcon.wasm');
        wasmModule = await loader.initialize();
        console.log('FALCON WASM module initialized successfully');
        updateParameters();
        initializeLatticeVisualization();
    } catch (error) {
        console.error('Failed to initialize FALCON WASM module:', error);
        showError('WASM initialization failed');
    }
}

// 모드 선택
function selectMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('active');
    });
    document.getElementById(`${mode}-mode`).classList.add('active');
    updateParameters();
}

// 파라미터 업데이트
function updateParameters() {
    const degree = document.getElementById('degree-select').value;
    const modulus = calculateModulus(degree);
    const securityLevel = calculateSecurityLevel(degree);

    document.getElementById('modulus-value').textContent = modulus;
    document.getElementById('security-level').textContent = `${securityLevel}-bit`;

    if (wasmModule) {
        wasmModule.update_parameters({
            degree: parseInt(degree),
            mode: currentMode
        });
    }

    updateLatticeVisualization(degree);
}

// 키 생성
async function generateKeys() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        showProgress('keygen-output', 'Generating key pair...');
        
        const startTime = performance.now();
        const result = await wasmModule.crypto_sign_keypair();
        const endTime = performance.now();

        document.getElementById('public-key').textContent = result.publicKey;
        document.getElementById('private-key').textContent = result.privateKey;

        showSuccess('keygen-output', `Keys generated successfully (${(endTime - startTime).toFixed(2)}ms)`);
    } catch (error) {
        console.error('Key generation failed:', error);
        showError('Key generation failed: ' + error.message);
    }
}

// 메시지 서명
async function signMessage() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        const privateKey = document.getElementById('sign-private-key').value;
        const message = document.getElementById('message').value;

        if (!privateKey || !message) {
            showError('Please provide both private key and message');
            return;
        }

        showProgress('signature-output', 'Generating signature...');
        
        const startTime = performance.now();
        const signature = await wasmModule.crypto_sign(privateKey, message);
        const endTime = performance.now();

        const signatureSize = signature.length / 2;
        const compressionRate = calculateCompressionRate(signatureSize);

        document.getElementById('signature').textContent = signature;
        document.getElementById('signature-size').textContent = `${signatureSize.toFixed(2)} bytes`;
        document.getElementById('generation-time').textContent = `${(endTime - startTime).toFixed(2)}ms`;
        document.getElementById('compression-rate').textContent = `${compressionRate.toFixed(2)}x`;

        showSuccess('signature-output', 'Signature generated successfully');
    } catch (error) {
        console.error('Signature generation failed:', error);
        showError('Signature generation failed: ' + error.message);
    }
}

// 서명 검증
async function verifySignature() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        const publicKey = document.getElementById('verify-public-key').value;
        const message = document.getElementById('verify-message').value;
        const signature = document.getElementById('verify-signature').value;

        if (!publicKey || !message || !signature) {
            showError('Please provide public key, message, and signature');
            return;
        }

        const startTime = performance.now();
        const isValid = await wasmModule.crypto_sign_verify(publicKey, message, signature);
        const endTime = performance.now();

        showVerificationResult(isValid, endTime - startTime);
    } catch (error) {
        console.error('Signature verification failed:', error);
        showError('Verification failed: ' + error.message);
    }
}

// 격자 시각화 초기화
function initializeLatticeVisualization() {
    const container = document.getElementById('lattice-visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#lattice-visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    latticeVisualization = svg;
    updateLatticeVisualization(document.getElementById('degree-select').value);
}

// 격자 시각화 업데이트
function updateLatticeVisualization(degree) {
    if (!latticeVisualization) return;

    const width = latticeVisualization.node().parentNode.clientWidth;
    const height = latticeVisualization.node().parentNode.clientHeight;
    
    const points = generateLatticePoints(degree, width, height);
    
    // Clear previous visualization
    latticeVisualization.selectAll('*').remove();

    // Draw grid lines
    drawGridLines(latticeVisualization, width, height);

    // Draw lattice points
    const pointsGroup = latticeVisualization.append('g')
        .attr('class', 'points');

    pointsGroup.selectAll('circle')
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 3)
        .attr('fill', '#4f46e5')
        .attr('opacity', 0.8)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 5)
                .attr('opacity', 1);
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 3)
                .attr('opacity', 0.8);
        });
}

// 격자점 생성
function generateLatticePoints(degree, width, height) {
    const points = [];
    const spacing = Math.min(width, height) / Math.sqrt(degree);
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(height / spacing);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            points.push({
                x: j * spacing + spacing / 2,
                y: i * spacing + spacing / 2
            });
        }
    }

    return points;
}

// 격자 그리드 라인 그리기
function drawGridLines(svg, width, height) {
    const gridGroup = svg.append('g')
        .attr('class', 'grid');

    // Vertical lines
    for (let x = 0; x <= width; x += 50) {
        gridGroup.append('line')
            .attr('x1', x)
            .attr('y1', 0)
            .attr('x2', x)
            .attr('y2', height)
            .attr('stroke', '#e2e8f0')
            .attr('stroke-width', 1);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += 50) {
        gridGroup.append('line')
            .attr('x1', 0)
            .attr('y1', y)
            .attr('x2', width)
            .attr('y2', y)
            .attr('stroke', '#e2e8f0')
            .attr('stroke-width', 1);
    }
}

// 유틸리티 함수들
function calculateModulus(degree) {
    // q ≡ 1 mod 2n
    return 12289; // Fixed modulus for FALCON
}

function calculateSecurityLevel(degree) {
    return degree === '512' ? 128 : 256;
}

function calculateCompressionRate(signatureSize) {
    const baseSize = document.getElementById('degree-select').value;
    return baseSize / signatureSize;
}

function showProgress(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML += `
        <div class="progress-indicator">
            <p>${message}</p>
            <div class="progress-bar">
                <div class="progress" style="width: 50%"></div>
            </div>
        </div>
    `;
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML += `
            <div class="status-badge success">
                <i class="fas fa-check"></i> ${message}
            </div>
        `;
    }
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'status-badge error';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const outputSection = document.querySelector('.output-section');
    if (outputSection) {
        outputSection.appendChild(errorElement);
    }
}

function showVerificationResult(isValid, time) {
    const resultDiv = document.getElementById('verification-result');
    resultDiv.className = `verification-result ${isValid ? 'valid' : 'invalid'}`;
    resultDiv.innerHTML = `
        <i class="fas fa-${isValid ? 'check-circle' : 'times-circle'}"></i>
        <span>${isValid ? 'Valid' : 'Invalid'} signature (${time.toFixed(2)}ms)</span>`;
}

// 파일 처리 함수들
function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('message').value = e.target.result;
        };
        reader.readAsText(file);
    }
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    initializeWasm();
    selectMode('normal');

    // 파일 입력 처리
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileInput);
    }

    // 창 크기 변경 시 격자 시각화 업데이트
    window.addEventListener('resize', () => {
        updateLatticeVisualization(document.getElementById('degree-select').value);
    });
});