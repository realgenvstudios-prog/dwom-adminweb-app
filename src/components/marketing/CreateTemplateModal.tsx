import React, { useState } from "react";
import marketingService from "../../services/marketingService";

interface CreateTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    title: "",
    body: "",
    imageUrl: "",
    actionUrl: "",
    inAppTitle: "",
    inAppBody: "",
    inAppCtaText: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      // Strip empty strings so optional fields aren't sent as ""
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '')
      );
      await marketingService.createTemplate(payload as any);
      setFormData({
        name: "",
        description: "",
        title: "",
        body: "",
        imageUrl: "",
        actionUrl: "",
        inAppTitle: "",
        inAppBody: "",
        inAppCtaText: "",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to create template:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create template. Please make sure all required fields are filled.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Notification Template</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="border rounded-lg px-4 py-2 w-full"
                placeholder="e.g., Welcome Offer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2 w-full"
                placeholder="Brief description"
              />
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="font-semibold mb-3">Push Notification</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-4 py-2 w-full"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Body *</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-4 py-2 w-full"
                  placeholder="Notification message"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Action URL</label>
                <input
                  type="url"
                  name="actionUrl"
                  value={formData.actionUrl}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="font-semibold mb-3">In-App Message</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="inAppTitle"
                  value={formData.inAppTitle}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                  placeholder="In-app title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea
                  name="inAppBody"
                  value={formData.inAppBody}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                  placeholder="In-app message"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CTA Text</label>
                <input
                  type="text"
                  name="inAppCtaText"
                  value={formData.inAppCtaText}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                  placeholder="e.g., Learn More"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
