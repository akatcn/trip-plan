// 저장소: Firebase 설정이 있으면 Firestore(실시간 공유), 없으면 localStorage(체험 모드).
// 어느 쪽이든 암호화된 { iv, data } 만 저장한다.
import { firebaseConfig } from "./config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2";

export const isShared = Boolean(firebaseConfig.apiKey);

let db = null;
let fs = null;

async function initFirestore() {
  if (db) return;
  const { initializeApp } = await import(`${FB}/firebase-app.js`);
  fs = await import(`${FB}/firebase-firestore.js`);
  db = fs.getFirestore(initializeApp(firebaseConfig));
}

export async function load(tripId) {
  if (!isShared) {
    const raw = localStorage.getItem(`trip:${tripId}`);
    return raw ? JSON.parse(raw) : null;
  }
  await initFirestore();
  const snap = await fs.getDoc(fs.doc(db, "trips", tripId));
  return snap.exists() ? snap.data() : null;
}

export async function save(tripId, payload) {
  if (!isShared) {
    localStorage.setItem(`trip:${tripId}`, JSON.stringify(payload));
    return;
  }
  await initFirestore();
  await fs.setDoc(fs.doc(db, "trips", tripId), payload);
}

// 다른 사람이 수정하면 콜백 호출. 해제 함수를 돌려준다.
export async function watch(tripId, onChange) {
  if (!isShared) {
    const handler = (e) => {
      if (e.key === `trip:${tripId}` && e.newValue) onChange(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
  await initFirestore();
  return fs.onSnapshot(fs.doc(db, "trips", tripId), (snap) => {
    if (snap.exists() && !snap.metadata.hasPendingWrites) onChange(snap.data());
  });
}
