import { deriveFromPin, encrypt, decrypt } from "./crypto.js";
import * as store from "./store.js";

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const yen = (n) => `¥${Math.round(n).toLocaleString("ko-KR")}`;
const won = (n) => `₩${Math.round(n).toLocaleString("ko-KR")}`;
const mapLink = (q) =>
  q ? `<a class="map" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}">지도 ↗</a>` : "";

const newTrip = () => ({
  title: "일본 여행",
  startDate: "",
  endDate: "",
  members: ["나", "친구1", "친구2", "친구3"],
  schedule: {}, // { "2026-11-01": [{id,time,title,place}] }
  stays: [],
  expenses: [],
  rate: 900, // 100엔당 원
  checklist: [],
  notes: "",
  updatedAt: 0,
});

let session = null; // { tripId, key }
let trip = null;
let tab = "schedule";
let unwatch = null;
let pendingRemote = null;
let saveTimer = null;

// ---------- 잠금 화면 ----------
$("#mode-note").textContent = store.isShared
  ? "친구들과 실시간으로 공유됩니다"
  : "체험 모드: 이 브라우저에만 저장됩니다 (README 참고)";

$("#pin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pin = $("#pin").value.trim();
  if (!/^\d{4}$/.test(pin)) return showPinMsg("숫자 4자리를 입력하세요");
  $("#pin-btn").disabled = true;
  showPinMsg("여는 중…");
  try {
    const s = await deriveFromPin(pin);
    const payload = await store.load(s.tripId);
    let data;
    if (payload) {
      data = await decrypt(s.key, payload);
    } else {
      if (!confirm("이 비밀번호로 만든 여행이 없어요.\n새 여행을 만들까요?")) {
        showPinMsg("");
        return;
      }
      data = newTrip();
      session = s;
      trip = data;
      await persist();
    }
    open(s, data);
    sessionStorage.setItem("pin", pin);
  } catch (err) {
    console.error(err);
    showPinMsg("열 수 없어요. 비밀번호나 연결 상태를 확인하세요");
  } finally {
    $("#pin-btn").disabled = false;
  }
});

function showPinMsg(t) {
  $("#pin-msg").textContent = t;
}

async function open(s, data) {
  session = s;
  trip = { ...newTrip(), ...data };
  $("#lock").hidden = true;
  $("#app").hidden = false;
  renderHeader();
  render();
  unwatch = await store.watch(s.tripId, onRemote);
}

$("#logout").addEventListener("click", () => {
  if (unwatch) unwatch();
  sessionStorage.removeItem("pin");
  session = trip = null;
  $("#pin").value = "";
  showPinMsg("");
  $("#app").hidden = true;
  $("#lock").hidden = false;
});

// 새로고침해도 다시 입력하지 않도록 (탭을 닫으면 사라짐)
const remembered = sessionStorage.getItem("pin");
if (remembered) {
  $("#pin").value = remembered;
  $("#pin-form").requestSubmit();
}

// ---------- 동기화 ----------
async function onRemote(payload) {
  try {
    const data = await decrypt(session.key, payload);
    if (data.updatedAt <= trip.updatedAt) return;
    // 입력 중이면 끝난 뒤에 반영
    if ($("#app").contains(document.activeElement) && document.activeElement.matches("input,textarea,select")) {
      pendingRemote = data;
      return;
    }
    applyRemote(data);
  } catch (e) {
    console.error(e);
  }
}

function applyRemote(data) {
  trip = { ...newTrip(), ...data };
  pendingRemote = null;
  renderHeader();
  render();
}

document.addEventListener("focusout", () => {
  setTimeout(() => {
    if (pendingRemote && !document.activeElement?.matches("input,textarea,select")) applyRemote(pendingRemote);
  }, 0);
});

function changed() {
  trip.updatedAt = Date.now();
  setSync(true);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 400);
}

