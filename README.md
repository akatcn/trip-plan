# 🗾 일본 여행 계획 (trip-plan)

용훈 · 성진 · 현준이 일본 여행 계획을 함께 쌓아 가는 대시보드입니다. 별도 서버 없이 **GitHub Pages(화면) + Firebase Firestore(데이터)** 로 동작하고, **비밀번호** 하나로만 들어올 수 있습니다.

- **백로그**: 1~4일차를 골라 블록(작성자, 제목, 장소, 비용, 내용)을 추가하고, 끌어서 순서를 바꾸고, 옵션 메뉴로 편집·삭제
- **지도**: 선택한 날의 장소를 백로그 순서대로 보여 주고, 구글 지도로 하루 경로 열기
- 한 명이 고치면 다른 사람 화면에도 바로 반영
- UI는 [shadcn/ui](https://ui.shadcn.com) 컴포넌트만 사용 (React + Vite + Tailwind CSS)

## 비밀번호는 어떻게 동작하나요?

비밀번호는 코드에 들어 있지 않습니다. 입력한 값에서 브라우저가 PBKDF2로 세 가지 값을 만듭니다.

1. **확인값**: 코드에 있는 값과 같아야 입장할 수 있습니다.
2. **저장 위치**: Firestore 경로(`trips/{저장 위치}/blocks`)라서 비밀번호를 모르면 데이터가 어디 있는지 알 수 없습니다.
3. **암호화 키(AES-GCM)**: Firestore에는 암호문만 올라가서 저장소를 직접 봐도 내용을 읽을 수 없습니다.

한 번 들어온 기기에서는 다시 묻지 않습니다. 사이드바의 **나가기**를 누르면 잊어버립니다.

> ⚠️ 비밀번호를 바꾸려면 `src/lib/crypto.ts`의 `VERIFIER` 값을 다시 계산해야 하고, 기존 데이터는 새 비밀번호로 열리지 않습니다.

## 배포 설정 (한 번만)

1. **Firestore 규칙**: Firebase 콘솔 → Firestore Database → **규칙** 탭에 [`firestore.rules`](firestore.rules) 내용을 붙여 넣고 **게시**.
2. **GitHub Pages**: 리포지토리 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꾸기.

이후 `main`에 머지될 때마다 자동으로 빌드되어 `https://akatcn.github.io/trip-plan/` 에 배포됩니다.

## 로컬에서 실행

```bash
npm install
npm run dev                      # Firestore에 연결
VITE_LOCAL_STORE=1 npm run dev   # 이 브라우저(localStorage)에만 저장하는 테스트 모드
```

## 파일 구성

| 경로 | 역할 |
| --- | --- |
| `src/App.tsx` | 로그인 상태, 대시보드 레이아웃 |
| `src/components/app-sidebar.tsx` | 좌측 네비게이션 |
| `src/components/backlog.tsx` | 백로그 테이블, 순서 변경, 편집·삭제 |
| `src/components/block-dialog.tsx` | 블록 추가·편집 다이얼로그 |
| `src/components/map-view.tsx` | 지도 탭 |
| `src/components/ui/` | shadcn/ui 컴포넌트 |
| `src/lib/crypto.ts` | 비밀번호 확인, 암호화 |
| `src/lib/store.ts` | Firestore 저장 |
| `firestore.rules` | Firestore 보안 규칙 |
