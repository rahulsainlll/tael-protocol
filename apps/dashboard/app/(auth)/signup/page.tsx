import { redirect } from "next/navigation";

// Wallet auth has no separate sign-up — connecting a wallet is both. Keep the
// route so old links resolve, and send it to the single connect page.
export default function SignupPage() {
  redirect("/login");
}
