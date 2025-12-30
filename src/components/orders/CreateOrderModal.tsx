import React, { useState } from 'react';
import ordersService from '../../services/ordersService';

interface Props {
  open: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
}

const CreateOrderModal: React.FC<Props> = ({ open, onClose, onOrderCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    deliveryAddressId: '',
    paymentMethod: 'cash',
    riderNotes: '',
    items: [{ productId: '', quantity: 1 }],
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.customerId || !formData.deliveryAddressId || formData.items.some(i => !i.productId)) {
        alert('Please fill in all required fields');
        return;
      }

      console.log('📦 [CreateOrderModal] Creating manual order:', formData);
      
      // Call backend to create order
      const createOrderPayload = {
        userId: parseInt(formData.customerId),
        deliveryAddressId: parseInt(formData.deliveryAddressId),
        paymentMethod: formData.paymentMethod,
        riderNotes: formData.riderNotes || undefined,
        items: formData.items.map(item => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
        })),
      };

      const response = await ordersService.createOrder(createOrderPayload);
      console.log('✅ [CreateOrderModal] Order created:', response);
      alert(`Order created successfully! ID: ${response.id}`);
      onOrderCreated?.();
      onClose();
    } catch (error: any) {
      console.error('❌ [CreateOrderModal] Failed to create order:', error);
      alert(`Failed to create order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Create Manual Order</h2>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose}>
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
            <input
              type="number"
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer user ID"
            />
          </div>

          {/* Delivery Address ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address ID</label>
            <input
              type="number"
              required
              value={formData.deliveryAddressId}
              onChange={(e) => setFormData({ ...formData, deliveryAddressId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address ID"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash on Delivery</option>
              <option value="card">Card</option>
              <option value="momo">Mobile Money</option>
            </select>
          </div>

          {/* Rider Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rider Notes (Optional)</label>
            <textarea
              value={formData.riderNotes}
              onChange={(e) => setFormData({ ...formData, riderNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes for the rider..."
              rows={3}
            />
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <input
                    type="number"
                    required
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product ID"
                  />
                  <input
                    type="number"
                    required
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Qty"
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              + Add Item
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
