// PQC 연산을 위한 WebAssembly 모듈
let wasmModule = null;

// WebAssembly 모듈 초기화
async function initWasm() {
    try {
        const response = await fetch('/assets/wasm/operation.wasm');
        const wasmBytes = await response.arrayBuffer();
        const wasmInstance = await WebAssembly.instantiate(wasmBytes, {
            env: {
                memory: new WebAssembly.Memory({ initial: 256 }),
                abort: () => { throw new Error('WASM 실행 중 오류 발생'); }
            }
        });
        wasmModule = wasmInstance.instance.exports;
        console.log('WASM 모듈 로드 완료');
        return true;
    } catch (error) {
        console.error('WASM 모듈 로드 실패:', error);
        return false;
    }
}

// 행렬 연산 클래스
class MatrixOperations {
    // 행렬 생성
    static createMatrix(rows, cols, values = null) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push(values ? values[i * cols + j] : Math.floor(Math.random() * 10));
            }
            matrix.push(row);
        }
        return matrix;
    }

    // 행렬 곱셈
    static async multiply(matrixA, matrixB) {
        const rowsA = matrixA.length;
        const colsA = matrixA[0].length;
        const colsB = matrixB[0].length;

        // 입력 검증
        if (colsA !== matrixB.length) {
            throw new Error('행렬 크기가 맞지 않습니다.');
        }

        try {
            // 1차원 배열로 변환
            const flatA = matrixA.flat();
            const flatB = matrixB.flat();

            // WASM 메모리 할당
            const ptrA = wasmModule.malloc(flatA.length * 4);
            const ptrB = wasmModule.malloc(flatB.length * 4);
            const ptrC = wasmModule.malloc(rowsA * colsB * 4);

            // 데이터 복사
            new Int32Array(wasmModule.memory.buffer, ptrA, flatA.length).set(flatA);
            new Int32Array(wasmModule.memory.buffer, ptrB, flatB.length).set(flatB);

            // C 함수 호출
            wasmModule.matrix_multiply(ptrA, ptrB, ptrC, rowsA, colsA, colsB);

            // 결과 읽기
            const result = new Int32Array(wasmModule.memory.buffer, ptrC, rowsA * colsB);
            const resultMatrix = this.createMatrix(rowsA, colsB, Array.from(result));

            // 메모리 해제
            wasmModule.free(ptrA);
            wasmModule.free(ptrB);
            wasmModule.free(ptrC);

            return resultMatrix;
        } catch (error) {
            throw new Error('행렬 곱셈 중 오류 발생: ' + error.message);
        }
    }

    // 전치 행렬
    static transpose(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const result = Array(cols).fill().map(() => Array(rows));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[j][i] = matrix[i][j];
            }
        }
        return result;
    }
}

// NTT 연산 클래스
class NTTOperations {
    // NTT 변환
    static async transform(polynomial, degree, modulus) {
        try {
            // 입력 검증
            if (polynomial.length !== degree) {
                throw new Error('다항식 크기가 맞지 않습니다.');
            }

            // WASM 메모리 할당
            const inputPtr = wasmModule.malloc(degree * 4);
            const outputPtr = wasmModule.malloc(degree * 4);

            // 데이터 복사
            new Int32Array(wasmModule.memory.buffer, inputPtr, degree).set(polynomial);

            // NTT 변환 수행
            wasmModule.ntt_transform(inputPtr, outputPtr, degree, modulus);

            // 결과 읽기
            const result = Array.from(new Int32Array(wasmModule.memory.buffer, outputPtr, degree));

            // 메모리 해제
            wasmModule.free(inputPtr);
            wasmModule.free(outputPtr);

            return result;
        } catch (error) {
            throw new Error('NTT 변환 중 오류 발생: ' + error.message);
        }
    }

    // 역 NTT 변환
    static async inverseTransform(polynomial, degree, modulus) {
        try {
            const inputPtr = wasmModule.malloc(degree * 4);
            const outputPtr = wasmModule.malloc(degree * 4);

            new Int32Array(wasmModule.memory.buffer, inputPtr, degree).set(polynomial);
            wasmModule.intt_transform(inputPtr, outputPtr, degree, modulus);

            const result = Array.from(new Int32Array(wasmModule.memory.buffer, outputPtr, degree));

            wasmModule.free(inputPtr);
            wasmModule.free(outputPtr);

            return result;
        } catch (error) {
            throw new Error('역 NTT 변환 중 오류 발생: ' + error.message);
        }
    }
}

// 샘플링 연산 클래스
class SamplingOperations {
    // 균일 분포 샘플링
    static async uniformSampling(count, min, max) {
        try {
            const outputPtr = wasmModule.malloc(count * 4);
            wasmModule.uniform_sampling(outputPtr, count, min, max);
            
            const result = Array.from(new Int32Array(wasmModule.memory.buffer, outputPtr, count));
            wasmModule.free(outputPtr);
            
            return result;
        } catch (error) {
            throw new Error('균일 분포 샘플링 중 오류 발생: ' + error.message);
        }
    }

