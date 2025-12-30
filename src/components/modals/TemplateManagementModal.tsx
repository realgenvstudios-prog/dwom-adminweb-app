import React, { useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface TemplateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateManagementModal: React.FC<TemplateManagementModalProps> = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Order Confirmation',
      subject: 'Your order has been confirmed',
      content: 'Dear Customer,\n\nThank you for your order. Your order details are attached.',
    },
    {
      id: '2',
      name: 'Delivery Notification',
      subject: 'Your order is on the way',
      content: 'Dear Customer,\n\nYour order is being delivered. Track your order status here.',
    },
    {
      id: '3',
      name: 'Failed Subscription Payment',
      subject: 'Payment failed for your subscription',
      content: 'Dear Customer,\n\nYour subscription payment could not be processed. Please update your payment method.',
    },
    {
      id: '4',
      name: 'Low Inventory Alert',
      subject: 'Low stock alert',
      content: 'Dear Admin,\n\nThe following items have low stock levels.',
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate({ ...template });
    setEditMode(true);
  };

  const handleSave = () => {
    if (selectedTemplate) {
      const index = templates.findIndex(t => t.id === selectedTemplate.id);
      if (index > -1) {
        const newTemplates = [...templates];
        newTemplates[index] = selectedTemplate;
        setTemplates(newTemplates);
      }
      setEditMode(false);
      setSelectedTemplate(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Email Template Management</h2>

        {!editMode ? (
          <div className="space-y-3">
            {templates.map(template => (
              <div
                key={template.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.subject}</p>
                </div>
                <button
                  onClick={() => handleEdit(template)}
                  className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        ) : selectedTemplate ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name</label>
              <input
                type="text"
                value={selectedTemplate.name}
                onChange={e => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Subject</label>
              <input
                type="text"
                value={selectedTemplate.subject}
                onChange={e => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Content</label>
              <textarea
                value={selectedTemplate.content}
                onChange={e => setSelectedTemplate({ ...selectedTemplate, content: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 h-40"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Save Template
              </button>
            </div>
          </div>
        ) : null}

        {!editMode && (
          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManagementModal;
