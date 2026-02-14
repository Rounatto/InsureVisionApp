import Link from "next/link";

export default function RegisterPage() {
  return (
    <main>
      <h1>Register</h1>
      <p>Create your account here.</p>
      <p>
        Already have an account? <Link href="/login">Login here</Link>.
      </p>
    </main>
  );
}
