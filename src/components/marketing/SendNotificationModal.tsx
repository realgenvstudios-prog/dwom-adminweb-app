import React, { useState, useEffect } from "react";
import marketingService, { type NotificationTemplate } from "../../services/marketingService";
import ridersService from "../../services/ridersService";
import type { Zone } from "../../services/ridersService";

interface SendNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [notificationType, setNotificationType] = useState<'template' | 'custom'>('template');
  const [formData, setFormData] = useState({
    templateId: 0,
    title: '',
    body: '',
    notificationType: 'promotion',
    sendNow: true,
    scheduledFor: new Date().toISOString().split('T')[0],
    targetZones: [] as number[],
    sendSms: false,
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchZones();
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

  const fetchZones = async () => {
    try {
      const data = await ridersService.getAllZones();
      setZones(data);
    } catch (error) {
      console.error("Failed to fetch zones:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

      if (notificationType === 'custom') {
        // Send custom Firebase notification
        const result = await marketingService.sendBroadcastNotification({
          title: formData.title,
          body: formData.body,
          type: formData.notificationType as any,
        });

        console.log('📤 Broadcast notification sent:', result);
        alert(`Notification sent!\nSuccessful: ${result.successCount}\nFailed: ${result.failureCount}`);
      } else {
        // Send using template (legacy)
        const data = {
          templateId: parseInt(formData.templateId.toString()),
          sendNow: formData.sendNow,
          scheduledFor: !formData.sendNow ? formData.scheduledFor : undefined,
          targetZones: formData.targetZones.length > 0 ? formData.targetZones : undefined,
          sendSms: formData.sendSms,
        };
        await marketingService.sendNotification(data);
      }

      setFormData({
        templateId: templates[0]?.id || 0,
        title: '',
        body: '',
        notificationType: 'promotion',
        sendNow: true,
        scheduledFor: new Date().toISOString().split('T')[0],
        targetZones: [],
        sendSms: false,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Failed to send notification: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Send Notification</h2>

        {/* Type Selector */}
        <div className="mb-6 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={notificationType === 'template'}
              onChange={() => setNotificationType('template')}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Use Template</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={notificationType === 'custom'}
              onChange={() => setNotificationType('custom')}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Send Custom Firebase Notification</span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {notificationType === 'template' ? (
            <>
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
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Notification Type</label>
                <select
                  name="notificationType"
                  value={formData.notificationType}
                  onChange={handleChange}
                  className="border rounded-lg px-4 py-2 w-full"
                >
                  <option value="promotion">Promotion</option>
                  <option value="product_update">Product Update</option>
                  <option value="system_message">System Message</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Special Offer!"
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Body *</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Get 20% off on all vegetables today!"
                  rows={3}
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ Firebase notifications will be sent immediately to all active users with device tokens registered.
                </p>
              </div>
            </>
          )}

          {notificationType === 'template' && (
            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.sendSms}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendSms: e.target.checked }))}
                />
                <span className="text-sm font-medium">Also send via SMS (to each recipient's phone number)</span>
              </label>

              <label className="block text-sm font-medium mb-2">Target Zones (Optional - all if empty)</label>
              {zones.length === 0 ? (
                <p className="text-sm text-gray-500">No zones available. Create zones in the Riders Management section.</p>
              ) : (
                <div className="space-y-2">
                  {zones.map((zone) => (
                    <label key={zone.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.targetZones.includes(zone.id)}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            targetZones: prev.targetZones.includes(zone.id)
                              ? prev.targetZones.filter(z => z !== zone.id)
                              : [...prev.targetZones, zone.id],
                          }));
                        }}
                      />
                      <span className="text-sm">{zone.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

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
