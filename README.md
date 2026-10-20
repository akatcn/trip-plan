# 🗾 여행 계획 (trip-plan)

친구들과 일본 여행 계획을 함께 보고 고치는 웹앱입니다. 별도 서버 없이 **GitHub Pages(화면) + Firebase Firestore(데이터)** 로 동작하고, **4자리 비밀번호(PIN)** 만 알면 들어올 수 있습니다.

- 📅 날짜별 일정 (시간·장소, 구글 지도 링크)
- 🏨 숙소 (체크인/아웃, 주소, 예약 정보)
- 💴 경비 (엔화 입력, 원화 환산, 누가 누구에게 얼마 보낼지 자동 정산)
- ✅ 준비물·할 일 체크리스트 (담당자 지정)
- 📝 자유 메모
- 한 명이 고치면 다른 사람 화면에도 바로 반영

## 비밀번호는 어떻게 동작하나요?

PIN을 입력하면 브라우저에서 두 값을 만듭니다(PBKDF2).

1. **저장 위치(문서 ID)** — PIN을 모르면 데이터가 어디 있는지 알 수 없습니다.
2. **암호화 키(AES-GCM)** — Firestore에는 암호화된 내용만 올라가서, 저장소를 직접 들여다봐도 내용을 읽을 수 없습니다.

PIN이 다르면 완전히 다른 여행이 열립니다. 처음 쓰는 PIN을 입력하면 새 여행을 만들지 물어봅니다.

> ⚠️ 4자리 PIN은 1만 가지뿐이라 작정하고 대입하면 풀립니다. 친구끼리 일정 공유용으로만 쓰고, 여권 번호나 카드 정보는 넣지 마세요.

## 설정 방법 (한 번만)

### 1. Firebase 준비 (무료)

1. <https://console.firebase.google.com> 에서 **프로젝트 추가** (Google Analytics는 꺼도 됩니다).
2. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
   - 위치: `asia-northeast3 (서울)` 추천
   - **프로덕션 모드**로 시작
3. Firestore의 **규칙** 탭에 이 저장소의 [`firestore.rules`](firestore.rules) 내용을 붙여 넣고 **게시**.
4. **프로젝트 설정(⚙️) → 내 앱 → 웹(`</>`)** 으로 앱을 등록하고, 나오는 `firebaseConfig` 값을 [`js/config.js`](js/config.js)에 붙여 넣고 커밋합니다.

### 2. GitHub Pages 켜기

리포지토리 **Settings → Pages → Build and deployment**
- Source: **Deploy from a branch**
- Branch: **main** / **(root)** → Save

잠시 뒤 `https://akatcn.github.io/trip-plan/` 에서 열립니다. 친구들에게 주소와 PIN만 알려주면 끝!

## 체험 모드

`js/config.js`의 `apiKey`가 비어 있으면 데이터가 **이 브라우저에만** 저장됩니다. Firebase 설정 전에 화면을 미리 보거나 혼자 테스트할 때 쓰세요.

로컬에서 실행하려면:

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html`, `css/style.css` | 화면 |
| `js/app.js` | 화면 그리기, 편집, 정산 계산 |
| `js/crypto.js` | PIN → 저장 위치 + 암호화 키 |
| `js/store.js` | Firestore / 체험 모드 저장 |
| `js/config.js` | Firebase 설정값 |
| `firestore.rules` | Firestore 보안 규칙 |