    // 가우시안 분포 샘플링
    static async gaussianSampling(count, mean, stddev) {
        try {
            const outputPtr = wasmModule.malloc(count * 4);
            wasmModule.gaussian_sampling(outputPtr, count, mean, Math.floor(stddev * 1000));
            
            const result = Array.from(new Int32Array(wasmModule.memory.buffer, outputPtr, count));
            wasmModule.free(outputPtr);
            
            return result;
        } catch (error) {
            throw new Error('가우시안 분포 샘플링 중 오류 발생: ' + error.message);
        }
    }

    // 이항 분포 샘플링
    static async binomialSampling(count, n, p) {
        try {
            const outputPtr = wasmModule.malloc(count * 4);
            wasmModule.binomial_sampling(outputPtr, count, n, Math.floor(p * 1000));
            
            const result = Array.from(new Int32Array(wasmModule.memory.buffer, outputPtr, count));
            wasmModule.free(outputPtr);
            
            return result;
        } catch (error) {
            throw new Error('이항 분포 샘플링 중 오류 발생: ' + error.message);
        }
    }
}

// 결과 시각화 함수들
const Visualization = {
    // 행렬 결과 표시
    displayMatrix(matrix, containerId) {
        const container = document.getElementById(containerId);
        let html = '<table class="matrix-table">';
        
        matrix.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        container.innerHTML = html;
    },

    // NTT 결과 시각화
    displayNTTResult(original, transformed, containerId) {
        const container = document.getElementById(containerId);
        
        // Plotly 그래프 데이터
        const data = [
            {
                y: original,
                type: 'scatter',
                name: '원본'
            },
            {
                y: transformed,
                type: 'scatter',
                name: 'NTT 변환'
            }
        ];

        const layout = {
            title: 'NTT 변환 결과',
            height: 400,
            margin: { t: 30, l: 30, r: 30, b: 30 }
        };

        Plotly.newPlot(containerId, data, layout);
    },

    // 샘플링 결과 시각화
    displaySamplingResult(samples, method, containerId) {
        const container = document.getElementById(containerId);
        
        const data = [{
            x: samples,
            type: 'histogram',
            name: method
        }];

        const layout = {
            title: `${method} 분포 샘플링 결과`,
            height: 400,
            margin: { t: 30, l: 30, r: 30, b: 30 }
        };

        Plotly.newPlot(containerId, data, layout);
    }
};

// 이벤트 핸들러 설정
document.addEventListener('DOMContentLoaded', async () => {
    // WASM 모듈 초기화
    const initialized = await initWasm();
    if (!initialized) {
        alert('PQC 연산 모듈을 로드하는데 실패했습니다.');
        return;
    }

    // Matrix Operations 이벤트 설정
    document.getElementById('generate-matrices')?.addEventListener('click', () => {
        const rows = parseInt(document.getElementById('matrixA').value);
        const cols = parseInt(document.getElementById('matrixB').value);

        const matrixA = MatrixOperations.createMatrix(rows, cols);
        const matrixB = MatrixOperations.createMatrix(cols, cols);

        Visualization.displayMatrix(matrixA, 'matrixA');
        Visualization.displayMatrix(matrixB, 'matrixB');
    });

    document.getElementById('matrix-multiply')?.addEventListener('click', async () => {
        try {
            const matrixA = getMatrixFromDisplay('matrixA');
            const matrixB = getMatrixFromDisplay('matrixB');
            
            const result = await MatrixOperations.multiply(matrixA, matrixB);
            Visualization.displayMatrix(result, 'matrix-result');
        } catch (error) {
            alert(error.message);
        }
    });

    // NTT Transform 이벤트 설정
    document.getElementById('perform-ntt')?.addEventListener('click', async () => {
        try {
            const degree = parseInt(document.getElementById('polynomial-degree').value);
            const input = document.getElementById('polynomial-input').value
                .split(' ')
                .map(x => parseInt(x.trim()));

            const nttResult = await NTTOperations.transform(input, degree, 3329);
            const inttResult = await NTTOperations.inverseTransform(nttResult, degree, 3329);

            Visualization.displayNTTResult(input, nttResult, 'ntt-visualization');
        } catch (error) {
            alert(error.message);
        }
    });

    // Sampling 이벤트 설정
    document.getElementById('generate-samples')?.addEventListener('click', async () => {
        try {
            const method = document.getElementById('distribution-type').value;
            const count = parseInt(document.getElementById('sample-count').value);

            let samples;
            switch (method) {
                case 'uniform':
                    samples = await SamplingOperations.uniformSampling(count, 0, 100);
                    break;
                case 'gaussian':
                    samples = await SamplingOperations.gaussianSampling(count, 0, 1);
                    break;
                case 'binomial':
                    samples = await SamplingOperations.binomialSampling(count, 10, 0.5);
                    break;
            }

            Visualization.displaySamplingResult(samples, method, 'sampling-visualization');
        } catch (error) {
            alert(error.message);
        }
    });
});

// 유틸리티 함수
function getMatrixFromDisplay(containerId) {
    const table = document.querySelector(`#${containerId} table`);
    const matrix = [];
    
    table.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => {
            rowData.push(parseInt(cell.textContent));
        });
        matrix.push(rowData);
    });
    
    return matrix;
}