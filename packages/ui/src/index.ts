// @tael/ui — shared React components (shadcn/ui-based) for Tael frontends.
// Ships TS/TSX source; consumers compile it via Next's `transpilePackages`.
// Theme tokens live in ./globals.css; the Tailwind preset in @tael/config maps
// utilities to them. This package owns presentation only — no business logic.
export { cn } from "./lib/utils";

export { Button, buttonVariants, type ButtonProps } from "./components/button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/card";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export { Input } from "./components/input";
export { Skeleton } from "./components/skeleton";
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./components/table";
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/dialog";
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./components/sheet";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/tooltip";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "./components/dropdown-menu";
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  SIDEBAR_COOKIE_NAME,
} from "./components/sidebar";
export { useIsMobile } from "./lib/use-mobile";
export { Textarea } from "./components/textarea";
