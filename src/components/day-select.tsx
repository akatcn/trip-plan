import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DAYS, type Day } from "@/lib/types"

export function DaySelect({ day, onDay }: { day: Day; onDay: (d: Day) => void }) {
  return (
    <Select value={String(day)} onValueChange={(v) => onDay(Number(v) as Day)}>
      <SelectTrigger className="w-32" aria-label="일차 선택">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DAYS.map((d) => (
          <SelectItem key={d} value={String(d)}>
            {d}일차
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
