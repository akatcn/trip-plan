import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AUTHORS, type Author, type Block, type BlockInput, type Day } from "@/lib/types"

const LAST_AUTHOR = "trip-plan:last-author"

function lastAuthor(): Author | "" {
  try {
    const v = localStorage.getItem(LAST_AUTHOR)
    return AUTHORS.includes(v as Author) ? (v as Author) : ""
  } catch {
    return ""
  }
}

export function BlockDialog({
  open,
  onOpenChange,
  day,
  editing,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: Day
  editing: Block | null
  onSave: (input: BlockInput) => Promise<void>
}) {
  const [author, setAuthor] = useState<Author | "">("")
  const [title, setTitle] = useState("")
  const [place, setPlace] = useState("")
  const [cost, setCost] = useState("")
  const [content, setContent] = useState("")
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setAuthor(editing?.author ?? lastAuthor())
    setTitle(editing?.title ?? "")
    setPlace(editing?.place ?? "")
    setCost(editing?.cost != null ? String(editing.cost) : "")
    setContent(editing?.content ?? "")
    setTouched(false)
  }, [open, editing])

  const valid = author !== "" && title.trim() !== ""

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    setSaving(true)
    try {
      localStorage.setItem(LAST_AUTHOR, author)
    } catch {
      // 저장 못 해도 괜찮음
    }
    const n = Number(cost.replace(/[^\d.]/g, ""))
    await onSave({
      author: author as Author,
      title: title.trim(),
      place: place.trim() || undefined,
      cost: cost.trim() && Number.isFinite(n) ? n : undefined,
      content: content.trim() || undefined,
    })
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? "블록 편집" : "블록 추가"}</DialogTitle>
            <DialogDescription>{day}일차 백로그</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="author">작성자</Label>
            <Select value={author} onValueChange={(v) => setAuthor(v as Author)}>
              <SelectTrigger id="author" className="w-full" aria-invalid={touched && !author}>
                <SelectValue placeholder="작성자 선택" />
              </SelectTrigger>
              <SelectContent>
                {AUTHORS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched && !author && <p className="text-destructive text-sm">작성자를 선택하세요</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 오사카성 구경"
              aria-invalid={touched && !title.trim()}
            />
            {touched && !title.trim() && <p className="text-destructive text-sm">제목을 입력하세요</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="place">
                장소 <span className="text-muted-foreground font-normal">(선택)</span>
              </Label>
              <Input
                id="place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="예: 오사카성"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">
                비용 (엔) <span className="text-muted-foreground font-normal">(선택)</span>
              </Label>
              <Input
                id="cost"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="예: 1200"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자세한 내용, 링크, 메모 등"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
