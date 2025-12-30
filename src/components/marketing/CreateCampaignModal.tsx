import React, { useState } from "react";
import marketingService from "../../services/marketingService";

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    channel: "social",
    objective: "awareness",
    title: "",
    content: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    budget: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "budget" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await marketingService.createCampaign(formData);
      setFormData({
        name: "",
        description: "",
        channel: "social",
        objective: "awareness",
        title: "",
        content: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        budget: 0,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Campaign</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="border rounded-lg px-4 py-2 w-full"
                placeholder="e.g., Summer Promotion"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Channel *</label>
              <select name="channel" value={formData.channel} onChange={handleChange} className="border rounded-lg px-4 py-2 w-full">
                <option value="social">Social Media</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="in_app">In-App</option>
                <option value="push">Push Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Objective *</label>
              <select name="objective" value={formData.objective} onChange={handleChange} className="border rounded-lg px-4 py-2 w-full">
                <option value="awareness">Awareness</option>
                <option value="conversion">Conversion</option>
                <option value="retention">Retention</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget (GHS)</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2 w-full"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="border rounded-lg px-4 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2 w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="border rounded-lg px-4 py-2 w-full"
              placeholder="Campaign title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="border rounded-lg px-4 py-2 w-full"
              placeholder="Campaign description"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              className="border rounded-lg px-4 py-2 w-full"
              placeholder="Campaign content/message"
              rows={3}
            />
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
              {loading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
