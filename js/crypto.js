// PIN에서 두 가지 값을 만든다.
// 1) tripId: 데이터가 저장되는 위치(문서 ID). PIN을 모르면 찾을 수 없다.
// 2) key: 내용을 암호화하는 AES-GCM 키. 저장소에는 암호문만 올라간다.
const SALT = new TextEncoder().encode("trip-plan-v1");
const ITERATIONS = 300000;

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function deriveFromPin(pin) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: SALT, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    512
  );
  const tripId = toHex(bits.slice(0, 32));
  const key = await crypto.subtle.importKey(
    "raw",
    bits.slice(32, 64),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
  return { tripId, key };
}

export async function encrypt(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv: toB64(iv), data: toB64(ct) };
}

export async function decrypt(key, payload) {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(payload.iv) },
    key,
    fromB64(payload.data)
  );
  return JSON.parse(new TextDecoder().decode(pt));
}
