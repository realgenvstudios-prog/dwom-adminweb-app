import { useEffect, useState, type FormEvent } from "react";
import bundlesService from "../../../services/bundlesService";
import type { Bundle } from "../../../services/bundlesService";
import type { Product } from "../BundleTypes";

export type BundleItem = { productId: number; quantity: number; visibleVariationOptionIds?: number[] };

// The bundle form's fields, price calculation, product-selection
// mutators, and submission. Split out of the former monolithic
// CreateBundleModal.
export function useBundleForm(
  open: boolean,
  editingBundle: Bundle | null | undefined,
  availableProducts: Product[],
  onBundleCreated: () => void,
  onClose: () => void,
) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate original total from selected products
  const calculateOriginalTotal = (): number => {
    return bundleItems.reduce((total, item) => {
      const product = availableProducts.find(p => p.id === item.productId);
      if (product) {
        const price = typeof product.pricePerUnit === 'string'
          ? parseFloat(product.pricePerUnit)
          : product.pricePerUnit;
        return total + (price * item.quantity);
      }
      return total;
    }, 0);
  };

  // Calculate final price after discount
  const calculateFinalPrice = (): number => {
    const originalTotal = calculateOriginalTotal();
    const discountPercent = parseFloat(discount) || 0;
    const discountAmount = originalTotal * (discountPercent / 100);
    return originalTotal - discountAmount;
  };

  const originalTotal = calculateOriginalTotal();
  const finalPrice = calculateFinalPrice();
  const savingsAmount = originalTotal - finalPrice;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (editingBundle) {
        setName(editingBundle.name);
        setDescription(editingBundle.description || '');
        setDiscount((editingBundle.discount || 0).toString());
        setImageUrl(editingBundle.imageUrl || '');
        // Use BundleItem if available (from backend), otherwise use items
        const itemsToLoad = editingBundle.BundleItem || editingBundle.items || [];
        setBundleItems(itemsToLoad.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          visibleVariationOptionIds: (item as any).visibleVariationOptionIds,
        })));
      } else {
        setName('');
        setDescription('');
        setDiscount('0');
        setImageUrl('');
        setBundleItems([]);
      }
      setError(null);
    }
  }, [open, editingBundle]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Bundle name is required');
      return;
    }

    if (bundleItems.length === 0) {
      setError('Add at least one product to the bundle');
      return;
    }

    if (finalPrice <= 0) {
      setError('Bundle price must be greater than 0. Add products or reduce discount.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingBundle) {
        console.log(`✏️ [CreateBundleModal] Updating bundle ${editingBundle.id}`);
        await bundlesService.update(editingBundle.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(finalPrice.toFixed(2)),
          discount: parseFloat(discount) || undefined,
          imageUrl: imageUrl.trim() || undefined,
          items: bundleItems,
        });
        console.log('✅ [CreateBundleModal] Bundle updated');
        alert('Bundle updated successfully!');
      } else {
        console.log('📦 [CreateBundleModal] Creating new bundle');
        await bundlesService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(finalPrice.toFixed(2)),
          discount: parseFloat(discount) || undefined,
          imageUrl: imageUrl.trim() || undefined,
          items: bundleItems,
        });
        console.log('✅ [CreateBundleModal] Bundle created');
        alert('Bundle created successfully!');
      }

      onBundleCreated();
      onClose();
    } catch (err: any) {
      console.error('❌ [CreateBundleModal] Failed to save bundle:', err);
      setError(err.message || 'Failed to save bundle');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: number) => {
    setBundleItems(prev =>
      prev.find(item => item.productId === productId)
        ? prev.filter(item => item.productId !== productId)
        : [...prev, { productId, quantity: 1 }]
    );
  };

  const updateProductQuantity = (productId: number, quantity: number) => {
    setBundleItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  // A missing/empty list means "all of this product's variation options are
  // visible" — the common case. Toggling materializes the explicit list.
  const toggleVisibleOption = (productId: number, optionId: number, allOptionIds: number[]) => {
    setBundleItems(prev =>
      prev.map(item => {
        if (item.productId !== productId) return item;
        const current = item.visibleVariationOptionIds && item.visibleVariationOptionIds.length > 0
          ? item.visibleVariationOptionIds
          : allOptionIds;
        const next = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...item, visibleVariationOptionIds: next };
      })
    );
  };

  return {
    name, setName,
    description, setDescription,
    discount, setDiscount,
    imageUrl, setImageUrl,
    bundleItems,
    loading,
    error,
    originalTotal,
    finalPrice,
    savingsAmount,
    handleSubmit,
    toggleProduct,
    updateProductQuantity,
    toggleVisibleOption,
  };
}
