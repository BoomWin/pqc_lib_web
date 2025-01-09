// assets/js/algorithms/sphincs.js

let wasmModule = null;
let currentHash = 'sha256';
let treeVisualization = null;

// WASM 모듈 초기화
async function initializeWasm() {
    try {
        const loader = new WasmLoader('../assets/wasm/sphincs.wasm');
        wasmModule = await loader.initialize();
        console.log('SPHINCS+ WASM module initialized successfully');
        updateParameters();
    } catch (error) {
        console.error('Failed to initialize SPHINCS+ WASM module:', error);
        showError('WASM initialization failed');
    }
}

// 해시 함수 선택
function selectHash(hash) {
    currentHash = hash;
    document.querySelectorAll('.hash-option').forEach(option => {
        option.classList.remove('active');
    });
    document.getElementById(`${hash}-option`).classList.add('active');
    updateParameters();
}

// 파라미터 업데이트
function updateParameters() {
    const securityLevel = document.getElementById('security-level').value;
    const treeHeight = document.getElementById('tree-height').value;
    
    // 머클 트리 시각화 업데이트
    updateTreeVisualization(treeHeight);
    
    // SPHINCS+ 파라미터 업데이트
    if (wasmModule) {
        wasmModule.update_parameters({
            security_level: parseInt(securityLevel),
            hash_function: currentHash,
            tree_height: parseInt(treeHeight)
        });
    }
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
        const message = document.getElementById('message-input').value;
        const privateKey = document.getElementById('private-key').textContent;

        if (!message || !privateKey) {
            showError('Please provide both message and private key');
            return;
        }

        showProgress('signature-output', 'Generating signature...');
        
        const startTime = performance.now();
        const signature = await wasmModule.crypto_sign(privateKey, message);
        const endTime = performance.now();

        document.getElementById('signature').textContent = signature;
        document.getElementById('signature-size').textContent = `${(signature.length / 2).toFixed(2)} bytes`;
        document.getElementById('generation-time').textContent = `${(endTime - startTime).toFixed(2)}ms`;
        document.getElementById('tree-layers').textContent = calculateTreeLayers(signature);

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

        const verificationTime = (endTime - startTime).toFixed(2);

        showVerificationResult(isValid, verificationTime);
    } catch (error) {
        console.error('Signature verification failed:', error);
        showError('Verification failed: ' + error.message);
    }
}

// 머클 트리 시각화
function updateTreeVisualization(height) {
    const treeContainer = document.getElementById('merkle-tree');
    treeContainer.innerHTML = '';

    const width = treeContainer.clientWidth;
    const height = 400;
    const maxLevels = 5; // 시각화할 최대 레벨 수

    const svg = d3.select('#merkle-tree')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // 트리 데이터 생성
    const treeData = generateTreeData(maxLevels);

    // 트리 레이아웃 설정
    const treeLayout = d3.tree()
        .size([width - 100, height - 60]);

    // 데이터를 계층 구조로 변환
    const root = d3.hierarchy(treeData);
    
    // 레이아웃 적용
    const tree = treeLayout(root);

    // 노드와 링크 그리기
    drawTreeLinks(svg, tree);
    drawTreeNodes(svg, tree);
}

// 트리 데이터 생성
function generateTreeData(levels, currentLevel = 0) {
    if (currentLevel >= levels) return null;

    return {
        name: `L${currentLevel}`,
        children: [
            generateTreeData(levels, currentLevel + 1),
            generateTreeData(levels, currentLevel + 1)
        ].filter(Boolean)
    };
}

// 트리 링크 그리기
function drawTreeLinks(svg, tree) {
    svg.selectAll('.link')
        .data(tree.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y))
        .style('fill', 'none')
        .style('stroke', '#4f46e5')
        .style('stroke-width', '1.5px');
}

// 트리 노드 그리기
function drawTreeNodes(svg, tree) {
    const nodes = svg.selectAll('.node')
        .data(tree.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodes.append('circle')
        .attr('r', 6)
        .style('fill', '#4f46e5')
        .style('stroke', 'white')
        .style('stroke-width', '2px');

    nodes.append('text')
        .attr('dy', '0.31em')
        .attr('x', d => d.children ? -8 : 8)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name)
        .style('font-size', '12px')
        .style('fill', '#1e293b');
}

// 유틸리티 함수들
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
        <span>${isValid ? 'Valid' : 'Invalid'} signature (${time}ms)</span>
    `;
}

function calculateTreeLayers(signature) {
    // 서명 크기를 기반으로 사용된 트리 레이어 수 계산
    const treeHeight = document.getElementById('tree-height').value;
    return Math.ceil(treeHeight / 5); // 예시 계산
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeWasm();
    selectHash('sha256');
    
    // 파일 입력 처리
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileInput);
    }

    // 드래그 앤 드롭 처리
    const dropZone = document.querySelector('.file-upload-label');
    if (dropZone) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('drop', handleDrop);
    }
});

// 파일 처리 함수들
function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
        readFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        readFile(file);
    }
}

function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('message-input').value = e.target.result;
    };
    reader.readAsText(file);
}