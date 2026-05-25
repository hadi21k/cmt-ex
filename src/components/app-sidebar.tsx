"use client";

import * as React from "react";
import Image from "next/image";
import {
  LayoutDashboardIcon,
  InboxIcon,
  BeakerIcon,
  FlagIcon,
  CircleHelpIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Operator",
    email: "operator@local",
    avatar: "",
  },
  navMain: [
    { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
    { title: "Event Inbox", url: "/inbox", icon: <InboxIcon /> },
    { title: "Simulator", url: "/simulator", icon: <BeakerIcon /> },
    { title: "Review Queue", url: "/review", icon: <FlagIcon /> },
  ],
  navSecondary: [
    { title: "Help", url: "#", icon: <CircleHelpIcon /> },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/" />}
            >
              <Image
                src="/cmt-logo.png"
                alt="C. Monkey Tribe"
                width={20}
                height={20}
                className="size-5!"
                priority
              />
              <span className="text-base font-semibold">
                Operations CC
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
