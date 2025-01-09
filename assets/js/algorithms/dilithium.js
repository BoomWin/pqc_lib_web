// assets/js/algorithms/dilithium.js

let wasmModule = null;
let currentInputMethod = 'text';

// WASM 모듈 초기화
async function initializeWasm() {
    try {
        const loader = new WasmLoader('../assets/wasm/dilithium.wasm');
        wasmModule = await loader.initialize();
        updateParameterInfo();
        console.log('Dilithium WASM module initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Dilithium WASM module:', error);
        showError('WASM initialization failed');
    }
}

// 키 생성 함수
async function generateKeys() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        const securityLevel = document.getElementById('security-level').value;
        showProgress('keygen-output', 'Generating key pair...');

        const startTime = performance.now();
        const result = await wasmModule.crypto_sign_keypair(securityLevel);
        const endTime = performance.now();

        document.getElementById('public-key').textContent = result.publicKey;
        document.getElementById('private-key').textContent = result.privateKey;

        showSuccess('keygen-output', `Keys generated successfully (${(endTime - startTime).toFixed(2)}ms)`);
        updateParameterInfo();
    } catch (error) {
        console.error('Key generation failed:', error);
        showError('Key generation failed: ' + error.message);
    }
}

// 서명 생성 함수
async function signMessage() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        const privateKey = document.getElementById('private-key-sign').value;
        let message;

        if (currentInputMethod === 'text') {
            message = document.getElementById('message').value;
        } else {
            const fileInput = document.getElementById('file-input');
            if (!fileInput.files[0]) {
                showError('Please select a file');
                return;
            }
            message = await readFile(fileInput.files[0]);
        }

        if (!privateKey || !message) {
            showError('Please provide both private key and message');
            return;
        }

        showProgress('signature-output', 'Generating signature...');
        
        const startTime = performance.now();
        const signature = await wasmModule.crypto_sign(privateKey, message);
        const endTime = performance.now();

        document.getElementById('signature').textContent = signature;
        
        // 서명 정보 업데이트
        document.getElementById('signature-size').textContent = `${(signature.length / 2).toFixed(2)} bytes`;
        document.getElementById('signature-time').textContent = `${(endTime - startTime).toFixed(2)}ms`;

        showSuccess('signature-output', 'Signature generated successfully');
    } catch (error) {
        console.error('Signature generation failed:', error);
        showError('Signature generation failed: ' + error.message);
    }
}

// 서명 검증 함수
async function verifySignature() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        const publicKey = document.getElementById('public-key-verify').value;
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

        if (isValid) {
            showVerificationResult(true, `Signature verified successfully (${verificationTime}ms)`);
        } else {
            showVerificationResult(false, `Invalid signature (${verificationTime}ms)`);
        }
    } catch (error) {
        console.error('Signature verification failed:', error);
        showError('Verification failed: ' + error.message);
    }
}

// 입력 방식 전환
function toggleInputMethod(method) {
    currentInputMethod = method;
    const textSection = document.getElementById('text-input-section');
    const fileSection = document.getElementById('file-input-section');
    const textButton = document.getElementById('text-input-btn');
    const fileButton = document.getElementById('file-input-btn');

    if (method === 'text') {
        textSection.style.display = 'block';
        fileSection.style.display = 'none';
        textButton.classList.add('active');
        fileButton.classList.remove('active');
    } else {
        textSection.style.display = 'none';
        fileSection.style.display = 'block';
        textButton.classList.remove('active');
        fileButton.classList.add('active');
    }
}

// 파일 읽기 함수
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

// 파라미터 정보 업데이트
function updateParameterInfo() {
    const securityLevel = document.getElementById('security-level').value;
    const params = getDilithiumParameters(securityLevel);

    document.getElementById('param-n').textContent = params.n;
    document.getElementById('param-q').textContent = params.q;
    document.getElementById('param-d').textContent = params.d;
    document.getElementById('param-tau').textContent = params.tau;
}

// Dilithium 파라미터 가져오기
function getDilithiumParameters(securityLevel) {
    const params = {
        dilithium2: { n: 256, q: 8380417, d: 13, tau: 39 },
        dilithium3: { n: 256, q: 8380417, d: 13, tau: 49 },
        dilithium5: { n: 256, q: 8380417, d: 13, tau: 60 }
    };
    return params[securityLevel];
}

// UI 헬퍼 함수들
function showProgress(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML += `
        <div class="progress-indicator">
            <i class="fas fa-spinner fa-spin"></i> ${message}
            <div class="progress-bar">
                <div class="progress" style="width: 50%"></div>
            </div>
        </div>
    `;
}

function showVerificationResult(isValid, message) {
    const resultDiv = document.getElementById('verification-result');
    resultDiv.className = `verification-result ${isValid ? 'valid' : 'invalid'}`;
    resultDiv.innerHTML = `
        <i class="fas fa-${isValid ? 'check-circle' : 'times-circle'}"></i>
        <span>${message}</span>
    `;
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML += `
        <div class="status-badge success">
            <i class="fas fa-check"></i> ${message}
        </div>
    `;
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

// 클립보드에 복사
async function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    try {
        await navigator.clipboard.writeText(text);
        showSuccess(elementId, 'Copied to clipboard');
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    initializeWasm();
    document.getElementById('security-level').addEventListener('change', updateParameterInfo);
    
    // 파일 입력 처리
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || 'No file selected';
            e.target.parentElement.querySelector('span').textContent = fileName;
        });
    }
});