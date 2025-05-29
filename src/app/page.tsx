import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
  // redirect() is a terminal action, so this part might not be strictly necessary
  // but good for clarity or if redirect behavior changes in future Next.js versions.
  return null; 
}
