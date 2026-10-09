import type { ChangeEvent } from "react";
import SaveButton from "./SaveButton";

interface BusinessInfoSectionProps {
  businessName: string;
  setBusinessName: (value: string) => void;
  supportEmail: string;
  setSupportEmail: (value: string) => void;
  supportPhone: string;
  setSupportPhone: (value: string) => void;
  warehouseAddress: string;
  setWarehouseAddress: (value: string) => void;
  logo: string;
  handleLogoUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  settingsLoaded: boolean;
  onSave: () => void;
}

export default function BusinessInfoSection({
  businessName, setBusinessName,
  supportEmail, setSupportEmail,
  supportPhone, setSupportPhone,
  warehouseAddress, setWarehouseAddress,
  logo, handleLogoUpload,
  saving, settingsLoaded, onSave,
}: BusinessInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
      <h2 className="text-xl font-semibold mb-2">Business Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={businessName} onChange={e => setBusinessName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Support Email</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Support Phone</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse Address</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={warehouseAddress} onChange={e => setWarehouseAddress(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-6 mt-2">
        <div>
          <label className="block text-sm font-medium mb-1">Logo</label>
          <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoUpload} />
          <label htmlFor="logo-upload" className="inline-block px-4 py-2 bg-gray-100 rounded-lg cursor-pointer border border-gray-200">Upload Logo</label>
        </div>
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
          {logo ? <img src={logo} alt="Logo preview" className="w-full h-full object-contain" /> : <span className="text-gray-400 text-xs">Logo preview</span>}
        </div>
        <SaveButton saving={saving} settingsLoaded={settingsLoaded} onSave={onSave} />
      </div>
    </div>
  );
}
