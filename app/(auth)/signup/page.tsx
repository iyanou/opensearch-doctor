import { redirect } from "next/navigation";

// Signup is handled automatically by Google OAuth.
// Anyone who signs in with Google for the first time gets an account created.
export default function SignupPage() {
  redirect("/login");
}
