// 비밀번호에서 세 가지 값을 만든다 (PBKDF2).
// - tripId: 데이터가 저장되는 위치. 비밀번호를 모르면 찾을 수 없다.
// - key: 내용을 암호화하는 AES-GCM 키. 저장소에는 암호문만 올라간다.
// - verifier: 비밀번호가 맞는지 확인하는 값. 비밀번호 자체는 코드에 없다.
const SALT = new TextEncoder().encode("trip-plan-v2")
const ITERATIONS = 300000
const VERIFIER = "14099eb2ffafe1338e7e2356c54aef7d"

export type Session = { tripId: string; key: CryptoKey }

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
const toB64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

/** 비밀번호가 맞으면 Session, 틀리면 null */
export async function unlock(password: string): Promise<Session | null> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: SALT, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    768
  )
  if (toHex(bits.slice(64, 80)) !== VERIFIER) return null
  const key = await crypto.subtle.importKey("raw", bits.slice(32, 64), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ])
  return { tripId: toHex(bits.slice(0, 32)), key }
}

export type Encrypted = { iv: string; data: string }

export async function encrypt(key: CryptoKey, obj: unknown): Promise<Encrypted> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(obj))
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)
  return { iv: toB64(iv), data: toB64(ct) }
}

export async function decrypt<T>(key: CryptoKey, payload: Encrypted): Promise<T> {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(payload.iv) },
    key,
    fromB64(payload.data)
  )
  return JSON.parse(new TextDecoder().decode(pt)) as T
}
