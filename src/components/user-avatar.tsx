import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Author } from "@/lib/types"
import { cn } from "@/lib/utils"

// 용훈(파랑), 성진(초록), 현준(노랑)
export const USER_COLOR: Record<Author, string> = {
  용훈: "bg-blue-500 text-white",
  성진: "bg-green-500 text-white",
  현준: "bg-yellow-400 text-yellow-950",
}

const SIZE = {
  sm: ["size-9", "text-[11px]"],
  md: ["size-10", "text-xs"],
  xl: ["size-20 sm:size-32", "text-xl sm:text-3xl"],
}

export function UserAvatar({
  name,
  size = "md",
  className,
  textClassName,
}: {
  name: Author
  size?: keyof typeof SIZE
  className?: string
  textClassName?: string
}) {
  const [box, text] = SIZE[size]
  return (
    <Avatar className={cn(box, className)} title={name}>
      <AvatarFallback className={cn("font-semibold", text, USER_COLOR[name], textClassName)}>
        {name}
      </AvatarFallback>
    </Avatar>
  )
}
