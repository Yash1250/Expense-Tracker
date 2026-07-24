import { getCategories } from '@/lib/actions';
import CategoriesClient from '@/components/CategoriesClient';

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories as any} />;
}
