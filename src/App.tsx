import { useEffect, useMemo, useState } from "react"

import { AppSidebar, type Tab } from "@/components/app-sidebar"
import { Backlog } from "@/components/backlog"
import { Login } from "@/components/login"
import { MapView } from "@/components/map-view"
import { ProfilePicker } from "@/components/profile-picker"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { unlock, type Session } from "@/lib/crypto"
import { createStore } from "@/lib/store"
import { AUTHORS, type Author, type Block, type Day } from "@/lib/types"

const PASS_KEY = "trip-plan:password"
const USER_KEY = "trip-plan:user"

const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v == null) localStorage.removeItem(k)
      else localStorage.setItem(k, v)
    } catch {
      // 무시
    }
  },
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [restoring, setRestoring] = useState(() => !!storage.get(PASS_KEY))
  const [user, setUser] = useState<Author | null>(() => {
    const u = storage.get(USER_KEY)
    return AUTHORS.includes(u as Author) ? (u as Author) : null
  })

  function pickUser(u: Author | null) {
    storage.set(USER_KEY, u)
    setUser(u)
  }

  // 이 기기에서 한 번 들어왔으면 다시 묻지 않음
  useEffect(() => {
    const saved = storage.get(PASS_KEY)
    if (!saved) return
    unlock(saved).then((s) => {
      if (s) setSession(s)
      else storage.set(PASS_KEY, null)
      setRestoring(false)
    })
  }, [])

  if (restoring) return null
  if (!session)
    return (
      <Login
        onUnlock={(s, pw) => {
          storage.set(PASS_KEY, pw)
          setSession(s)
        }}
      />
    )
  if (!user) return <ProfilePicker onPick={pickUser} />
  return (
    <Dashboard
      session={session}
      user={user}
      onSwitchUser={() => pickUser(null)}
      onLogout={() => {
        storage.set(PASS_KEY, null)
        pickUser(null)
        setSession(null)
      }}
    />
  )
}

function Dashboard({
  session,
  user,
  onSwitchUser,
  onLogout,
}: {
  session: Session
  user: Author
  onSwitchUser: () => void
  onLogout: () => void
}) {
  const store = useMemo(() => createStore(session), [session])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("backlog")
  const [day, setDay] = useState<Day>(1)

  useEffect(
    () =>
      store.watch(
        (b) => {
          setBlocks(b)
          setLoaded(true)
          setError("")
        },
        (e) => {
          console.error(e)
          setLoaded(true)
          setError(
            e.message.includes("permission")
              ? "데이터를 읽을 권한이 없어요. Firebase 콘솔에 최신 firestore.rules가 게시되어 있는지 확인해 주세요."
              : "데이터를 불러오지 못했어요. 인터넷 연결을 확인해 주세요."
          )
        }
      ),
    [store]
  )

  return (
    <SidebarProvider>
      <AppSidebar
        tab={tab}
        onTab={setTab}
        user={user}
        onSwitchUser={onSwitchUser}
        onLogout={onLogout}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="font-medium">{tab === "backlog" ? "백로그" : "지도"}</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {tab === "backlog" ? (
            <Backlog
              store={store}
              blocks={blocks}
              setBlocks={setBlocks}
              day={day}
              onDay={setDay}
              user={user}
              loading={!loaded}
              error={error}
            />
          ) : (
            <MapView blocks={blocks} day={day} onDay={setDay} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
