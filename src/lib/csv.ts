import type { Idea } from "@/lib/types"

function cell(v: string | number) {
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function date(ms: number) {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 백로그 항목을 엑셀에서 한글이 깨지지 않는 CSV(UTF-8 BOM)로 만든다. */
export function backlogCsv(ideas: Idea[]) {
  const rows = [
    ["카테고리", "항목", "작성자", "추천 수", "추천한 사람", "작성일"],
    ...ideas.map((i) => [
      i.category,
      i.title,
      i.author,
      i.upvotes?.length ?? 0,
      (i.upvotes ?? []).join(" "),
      date(i.createdAt),
    ]),
  ]
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n"
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
