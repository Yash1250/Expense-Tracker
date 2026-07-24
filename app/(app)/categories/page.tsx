import { getCategories } from '@/lib/actions';
import CategoriesClient from '@/components/CategoriesClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories as any} />;
}
