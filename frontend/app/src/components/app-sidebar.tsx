"use client";

import {
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarGroupContent,
    SidebarMenuButton,
    SidebarMenuItem
  } from "@/components/ui/sidebar"

  import { Home, Inbox, Settings, Shuffle } from "lucide-react"

  import { useAccount } from "wagmi";

  import { useRouter } from "next/navigation";


// Menu items.
const items = [
  {
    title: "Market",
    url: "/",
    icon: Home,
  },
  {
    title: "My Tokens",
    url: "/collection",
    icon: Inbox,
  },
  {
    title: "Mint",
    url: "/mint",
    icon: Settings,
  },
  {
    title: "Bridge Tokens",
    url: "/bridge",
    icon: Shuffle,
  },
]
  
const noconnect_items = [
  {
    title: "MARKET",
    url: "/",
    icon: Home,
  },
]
  
export function AppSidebar() {
  const { isConnected } = useAccount();
  const router = useRouter();
  return (
    <aside className="content-sidebar">
      <SidebarHeader className="bg-cyan-200"><img src="/logo.svg" alt="Logo" className="my-3 w-65 h-20" /></SidebarHeader>
      <SidebarContent className="bg-cyan-200">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {isConnected ? items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild onClick={() => router.push(item.url)}>
                    <span><item.icon />{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )) : noconnect_items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild onClick={() => router.push(item.url)}>
                    <span><item.icon />{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="bg-cyan-200"/>
    </aside>
  )
}
  