async function persist() {
  try {
    await store.save(session.tripId, await encrypt(session.key, trip));
    setSync(false);
  } catch (e) {
    console.error(e);
    $("#sync").textContent = "저장 실패";
  }
}

function setSync(saving) {
  $("#sync").textContent = saving ? "저장 중…" : "저장됨";
  $("#sync").classList.toggle("saving", saving);
}

// ---------- 상단 ----------
function renderHeader() {
  $("#trip-title").value = trip.title;
  $("#start-date").value = trip.startDate;
  $("#end-date").value = trip.endDate;
}
$("#trip-title").addEventListener("change", (e) => { trip.title = e.target.value; changed(); });
$("#start-date").addEventListener("change", (e) => { trip.startDate = e.target.value; changed(); render(); });
$("#end-date").addEventListener("change", (e) => { trip.endDate = e.target.value; changed(); render(); });

document.querySelectorAll(".tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    tab = b.dataset.tab;
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("active", x === b));
    render();
  })
);

// ---------- 공통: 목록 편집 ----------
// data-coll="stays" 또는 "schedule:2026-11-01", data-id, data-key
function coll(name) {
  if (name.startsWith("schedule:")) {
    const d = name.slice(9);
    return (trip.schedule[d] ||= []);
  }
  return trip[name];
}

const view = $("#view");

view.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.field) {
    trip[el.dataset.field] = el.type === "number" ? Number(el.value) : el.value;
    changed();
    if (el.dataset.rerender !== undefined) render();
    return;
  }
  if (el.dataset.member !== undefined) {
    trip.members[Number(el.dataset.member)] = el.value.trim() || `친구${Number(el.dataset.member) + 1}`;
    changed();
    render();
    return;
  }
  const { coll: c, id, key } = el.dataset;
  if (!c || !key) return;
  const item = coll(c).find((x) => x.id === id);
  if (!item) return;
  item[key] = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value) : el.value;
  if (c.startsWith("schedule:") && key === "time") coll(c).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  changed();
  if (el.type === "checkbox" || key === "time" || el.dataset.rerender !== undefined) render();
});

view.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, coll: c, id } = btn.dataset;
  if (action === "del") {
    if (!confirm("삭제할까요?")) return;
    const arr = coll(c);
    arr.splice(arr.findIndex((x) => x.id === id), 1);
    changed();
    render();
  }
  if (action === "add") {
    const form = btn.closest("[data-add]");
    const fields = Object.fromEntries(
      [...form.querySelectorAll("[name]")].map((i) => [i.name, i.type === "number" ? Number(i.value) : i.value.trim()])
    );
    const required = form.dataset.required;
    if (required && !fields[required]) return form.querySelector(`[name=${required}]`).focus();
    coll(form.dataset.add).push({ id: uid(), ...fields });
    if (form.dataset.add.startsWith("schedule:"))
      coll(form.dataset.add).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    changed();
    render();
  }
});

view.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.closest("[data-add]") && e.target.tagName === "INPUT" && !e.isComposing) {
    e.preventDefault();
    e.target.closest("[data-add]").querySelector("[data-action=add]").click();
  }
});

// ---------- 화면 ----------
function render() {
  view.innerHTML = { schedule, stays, budget, checklist, notes }[tab]();
}

function days() {
  const { startDate: s, endDate: e } = trip;
  if (!s || !e || s > e) return [];
  const out = [];
  for (let d = new Date(s + "T00:00:00"); d <= new Date(e + "T00:00:00") && out.length < 60; d.setDate(d.getDate() + 1)) {
    out.push(d.toLocaleDateString("sv-SE"));
  }
  return out;
}

