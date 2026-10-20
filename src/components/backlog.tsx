import { useMemo, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVerticalIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { BlockDialog } from "@/components/block-dialog"
import { DaySelect } from "@/components/day-select"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Store } from "@/lib/store"
import type { Block, BlockInput, Day } from "@/lib/types"
import { cn } from "@/lib/utils"

export const yen = (n: number) => `¥${n.toLocaleString("ko-KR")}`

const AUTHOR_STYLE: Record<string, string> = {
  용훈: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  성진: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  현준: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

export function Backlog({
  store,
  blocks,
  setBlocks,
  day,
  onDay,
}: {
  store: Store
  blocks: Block[]
  setBlocks: (b: Block[]) => void
  day: Day
  onDay: (d: Day) => void
}) {
  const rows = useMemo(
    () => blocks.filter((b) => b.day === day).sort((a, b) => a.order - b.order),
    [blocks, day]
  )
  const total = rows.reduce((s, b) => s + (b.cost ?? 0), 0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Block | null>(null)
  const [deleting, setDeleting] = useState<Block | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function save(input: BlockInput) {
    if (editing) {
      const next = { ...editing, ...input }
      setBlocks(blocks.map((b) => (b.id === next.id ? next : b)))
      await store.put([next])
    } else {
      const next: Block = {
        ...input,
        id: crypto.randomUUID(),
        day,
        order: rows.length ? rows[rows.length - 1].order + 1 : 0,
        createdAt: Date.now(),
      }
      setBlocks([...blocks, next])
      await store.put([next])
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBlocks(blocks.filter((b) => b.id !== deleting.id))
    await store.remove(deleting.id)
    setDeleting(null)
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = rows.findIndex((r) => r.id === active.id)
    const to = rows.findIndex((r) => r.id === over.id)
    const moved = arrayMove(rows, from, to)
    const changed = moved
      .map((b, i) => ({ ...b, order: i }))
      .filter((b, i) => b.order !== rows.find((r) => r.id === moved[i].id)?.order)
    const byId = new Map(changed.map((b) => [b.id, b]))
    setBlocks(blocks.map((b) => byId.get(b.id) ?? b))
    await store.put(changed)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DaySelect day={day} onDay={onDay} />
        <Button onClick={openNew}>
          <PlusIcon />
          블록 추가
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="hidden w-8 sm:table-cell">#</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="hidden sm:table-cell">장소</TableHead>
                <TableHead className="text-right">비용</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                    {day}일차에 아직 블록이 없어요. 오른쪽 위 ‘블록 추가’를 눌러 보세요.
                  </TableCell>
                </TableRow>
              )}
              <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                {rows.map((b, i) => (
                  <SortableRow
                    key={b.id}
                    block={b}
                    index={i}
                    onEdit={() => {
                      setEditing(b)
                      setDialogOpen(true)
                    }}
                    onDelete={() => setDeleting(b)}
                  />
                ))}
              </SortableContext>
            </TableBody>
            {total > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell />
                  <TableCell className="hidden sm:table-cell" />
                  <TableCell>{day}일차 합계</TableCell>
                  <TableCell className="hidden sm:table-cell" />
                  <TableCell className="text-right tabular-nums">{yen(total)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </DndContext>
      </div>

      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        day={day}
        editing={editing}
        onSave={save}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>블록을 삭제할까요?</DialogTitle>
            <DialogDescription>‘{deleting?.title}’ 블록이 모두에게서 사라져요.</DialogDescription>
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

function SortableRow({
  block: b,
  index,
  onEdit,
  onDelete,
}: {
  block: Block
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: b.id })

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("bg-background", isDragging && "relative z-10 shadow-lg")}
      data-state={isDragging ? "selected" : undefined}
    >
      <TableCell className="pr-0">
        <Button
          ref={setActivatorNodeRef}
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-7 cursor-grab touch-none active:cursor-grabbing"
          aria-label="순서 변경"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon />
        </Button>
      </TableCell>
      <TableCell className="text-muted-foreground hidden tabular-nums sm:table-cell">{index + 1}</TableCell>
      <TableCell className="max-w-72 min-w-36 whitespace-normal">
        <div className="font-medium">{b.title}</div>
        {b.place && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs sm:hidden">
            <MapPinIcon className="size-3 shrink-0" />
            {b.place}
          </div>
        )}
        {b.content && (
          <div className="text-muted-foreground line-clamp-2 text-xs whitespace-pre-line">
            {b.content}
          </div>
        )}
      </TableCell>
      <TableCell className="hidden max-w-48 whitespace-normal sm:table-cell">
        {b.place ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.place)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <MapPinIcon className="text-muted-foreground size-3.5 shrink-0" />
            {b.place}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {b.cost != null ? yen(b.cost) : <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={AUTHOR_STYLE[b.author]}>
          {b.author}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="옵션">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon />
              편집
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
