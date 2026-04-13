import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>BlockNote</h1>
      <p>
        <Link href="/login">Login</Link> | <Link href="/register">Register</Link> |{' '}
        <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  );
}
