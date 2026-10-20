import { ListTodoIcon, LogOutIcon, MapIcon, PlaneIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type Tab = "backlog" | "map"

const items: { tab: Tab; label: string; icon: typeof MapIcon }[] = [
  { tab: "backlog", label: "백로그", icon: ListTodoIcon },
  { tab: "map", label: "지도", icon: MapIcon },
]

export function AppSidebar({
  tab,
  onTab,
  onLogout,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  onLogout: () => void
}) {
  const { setOpenMobile } = useSidebar()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <PlaneIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">일본 여행</span>
                <span className="text-muted-foreground truncate text-xs">용훈 · 성진 · 현준</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.tab}>
                  <SidebarMenuButton
                    isActive={tab === it.tab}
                    tooltip={it.label}
                    onClick={() => {
                      onTab(it.tab)
                      setOpenMobile(false)
                    }}
                  >
                    <it.icon />
                    <span>{it.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="나가기" onClick={onLogout}>
              <LogOutIcon />
              <span>나가기</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
