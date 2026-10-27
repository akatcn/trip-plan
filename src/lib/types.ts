export const AUTHORS = ["용훈", "성진", "현준", "성혁"] as const
export type Author = (typeof AUTHORS)[number]

export const DAYS = [1, 2, 3, 4] as const
export type Day = (typeof DAYS)[number]

export type Block = {
  kind?: "plan" // 예전 데이터에는 없음
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

export const CATEGORIES = [
  "먹고 싶은 것",
  "가고 싶은 곳",
  "사고 싶은 것",
  "하고 싶은 것",
  "하고 싶지 않은 것",
  "기타",
] as const
export type Category = (typeof CATEGORIES)[number]

/** 백로그: 일정 없이 마구 적어 두는 항목 */
export type Idea = {
  kind: "idea"
  id: string
  category: Category
  title: string
  author: Author
  createdAt: number
}

/** 저장소에 들어가는 문서 하나 */
export type Doc = Block | Idea
