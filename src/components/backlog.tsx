import { useMemo, useState } from "react"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Store } from "@/lib/store"
import { CATEGORIES, type Author, type Category, type Idea } from "@/lib/types"

const EMOJI: Record<Category, string> = {
  "먹고 싶은 것": "🍜",
  "가고 싶은 곳": "🏯",
  "사고 싶은 것": "🛍️",
  "하고 싶은 것": "🎢",
  "하고 싶지 않은 것": "❌",
  기타: "📌",
}

const PLACEHOLDER: Record<Category, string> = {
  "먹고 싶은 것": "타코야끼",
  "가고 싶은 곳": "히메지 성",
  "사고 싶은 것": "건담",
  "하고 싶은 것": "스티커 사진 찍기",
  "하고 싶지 않은 것": "도톤보리 가기",
  기타: "환전하기",
}

const LAST_CATEGORY = "trip-plan:last-category"

function lastCategory(): Category {
  try {
    const v = localStorage.getItem(LAST_CATEGORY)
    return CATEGORIES.includes(v as Category) ? (v as Category) : CATEGORIES[0]
  } catch {
    return CATEGORIES[0]
  }
}

function CategorySelect({
  value,
  onChange,
  id,
  className,
}: {
  value: Category
  onChange: (c: Category) => void
  id?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Category)}>
      <SelectTrigger id={id} className={className} aria-label="카테고리">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((c) => (
          <SelectItem key={c} value={c}>
            {EMOJI[c]} {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function Backlog({
  store,
  ideas,
  setIdeas,
  user,
  readOnly,
  loading,
  error,
}: {
  store: Store
  ideas: Idea[]
  setIdeas: (i: Idea[]) => void
  user: Author | null
  readOnly: boolean
  loading: boolean
  error: string
}) {
  const [category, setCategory] = useState<Category>(lastCategory)
  const [title, setTitle] = useState("")
  const [filter, setFilter] = useState<Category | "all">("all")
  const [editing, setEditing] = useState<Idea | null>(null)
  const [deleting, setDeleting] = useState<Idea | null>(null)
  const [addError, setAddError] = useState("")

  const sorted = useMemo(() => [...ideas].sort((a, b) => a.createdAt - b.createdAt), [ideas])
  const groups = CATEGORIES.filter((c) => filter === "all" || c === filter)
    .map((c) => ({ category: c, items: sorted.filter((i) => i.category === c) }))
    .filter((g) => filter !== "all" || g.items.length > 0)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim()) return
    const idea: Idea = {
      kind: "idea",
      id: crypto.randomUUID(),
      category,
      title: title.trim(),
      author: user,
      createdAt: Date.now(),
    }
    try {
      localStorage.setItem(LAST_CATEGORY, category)
    } catch {
      // 무시
    }
    setTitle("")
    setAddError("")
    setIdeas([...ideas, idea])
    try {
      await store.put([idea])
    } catch (err) {
      console.error(err)
      setAddError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.")
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setIdeas(ideas.filter((i) => i.id !== deleting.id))
    setDeleting(null)
    await store.remove(deleting.id).catch(console.error)
  }

  async function saveEdit(next: Idea) {
    setIdeas(ideas.map((i) => (i.id === next.id ? next : i)))
    setEditing(null)
    await store.put([next]).catch(console.error)
  }

  return (
    <div className="flex flex-col gap-4">
      {readOnly ? (
        <span className="text-muted-foreground flex items-center gap-1.5 self-end text-sm">
          <EyeIcon className="size-4" />
          보기 전용
        </span>
      ) : (
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <CategorySelect value={category} onChange={setCategory} className="sm:w-52" />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`예: ${PLACEHOLDER[category]}`}
            aria-label="항목"
            className="flex-1"
          />
          <Button type="submit" disabled={!title.trim()}>
            <PlusIcon />
            추가
          </Button>
        </form>
      )}
      {addError && <p className="text-destructive text-sm">{addError}</p>}

      {error && (
        <div className="border-destructive/50 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          전체 {ideas.length}
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={filter === c ? "default" : "outline"}
            onClick={() => setFilter(c)}
          >
            {EMOJI[c]} {c} {ideas.filter((i) => i.category === c).length}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">불러오는 중…</p>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border px-4 py-10 text-center text-sm">
          {readOnly
            ? "아직 백로그가 없어요."
            : "먹고 싶은 것, 가고 싶은 곳을 생각나는 대로 적어 두세요."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.category} className="gap-2 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-base">
                  {EMOJI[g.category]} {g.category}{" "}
                  <span className="text-muted-foreground font-normal">{g.items.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                {g.items.length === 0 ? (
                  <p className="text-muted-foreground px-2 py-4 text-sm">아직 없어요</p>
                ) : (
                  <ul className="grid">
                    {g.items.map((i) => (
                      <li
                        key={i.id}
                        className="hover:bg-accent/60 flex items-center gap-3 rounded-md px-2 py-1.5"
                      >
                        <UserAvatar
                          name={i.author}
                          size="sm"
                          className="size-7"
                          textClassName="text-[9px]"
                        />
                        <span className="min-w-0 flex-1 text-sm break-words">{i.title}</span>
                        {!readOnly && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                aria-label="옵션"
                              >
                                <MoreHorizontalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem onSelect={() => setEditing(i)}>
                                <PencilIcon />
                                편집
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(i)}
                              >
                                <Trash2Icon />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!readOnly && (
        <EditDialog idea={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>백로그에서 삭제할까요?</DialogTitle>
            <DialogDescription>‘{deleting?.title}’ 항목이 모두에게서 사라져요.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EditDialog({
  idea,
  onClose,
  onSave,
}: {
  idea: Idea | null
  onClose: () => void
  onSave: (i: Idea) => void
}) {
  return (
    <Dialog open={!!idea} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {idea && <EditForm key={idea.id} idea={idea} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ idea, onSave }: { idea: Idea; onSave: (i: Idea) => void }) {
  const [category, setCategory] = useState<Category>(idea.category)
  const [title, setTitle] = useState(idea.title)
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) onSave({ ...idea, category, title: title.trim() })
      }}
    >
      <DialogHeader>
        <DialogTitle>백로그 편집</DialogTitle>
        <DialogDescription>{idea.author}님이 적은 항목</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="idea-category">카테고리</Label>
        <CategorySelect
          id="idea-category"
          value={category}
          onChange={setCategory}
          className="w-full"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="idea-title">항목</Label>
        <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            취소
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!title.trim()}>
          저장
        </Button>
      </DialogFooter>
    </form>
  )
}
