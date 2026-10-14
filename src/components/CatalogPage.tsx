import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import ProductsTab from './products/ProductsTab';
import CreateProductDialog from './products/CreateProductDialog';
import CategoriesTab from './products/CategoriesTab';
import BundlesTab from './products/BundlesTab';
import { useCatalogData } from './products/useCatalogData';

const TABS = ['products', 'categories', 'bundles'] as const;

const CatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useTabParam(TABS, 'products');
  const { products, categories, loading, error, refreshProducts, refreshCategories, patchProduct } = useCatalogData();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
          <p className="text-sm text-muted-foreground">Products, categories, and bundles — everything DWOM sells.</p>
        </div>
        {activeTab === 'products' && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Add product
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])} className="gap-6">
        <TabsList>
          <TabsTrigger value="products">
            Products
            {!loading && <span className="ml-1 text-xs text-muted-foreground tabular-nums">{products.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categories
            {categories.length > 0 && <span className="ml-1 text-xs text-muted-foreground tabular-nums">{categories.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTab
            products={products}
            categories={categories}
            loading={loading}
            error={error}
            refresh={refreshProducts}
            patchProduct={patchProduct}
          />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab onCategoriesChanged={refreshCategories} />
        </TabsContent>
        <TabsContent value="bundles">
          <BundlesTab />
        </TabsContent>
      </Tabs>

      <CreateProductDialog open={createOpen} onOpenChange={setCreateOpen} categories={categories} onCreated={() => void refreshProducts()} />
    </div>
  );
};

export default CatalogPage;
