"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarGroupContent,
    SidebarMenuButton,
    SidebarMenuItem
  } from "@/components/ui/sidebar"

  import { Calendar, Home, Inbox, Settings } from "lucide-react"

  import { useAccount } from "wagmi";

  import { useRouter } from "next/navigation";


// Menu items.
const items = [
  {
    title: "MARKET",
    url: "/",
    icon: Home,
  },
  // {
  //   title: "TOP SALES",
  //   url: "/",
  //   icon: Calendar,
  // },
  {
    title: "COLLECTIONS",
    url: "/collection",
    icon: Inbox,
  },
  {
    title: "MINT",
    url: "/mint",
    icon: Settings,
  }
]
  
const noconnect_items = [
  {
    title: "MARKET",
    url: "/",
    icon: Home,
  },
  // {
  //   title: "TOP SALES",
  //   url: "/",
  //   icon: Calendar,
  // }
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
  