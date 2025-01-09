// assets/js/algorithms/kyber.js

let wasmModule = null;

// WASM 모듈 초기화
async function initializeWasm() {
    try {
        const loader = new WasmLoader('../assets/wasm/kyber.wasm');
        wasmModule = await loader.initialize();
        updateParameterInfo();
        console.log('Kyber WASM module initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Kyber WASM module:', error);
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
        const seed = document.getElementById('seed').value;

        // UI 업데이트
        showProgress('keygen-status', 'Generating keys...');

        // WASM 함수 호출
        const result = await wasmModule.crypto_kem_keypair(securityLevel, seed);

        // 결과 표시
        document.getElementById('public-key').textContent = result.publicKey;
        document.getElementById('private-key').textContent = result.privateKey;

        showSuccess('keygen-status', 'Keys generated successfully');
        updateParameterInfo();
    } catch (error) {
        console.error('Key generation failed:', error);
        showError('Key generation failed: ' + error.message);
    }
}

// Encapsulation 함수
async function encapsulate() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        const publicKey = document.getElementById('encap-public-key').value;
        
        if (!publicKey) {
            showError('Please enter a public key');
            return;
        }

        // WASM 함수 호출
        const result = await wasmModule.crypto_kem_enc(publicKey);

        // 결과 표시
        document.getElementById('ciphertext').textContent = result.ciphertext;
        document.getElementById('shared-secret-encap').textContent = result.sharedSecret;

        showSuccess('encap-output', 'Encapsulation successful');
    } catch (error) {
        console.error('Encapsulation failed:', error);
        showError('Encapsulation failed: ' + error.message);
    }
}

// Decapsulation 함수
async function decapsulate() {
    if (!wasmModule) {
        showError('WASM module not initialized');
        return;
    }

    try {
        const privateKey = document.getElementById('decap-private-key').value;
        const ciphertext = document.getElementById('decap-ciphertext').value;

        if (!privateKey || !ciphertext) {
            showError('Please enter both private key and ciphertext');
            return;
        }

        // WASM 함수 호출
        const sharedSecret = await wasmModule.crypto_kem_dec(privateKey, ciphertext);

        // 결과 표시
        document.getElementById('shared-secret-decap').textContent = sharedSecret;

        showSuccess('decap-output', 'Decapsulation successful');
    } catch (error) {
        console.error('Decapsulation failed:', error);
        showError('Decapsulation failed: ' + error.message);
    }
}

// 파라미터 정보 업데이트
function updateParameterInfo() {
    const securityLevel = document.getElementById('security-level').value;
    const params = getKyberParameters(securityLevel);

    document.getElementById('param-n').textContent = params.n;
    document.getElementById('param-k').textContent = params.k;
    document.getElementById('param-q').textContent = params.q;
    document.getElementById('param-eta').textContent = params.eta;
}

// Kyber 파라미터 가져오기
function getKyberParameters(securityLevel) {
    const params = {
        kyber512: { n: 256, k: 2, q: 3329, eta: 2 },
        kyber768: { n: 256, k: 3, q: 3329, eta: 2 },
        kyber1024: { n: 256, k: 4, q: 3329, eta: 2 }
    };
    return params[securityLevel];
}

// UI 헬퍼 함수들
function showProgress(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="status-badge">
            <i class="fas fa-spinner fa-spin"></i> ${message}
        </div>
        <div class="progress-bar">
            <div class="progress" style="width: 50%"></div>
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
    // 에러 메시지를 표시할 요소 찾기
    const errorElement = document.querySelector('.error-message') || 
                        document.createElement('div');
    errorElement.className = 'status-badge error';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    // 적절한 위치에 에러 메시지 추가
    const outputSection = document.querySelector('.output-section');
    if (outputSection && !document.querySelector('.error-message')) {
        outputSection.prepend(errorElement);
    }
}

// 페이지 로드 시 WASM 초기화
document.addEventListener('DOMContentLoaded', initializeWasm);

// 보안 레벨 변경 시 파라미터 업데이트
document.getElementById('security-level').addEventListener('change', updateParameterInfo);