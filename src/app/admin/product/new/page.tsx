import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <AdminAuthGuard>
      <ProductForm mode="create" />
    </AdminAuthGuard>
  );
}
