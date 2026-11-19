import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to my-tasks page
  redirect("/my-tasks");
}
