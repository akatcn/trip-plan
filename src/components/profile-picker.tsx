import { UserAvatar } from "@/components/user-avatar"
import { AUTHORS, type Author } from "@/lib/types"

export function ProfilePicker({ onPick }: { onPick: (u: Author) => void }) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-10 p-4">
      <h1 className="text-2xl font-semibold sm:text-3xl">누가 사용하나요?</h1>
      <ul className="flex flex-wrap justify-center gap-4 sm:gap-10">
        {AUTHORS.map((name) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onPick(name)}
              className="group focus-visible:ring-ring flex flex-col items-center gap-3 rounded-xl p-2 outline-none focus-visible:ring-2"
            >
              <UserAvatar
                name={name}
                size="xl"
                className="ring-offset-muted transition group-hover:scale-105 group-hover:ring-4 group-hover:ring-foreground/20 group-hover:ring-offset-2"
              />
              <span className="text-muted-foreground group-hover:text-foreground font-medium">
                {name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
