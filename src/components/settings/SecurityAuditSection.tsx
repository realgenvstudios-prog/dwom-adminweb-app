import SaveButton from "./SaveButton";

interface SecurityAuditSectionProps {
  password: string;
  setPassword: (value: string) => void;
  enable2FA: boolean;
  setEnable2FA: (value: boolean) => void;
  ipAccessControlList: string[];
  saving: boolean;
  settingsLoaded: boolean;
  onSave: () => void;
}

export default function SecurityAuditSection({
  password, setPassword,
  enable2FA, setEnable2FA,
  ipAccessControlList,
  saving, settingsLoaded, onSave,
}: SecurityAuditSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
      <h2 className="text-xl font-semibold mb-2">Security & Audit</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Change Password</label>
          <input type="password" className="border rounded-lg px-4 py-2 w-full" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={enable2FA} onChange={e => setEnable2FA(e.target.checked)} />
          <span className="text-sm">Enable 2FA</span>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">IP Access Control List</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ipAccessControlList.map((ip, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">{ip}</span>
            ))}
          </div>
        </div>
        <button className="mt-2 px-4 py-2 rounded bg-blue-100 text-blue-700 text-sm font-medium" onClick={() => {}}>View Audit Logs</button>
      </div>
      <SaveButton saving={saving} settingsLoaded={settingsLoaded} onSave={onSave} />
    </div>
  );
}
