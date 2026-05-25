import { SidebarTrigger } from "@/components/ui/sidebar";

// The page title lives on each page's own `<h1>` (see src/app/*/page.tsx)
// so navigating to /inbox doesn't keep saying "Dashboard". A dynamic
// breadcrumb here would need usePathname + a route map; deferred until
// the actual pages are built next implement.

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
      </div>
    </header>
  );
}
