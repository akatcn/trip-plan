import { useMemo, useState } from "react"
import { ExternalLinkIcon, MapPinIcon, RouteIcon } from "lucide-react"

import { DaySelect } from "@/components/day-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Block, Day } from "@/lib/types"
import { cn } from "@/lib/utils"

const DEFAULT_PLACE = "Japan"

export function MapView({
  blocks,
  day,
  onDay,
}: {
  blocks: Block[]
  day: Day
  onDay: (d: Day) => void
}) {
  const stops = useMemo(
    () =>
      blocks
        .filter((b) => b.day === day && b.place)
        .sort((a, b) => a.order - b.order),
    [blocks, day]
  )
  const [selected, setSelected] = useState<string | null>(null)
  const current = stops.find((s) => s.id === selected) ?? stops[0]
  const query = current?.place ?? DEFAULT_PLACE
  const route =
    stops.length > 1
      ? `https://www.google.com/maps/dir/${stops.map((s) => encodeURIComponent(s.place!)).join("/")}`
      : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DaySelect day={day} onDay={onDay} />
        {route && (
          <Button variant="outline" asChild>
            <a href={route} target="_blank" rel="noreferrer">
              <RouteIcon />
              {day}일차 경로 보기
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">{day}일차 장소</CardTitle>
            <CardDescription>백로그 순서대로 보여요</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {stops.length === 0 ? (
              <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                장소가 입력된 블록이 없어요
              </p>
            ) : (
              <ol className="grid gap-1">
                {stops.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(s.id)}
                      className={cn(
                        "hover:bg-accent flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm",
                        s.id === current?.id && "bg-accent"
                      )}
                    >
                      <span className="bg-primary text-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                        {i + 1}
                      </span>
                      <span className="grid">
                        <span className="font-medium">{s.title}</span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <MapPinIcon className="size-3" />
                          {s.place}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <iframe
            title="지도"
            className="h-[60svh] min-h-80 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          />
          {current && (
            <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
              <span className="truncate">{current.place}</span>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  구글 지도에서 열기
                  <ExternalLinkIcon />
                </a>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
