import { useEffect, useState } from "react";
import adminsService from "../../services/adminsService";
import settingsService from "../../services/settingsService";
import { logger } from "../../utils/logger";

// Moved off the standalone Settings page — Admins already has a real,
// working "Recent Admin Activity" feed, which made Settings' old "View
// Audit Logs" button (a no-op) fully redundant, so that button was
// dropped entirely rather than moved. Change Password is now wired to
// the real self-service endpoint (PATCH /admin/change-password) instead
// of carrying forward the old field, which never actually saved
// anywhere. Enable 2FA / IP Access Control List remain app-wide policy
// toggles with no enforcement behind them yet — moved as-is, same
// settingsService persistence as before.
export default function AdminSecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [enable2FA, setEnable2FA] = useState(false);
  const [ipAccessControlList, setIpAccessControlList] = useState<string[]>([]);
  const [policyLoaded, setPolicyLoaded] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySuccess, setPolicySuccess] = useState(false);

  useEffect(() => {
    settingsService.getSettings()
      .then((s) => {
        setEnable2FA(!!s.enable2FA);
        setIpAccessControlList(s.ipAccessControlList ?? []);
        setPolicyLoaded(true);
      })
      .catch((err) => {
        logger.error('❌ Failed to load security policy settings:', err);
        setPolicyError('Failed to load security settings.');
      });
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    try {
      setChangingPassword(true);
      await adminsService.changeOwnPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      logger.error('❌ Failed to change password:', err);
      setPasswordError(err.message || 'Failed to change password. Check your current password and try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      setSavingPolicy(true);
      setPolicyError(null);
      await settingsService.updateSettings({ enable2FA, ipAccessControlList });
      setPolicySuccess(true);
      setTimeout(() => setPolicySuccess(false), 3000);
    } catch (err: any) {
      logger.error('❌ Failed to save security policy settings:', err);
      setPolicyError(err.message || 'Failed to save settings.');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Account Security</h3>

      <form onSubmit={handleChangePassword} className="flex flex-col gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Change your password</label>
        <input
          type="password"
          placeholder="Current password"
          className="border rounded-lg px-3 py-2 text-sm"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New password"
          className="border rounded-lg px-3 py-2 text-sm"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          className="border rounded-lg px-3 py-2 text-sm"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
        {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
        {passwordSuccess && <p className="text-xs text-green-600">Password changed.</p>}
        <button
          type="submit"
          disabled={changingPassword}
          className="self-start px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {changingPassword ? 'Changing…' : 'Change Password'}
        </button>
      </form>

      <div className="border-t pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} />
          <span className="text-sm">Enable 2FA (app-wide)</span>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">IP Access Control List</label>
          <div className="flex flex-wrap gap-2">
            {ipAccessControlList.map((ip, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">{ip}</span>
            ))}
          </div>
        </div>
        {policyError && <p className="text-xs text-red-600">{policyError}</p>}
        {policySuccess && <p className="text-xs text-green-600">Saved.</p>}
        <button
          onClick={handleSavePolicy}
          disabled={!policyLoaded || savingPolicy}
          className="self-start px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {savingPolicy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