function schedule() {
  const list = days();
  if (!list.length) return `<div class="card empty">위에서 여행 시작일과 종료일을 정하면 날짜별 일정이 생겨요.</div>`;
  const wd = ["일", "월", "화", "수", "목", "금", "토"];
  return list
    .map((d, i) => {
      const c = `schedule:${d}`;
      const items = trip.schedule[d] || [];
      const date = new Date(d + "T00:00:00");
      return `<div class="card">
        <h3><span>Day ${i + 1} · ${date.getMonth() + 1}/${date.getDate()} (${wd[date.getDay()]})</span></h3>
        <ul class="list">
          ${items.length ? "" : `<li class="empty">아직 일정이 없어요</li>`}
          ${items
            .map(
              (it) => `<li>
              <input class="time" type="time" value="${esc(it.time)}" data-coll="${c}" data-id="${it.id}" data-key="time" />
              <input class="grow" value="${esc(it.title)}" placeholder="할 일" data-coll="${c}" data-id="${it.id}" data-key="title" />
              <input class="grow" value="${esc(it.place)}" placeholder="장소" data-coll="${c}" data-id="${it.id}" data-key="place" data-rerender />
              ${mapLink(it.place)}
              <button class="icon" data-action="del" data-coll="${c}" data-id="${it.id}" title="삭제">✕</button>
            </li>`
            )
            .join("")}
        </ul>
        <div class="row add-row" data-add="${c}" data-required="title">
          <input class="time" type="time" name="time" />
          <input name="title" placeholder="할 일 (예: 오사카성 구경)" />
          <input name="place" placeholder="장소" />
          <button data-action="add">추가</button>
        </div>
      </div>`;
    })
    .join("");
}

function stays() {
  return `${trip.stays
    .map(
      (s) => `<div class="card">
      <h3><input class="grow" value="${esc(s.name)}" placeholder="숙소 이름" data-coll="stays" data-id="${s.id}" data-key="name" />
        <button class="icon" data-action="del" data-coll="stays" data-id="${s.id}">✕</button></h3>
      <div class="grid2">
        <label>체크인<input type="date" value="${esc(s.checkin)}" data-coll="stays" data-id="${s.id}" data-key="checkin" /></label>
        <label>체크아웃<input type="date" value="${esc(s.checkout)}" data-coll="stays" data-id="${s.id}" data-key="checkout" /></label>
        <label>주소 ${mapLink(s.address)}<input value="${esc(s.address)}" data-coll="stays" data-id="${s.id}" data-key="address" data-rerender /></label>
        <label>예약 링크 / 번호<input value="${esc(s.booking)}" data-coll="stays" data-id="${s.id}" data-key="booking" /></label>
      </div>
      <label class="muted small">메모<textarea rows="2" data-coll="stays" data-id="${s.id}" data-key="memo">${esc(s.memo)}</textarea></label>
    </div>`
    )
    .join("")}
    <div class="card row" data-add="stays" data-required="name">
      <input class="grow" name="name" placeholder="숙소 이름 (예: 난바 ○○호텔)" />
      <button data-action="add">숙소 추가</button>
    </div>`;
}

