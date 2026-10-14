import React, { useState, useEffect } from "react";
import workersService from "../../services/workersService";
import { logger } from "../../utils/logger";

interface CreatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Mirrors CreateRiderModal's shape — same pattern, Worker's actual fields.
const CreatePickerModal: React.FC<CreatePickerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: "", phone: "", type: "kayayie" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFormData({ name: "", phone: "", type: "kayayie" });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Please enter a name");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await workersService.create({
        name: formData.name,
        phone: formData.phone || undefined,
        type: formData.type,
      });
      logger.log("✅ Picker created successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error("❌ Failed to create picker:", err);
      setError(err.message || "Failed to create picker");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Add New Picker</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Ama"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +233501234567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="kayayie">Kayayie</option>
              <option value="picker">Picker</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add Picker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePickerModal;
