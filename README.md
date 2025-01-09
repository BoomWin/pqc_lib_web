# 양자내성암호(PQC) 웹 구현 프로젝트

양자내성암호(Post-Quantum Cryptography, PQC) 알고리즘을 웹 환경에서 구현한 프로젝트입니다. C언어로 구현된 암호화 라이브러리를 WebAssembly를 통해 웹 브라우저에서 직접 실행할 수 있도록 구현하였습니다.

![image](https://github.com/user-attachments/assets/0955642f-ea19-48f1-bb23-dfa775951caf)




## 🌟 주요 기능

### 암호화 알고리즘
- **Kyber**: 격자 기반 키 캡슐화 메커니즘 (KEM)
- **Dilithium**: 격자 기반 전자서명 방식
- **FALCON**: FFT 기반 격자 서명 방식
- **SPHINCS+**: 해시 기반 서명 방식

### 핵심 연산 시각화
- 행렬 연산
- NTT(Number Theoretic Transform) 변환
- 다양한 샘플링 방식

## 🏗️ 프로젝트 구조

```
assets/
├── css/
│   ├── algorithms/         # 알고리즘별 스타일
│   ├── main.css           # 공통 스타일
│   └── navigation.css     # 네비게이션 스타일
├── js/
│   ├── algorithms/        # 알고리즘 구현
│   ├── main.js           # 핵심 기능
│   ├── operation.js      # 수학적 연산
│   └── wasm-loader.js    # WebAssembly 로더
├── wasm/                 # 컴파일된 WebAssembly 모듈
└── pages/               # 각 컴포넌트별 HTML 페이지
```

## 🔧 구현 방식

### 현재 구현: WebAssembly 기반
- C언어로 구현된 PQC 알고리즘을 WebAssembly로 컴파일
- 브라우저에서 직접 암호화 연산 수행
- 네이티브 수준의 성능 제공

### 고려 중인 대체 구현 방식
1. **서버 기반 처리**:
   - REST API를 통한 암호화 연산
   - 클라이언트 부하 감소
   - 보안성 강화

2. **순수 JavaScript 구현**:
   - 디버깅 용이성
   - 브라우저 최적화
   - 배포 프로세스 단순화

3. **하이브리드 방식**:
   - 핵심 연산은 WebAssembly로 처리
   - UI/UX는 JavaScript로 구현
   - 성능과 유지보수성의 균형

## 🚀 시작하기

1. **필수 요구사항**:
   ```
   - WebAssembly를 지원하는 모던 웹 브라우저
   - Node.js와 npm
   - WebAssembly 컴파일을 위한 Emscripten
   ```

2. **설치 방법**:
   ```bash
   # 저장소 클론
   git clone [repository-url]

   # 의존성 설치
   npm install

   # WebAssembly 모듈 컴파일
   make wasm
   ```

3. **개발 서버 실행**:
   ```bash
   npm run dev
   ```

## 💻 주요 구성 요소

### 1. 암호화 알고리즘
- 키 생성
- 암호화/서명
- 복호화/검증
- 파라미터 관리
- 성능 측정

### 2. WebAssembly 통합
- WASM 모듈 로더
- 메모리 관리
- 에러 처리
- 성능 최적화

### 3. 시각화 도구
- 수학적 연산 시각화
- 실시간 알고리즘 동작 표현
- 성능 메트릭 표시

## 🛠️ 개발 가이드

### 코드 구조
- 모듈식 설계로 유지보수 용이성 확보
- 암호화 연산과 UI 로직 분리
- 일관된 에러 처리와 로깅
- 상세한 문서화

### 개발 원칙
- 보안 가이드라인 준수
- 성능 최적화
- 크로스 브라우저 호환성
- 접근성 고려

## 🔐 보안 고려사항

- 표준 보안 사례 준수
- 정기적인 보안 감사 권장
- 프로덕션 환경에서는 서버 측 검증 고려
- WebAssembly 모듈 및 종속성 최신화 유지

## 🤝 기여하기

1. 저장소 포크
2. 기능 브랜치 생성
3. 변경사항 커밋
4. 브랜치에 푸시
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 [라이선스명]에 따라 라이선스가 부여됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

## 🙏 감사의 말

- PQC 연구 커뮤니티
- WebAssembly 개발 팀
- 오픈소스 암호화 프로젝트
- 기여자 및 유지관리자