function budget() {
  const m = trip.members;
  const total = trip.expenses.reduce((s, x) => s + (x.amount || 0), 0);
  const per = m.length ? total / m.length : 0;
  const paid = m.map((_, i) => trip.expenses.filter((x) => Number(x.payer) === i).reduce((s, x) => s + (x.amount || 0), 0));
  const rate = (trip.rate || 0) / 100;

  // 정산: 많이 낸 사람에게 적게 낸 사람이 보냄
  const bal = paid.map((p, i) => ({ i, v: p - per }));
  const give = bal.filter((b) => b.v < -0.5).sort((a, b) => a.v - b.v);
  const take = bal.filter((b) => b.v > 0.5).sort((a, b) => b.v - a.v);
  const moves = [];
  for (const g of give) {
    for (const t of take) {
      if (g.v >= -0.5) break;
      if (t.v <= 0.5) continue;
      const amt = Math.min(-g.v, t.v);
      moves.push({ from: g.i, to: t.i, amt });
      g.v += amt;
      t.v -= amt;
    }
  }

  return `<div class="card">
      <h3>요약</h3>
      <div class="grid2">
        <div><div class="muted small">총 지출</div><div class="stat">${yen(total)}</div><div class="muted small">${won(total * rate)}</div></div>
        <div><div class="muted small">1인당</div><div class="stat">${yen(per)}</div><div class="muted small">${won(per * rate)}</div></div>
      </div>
      <div class="row" style="margin-top:10px">
        <span class="muted small">환율: 100엔 =</span>
        <input type="number" style="width:90px" value="${esc(trip.rate)}" data-field="rate" data-rerender /> <span class="muted small">원</span>
      </div>
    </div>

    <div class="card">
      <h3>정산</h3>
      <ul class="list settle">
        ${moves.length ? moves.map((x) => `<li><span>${esc(m[x.from])} → ${esc(m[x.to])}</span><b>${yen(x.amt)} <span class="muted small">(${won(x.amt * rate)})</span></b></li>`).join("") : `<li class="empty">정산할 금액이 없어요</li>`}
      </ul>
    </div>

    <div class="card">
      <h3>지출 내역</h3>
      <ul class="list">
        ${trip.expenses.length ? "" : `<li class="empty">아직 지출이 없어요</li>`}
        ${trip.expenses
          .map(
            (x) => `<li>
            <input class="grow" value="${esc(x.title)}" data-coll="expenses" data-id="${x.id}" data-key="title" />
            <input type="number" style="width:100px" value="${esc(x.amount)}" data-coll="expenses" data-id="${x.id}" data-key="amount" data-rerender />
            <select data-coll="expenses" data-id="${x.id}" data-key="payer" data-rerender>${m.map((n, i) => `<option value="${i}" ${Number(x.payer) === i ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
            <button class="icon" data-action="del" data-coll="expenses" data-id="${x.id}">✕</button>
          </li>`
          )
          .join("")}
      </ul>
      <div class="row add-row" data-add="expenses" data-required="title">
        <input name="title" placeholder="항목 (예: 라멘)" />
        <input name="amount" type="number" placeholder="엔" style="flex:0 0 100px" />
        <select name="payer">${m.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join("")}</select>
        <button data-action="add">추가</button>
      </div>
    </div>

    <div class="card">
      <h3>멤버 이름</h3>
      <div class="grid2">${m.map((n, i) => `<input value="${esc(n)}" data-member="${i}" />`).join("")}</div>
    </div>`;
}

function checklist() {
  const m = trip.members;
  const done = trip.checklist.filter((x) => x.done).length;
  return `<div class="card">
    <h3><span>준비물 · 할 일</span><span class="chip">${done}/${trip.checklist.length}</span></h3>
    <ul class="list">
      ${trip.checklist.length ? "" : `<li class="empty">여권, 엔화 환전, eSIM, 트래블카드…</li>`}
      ${trip.checklist
        .map(
          (x) => `<li class="${x.done ? "done" : ""}">
          <input type="checkbox" ${x.done ? "checked" : ""} data-coll="checklist" data-id="${x.id}" data-key="done" />
          <input class="grow" value="${esc(x.text)}" data-coll="checklist" data-id="${x.id}" data-key="text" />
          <select data-coll="checklist" data-id="${x.id}" data-key="who">
            <option value="">모두</option>${m.map((n, i) => `<option value="${i}" ${x.who === String(i) ? "selected" : ""}>${esc(n)}</option>`).join("")}
          </select>
          <button class="icon" data-action="del" data-coll="checklist" data-id="${x.id}">✕</button>
        </li>`
        )
        .join("")}
    </ul>
    <div class="row add-row" data-add="checklist" data-required="text">
      <input name="text" placeholder="추가할 항목" />
      <select name="who"><option value="">모두</option>${m.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join("")}</select>
      <button data-action="add">추가</button>
    </div>
  </div>`;
}

function notes() {
  return `<div class="card">
    <h3>메모</h3>
    <textarea rows="16" data-field="notes" placeholder="항공편, 맛집 후보, 링크 등 자유롭게 적어 두세요">${esc(trip.notes)}</textarea>
  </div>`;
}
