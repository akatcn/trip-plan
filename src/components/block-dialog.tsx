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
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/user-avatar"
import type { Author, Block, BlockInput, Day } from "@/lib/types"

export function BlockDialog({
  open,
  onOpenChange,
  day,
  editing,
  user,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: Day
  editing: Block | null
  user: Author
  onSave: (input: BlockInput) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [place, setPlace] = useState("")
  const [cost, setCost] = useState("")
  const [content, setContent] = useState("")
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setTitle(editing?.title ?? "")
    setPlace(editing?.place ?? "")
    setCost(editing?.cost != null ? String(editing.cost) : "")
    setContent(editing?.content ?? "")
    setTouched(false)
    setError("")
  }, [open, editing])

  const author = editing?.author ?? user
  const valid = title.trim() !== ""

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    setSaving(true)
    setError("")
    const n = Number(cost.replace(/[^\d.]/g, ""))
    try {
      await onSave({
        author,
        title: title.trim(),
        place: place.trim() || undefined,
        cost: cost.trim() && Number.isFinite(n) ? n : undefined,
        content: content.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? "백로그 편집" : "백로그 추가"}</DialogTitle>
            <DialogDescription>{day}일차 백로그</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <UserAvatar name={author} size="sm" />
            <div className="text-sm">
              <div className="text-muted-foreground text-xs">작성자</div>
              <div className="font-medium">{author}</div>
            </div>
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

          {error && <p className="text-destructive text-sm">{error}</p>}

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
