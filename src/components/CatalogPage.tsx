import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import ProductsTab from './products/ProductsTab';
import CreateProductDialog from './products/CreateProductDialog';
import CategoriesTab from './categories/CategoriesTab';
import BundlesTab from './bundles/BundlesTab';
import RequestsTab from './products/RequestsTab';
import { useCatalogData } from './products/useCatalogData';
import { allowedTabs, can, canTab } from '../config/permissions';
import { usePermissions } from '@/hooks/use-permissions';

const TABS = ['products', 'categories', 'bundles', 'requests'] as const;

const CatalogPage: React.FC = () => {
  usePermissions();
  const allowed = allowedTabs('/catalog', TABS);
  const [activeTab, setActiveTab] = useTabParam(allowed, allowed[0] ?? 'products');
  const { products, categories, categoryRecords, loading, error, categoriesLoading, categoriesError, refreshProducts, refreshCategories, patchProduct } = useCatalogData();
  // Product edits/archives change category product counts too.
  const refreshAll = async () => {
    await Promise.all([refreshProducts(), refreshCategories()]);
  };
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
          <p className="text-sm text-muted-foreground">Products, categories and bundles: everything DWOM sells, and what customers ask for.</p>
        </div>
        {activeTab === 'products' && can('products.create') && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Add product
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])} className="gap-6">
        <TabsList>
          {canTab('/catalog', 'products') && (
            <TabsTrigger value="products">
              Products
              {!loading && <span className="ml-1 text-xs text-muted-foreground tabular-nums">{products.length}</span>}
            </TabsTrigger>
          )}
          {canTab('/catalog', 'categories') && (
            <TabsTrigger value="categories">
              Categories
              {categories.length > 0 && <span className="ml-1 text-xs text-muted-foreground tabular-nums">{categories.length}</span>}
            </TabsTrigger>
          )}
          {canTab('/catalog', 'bundles') && <TabsTrigger value="bundles">Bundles</TabsTrigger>}
          {canTab('/catalog', 'requests') && <TabsTrigger value="requests">Requests</TabsTrigger>}
        </TabsList>

        {canTab('/catalog', 'products') && (
          <TabsContent value="products">
            <ProductsTab products={products} categories={categories} loading={loading} error={error} refresh={refreshAll} patchProduct={patchProduct} />
          </TabsContent>
        )}
        {canTab('/catalog', 'categories') && (
          <TabsContent value="categories">
            <CategoriesTab categories={categoryRecords} loading={categoriesLoading} error={categoriesError} refresh={refreshCategories} />
          </TabsContent>
        )}
        {canTab('/catalog', 'bundles') && (
          <TabsContent value="bundles">
            <BundlesTab products={products} categories={categories} />
          </TabsContent>
        )}
        {canTab('/catalog', 'requests') && (
          <TabsContent value="requests">
            <RequestsTab products={products} />
          </TabsContent>
        )}
      </Tabs>

      <CreateProductDialog open={createOpen} onOpenChange={setCreateOpen} categories={categories} onCreated={() => void refreshAll()} />
    </div>
  );
};

export default CatalogPage;
