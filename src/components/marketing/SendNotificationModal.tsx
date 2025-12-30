import React, { useState, useEffect } from "react";
import marketingService, { type NotificationTemplate } from "../../services/marketingService";

interface SendNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [formData, setFormData] = useState({
    templateId: 0,
    sendNow: true,
    scheduledFor: new Date().toISOString().split('T')[0],
    targetZones: [] as number[],
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const data = await marketingService.getTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, templateId: data[0].id }));
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value === "true" ? true : value === "false" ? false : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = {
        templateId: parseInt(formData.templateId.toString()),
        sendNow: formData.sendNow,
        scheduledFor: !formData.sendNow ? formData.scheduledFor : undefined,
        targetZones: formData.targetZones.length > 0 ? formData.targetZones : undefined,
      };
      await marketingService.sendNotification(data);
      setFormData({
        templateId: templates[0]?.id || 0,
        sendNow: true,
        scheduledFor: new Date().toISOString().split('T')[0],
        targetZones: [],
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Send Notification</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template *</label>
            <select
              name="templateId"
              value={formData.templateId}
              onChange={handleChange}
              required
              className="border rounded-lg px-4 py-2 w-full"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sendNow"
                value="true"
                checked={formData.sendNow}
                onChange={() => setFormData(prev => ({ ...prev, sendNow: true }))}
              />
              <span className="text-sm font-medium">Send Immediately</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sendNow"
                value="false"
                checked={!formData.sendNow}
                onChange={() => setFormData(prev => ({ ...prev, sendNow: false }))}
              />
              <span className="text-sm font-medium">Schedule for Later</span>
            </label>
            {!formData.sendNow && (
              <input
                type="datetime-local"
                name="scheduledFor"
                value={formData.scheduledFor}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2 w-full ml-6"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Zones (Optional - all if empty)</label>
            <div className="space-y-2">
              {["Accra Central", "East Legon", "Osu", "Airport", "Tema"].map((zone, idx) => (
                <label key={zone} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.targetZones.includes(idx)}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        targetZones: prev.targetZones.includes(idx)
                          ? prev.targetZones.filter(z => z !== idx)
                          : [...prev.targetZones, idx],
                      }));
                    }}
                  />
                  <span className="text-sm">{zone}</span>
                </label>
              ))}
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
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotificationModal;
