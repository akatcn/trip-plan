export const AUTHORS = ["용훈", "성진", "현준"] as const
export type Author = (typeof AUTHORS)[number]

export const DAYS = [1, 2, 3, 4] as const
export type Day = (typeof DAYS)[number]

export type Block = {
  id: string
  day: Day
  order: number
  author: Author
  title: string
  place?: string
  cost?: number
  content?: string
  createdAt: number
}

export type BlockInput = Pick<Block, "author" | "title" | "place" | "cost" | "content">
