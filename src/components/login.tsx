import { useState } from "react"
import { LockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { unlock, type Session } from "@/lib/crypto"

export function Login({ onUnlock }: { onUnlock: (s: Session, password: string) => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError("")
    const s = await unlock(password)
    setLoading(false)
    if (s) onUnlock(s, password)
    else setError("비밀번호가 맞지 않아요")
  }

  return (
    <div className="bg-muted flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-10 items-center justify-center rounded-lg">
            <LockIcon className="size-5" />
          </div>
          <CardTitle className="text-xl">일본 여행 계획</CardTitle>
          <CardDescription>비밀번호를 입력해야 들어갈 수 있어요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <Button type="submit" disabled={loading || !password}>
              {loading ? "확인 중…" : "입장"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
