// 블록 저장소. 블록 하나가 문서 하나이고, 내용은 모두 암호화되어 저장된다.
// trips/{tripId}/blocks/{blockId} = { iv, data }
// 개발 중에는 VITE_LOCAL_STORE=1 로 브라우저 localStorage만 쓸 수 있다.
import { initializeApp } from "firebase/app"
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  writeBatch,
} from "firebase/firestore"
import { decrypt, encrypt, type Encrypted, type Session } from "./crypto"
import { firebaseConfig } from "./firebase-config"
import type { Block } from "./types"

type Unsubscribe = () => void

export interface Store {
  watch(onChange: (blocks: Block[]) => void): Unsubscribe
  put(blocks: Block[]): Promise<void>
  remove(id: string): Promise<void>
}

async function decryptAll(s: Session, payloads: Encrypted[]) {
  const out: Block[] = []
  for (const p of payloads) {
    try {
      out.push(await decrypt<Block>(s.key, p))
    } catch {
      // 다른 키로 만든 문서는 무시
    }
  }
  return out
}

function firestoreStore(s: Session): Store {
  const db = getFirestore(initializeApp(firebaseConfig))
  const col = collection(db, "trips", s.tripId, "blocks")
  return {
    watch(onChange) {
      return onSnapshot(col, async (snap) => {
        onChange(await decryptAll(s, snap.docs.map((d) => d.data() as Encrypted)))
      })
    },
    async put(blocks) {
      const batch = writeBatch(db)
      for (const b of blocks) batch.set(doc(col, b.id), await encrypt(s.key, b))
      await batch.commit()
    },
    async remove(id) {
      await deleteDoc(doc(col, id))
    },
  }
}

function localStore(s: Session): Store {
  const k = `blocks:${s.tripId}`
  const read = (): Record<string, Encrypted> => JSON.parse(localStorage.getItem(k) || "{}")
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((f) => f())
  return {
    watch(onChange) {
      const f = async () => onChange(await decryptAll(s, Object.values(read())))
      listeners.add(f)
      window.addEventListener("storage", f)
      f()
      return () => {
        listeners.delete(f)
        window.removeEventListener("storage", f)
      }
    },
    async put(blocks) {
      const all = read()
      for (const b of blocks) all[b.id] = await encrypt(s.key, b)
      localStorage.setItem(k, JSON.stringify(all))
      emit()
    },
    async remove(id) {
      const all = read()
      delete all[id]
      localStorage.setItem(k, JSON.stringify(all))
      emit()
    },
  }
}


export const createStore = (s: Session): Store =>
  import.meta.env.VITE_LOCAL_STORE === "1" ? localStore(s) : firestoreStore(s)
