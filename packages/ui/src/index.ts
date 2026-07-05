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
