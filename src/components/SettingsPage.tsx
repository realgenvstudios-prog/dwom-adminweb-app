
import React, { useEffect, useState } from "react";
import settingsService, { type Settings } from "../services/settingsService";
import AdminPushNotificationSettings from "./settings/AdminPushNotificationSettings";
// import AddAdminModal from "./modals/AddAdminModal";
// import ManageRolesModal from "./modals/ManageRolesModal";
// import TemplateManagementModal from "./modals/TemplateManagementModal";
// import AuditLogsModal from "./modals/AuditLogsModal";

const SettingsPage: React.FC = () => {
	const roleTemplates = ["Owner", "Manager", "Finance", "Warehouse", "Support"];
	const adminUsers = [
		{ name: "Ama Serwaa", email: "ama@dwom.com", role: "Owner", lastActive: "2025-12-11 09:12" },
		{ name: "Yaw Mensah", email: "yaw@dwom.com", role: "Manager", lastActive: "2025-12-10 18:44" },
		{ name: "Kojo Owusu", email: "kojo@dwom.com", role: "Finance", lastActive: "2025-12-09 15:20" },
		{ name: "Akosua Dede", email: "akosua@dwom.com", role: "Warehouse", lastActive: "2025-12-08 11:05" },
	];
	const permissionsMatrix = [
		{ role: "Owner", permissions: ["All"] },
		{ role: "Manager", permissions: ["Orders", "Products", "Riders", "Warehouse"] },
		{ role: "Finance", permissions: ["Finance", "Billing"] },
		{ role: "Warehouse", permissions: ["Inventory", "Warehouse"] },
		{ role: "Support", permissions: ["Support", "Customers"] },
	];
	// Business Info
	const [businessName, setBusinessName] = useState("DWOM Ghana Ltd.");
	const [supportEmail, setSupportEmail] = useState("support@dwom.com");
	const [supportPhone, setSupportPhone] = useState("0244000000");
	const [warehouseAddress, setWarehouseAddress] = useState("Accra Central, Ghana");
	const [logo, setLogo] = useState("");

	// Operating Preferences
	const [autoAssignOrders, setAutoAssignOrders] = useState(true);
	const [autoActivateRiders, setAutoActivateRiders] = useState(false);
	const [enableSubscriptionBilling, setEnableSubscriptionBilling] = useState(true);
	const [defaultServiceFee, setDefaultServiceFee] = useState(2);
	const [timezone, setTimezone] = useState("Africa/Accra");
	const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
	const [isServiceClosed, setIsServiceClosed] = useState(false);
	const [serviceClosedMessage, setServiceClosedMessage] = useState("We're closed for the night. See you tomorrow!");

	// Payment & Billing
	const [paystackPub, setPaystackPub] = useState("pk_live_************abcd");
	const [paystackSec, setPaystackSec] = useState("sk_live_************wxyz");
	const [webhookUrl] = useState("https://dwom.com/api/paystack/webhook");
	const [testMode, setTestMode] = useState(false);
	const [retryLogic, setRetryLogic] = useState("Exponential");
	const [maxRetryAttempts, setMaxRetryAttempts] = useState(3);
	const [retryInterval, setRetryInterval] = useState(10);
	const [billingCycle] = useState("Monthly");

	// Email & Notification
	const [smtpKey, setSmtpKey] = useState("");
	const [sendGridKey, setSendGridKey] = useState("");
	const [notifyOrderUpdates, setNotifyOrderUpdates] = useState(true);
	const [notifyFailedSubscriptions, setNotifyFailedSubscriptions] = useState(true);
	const [notifyLowInventory, setNotifyLowInventory] = useState(false);
	const [notifyNewRiders, setNotifyNewRiders] = useState(true);

	// Security & Audit
	const [password, setPassword] = useState("");
	const [enable2FA, setEnable2FA] = useState(false);
	const [ipAccessControlList, setIpAccessControlList] = useState<string[]>(["102.176.0.1", "41.215.12.34"]);

	// UI State
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [settingsLoaded, setSettingsLoaded] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Modal States
	// const [showAddAdminModal, setShowAddAdminModal] = useState(false);
	// const [showManageRolesModal, setShowManageRolesModal] = useState(false);
	// const [showTemplateModal, setShowTemplateModal] = useState(false);
	// const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);

	// Logo upload handler
	const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const reader = new FileReader();
			reader.onload = (ev) => setLogo(ev.target?.result as string);
			reader.readAsDataURL(e.target.files[0]);
		}
	};

	// Load settings from backend
	const loadSettings = async () => {
		try {
			setLoading(true);
			setError(null);
			const s = await settingsService.getSettings();
			setBusinessName(s.businessName ?? "DWOM Ghana Ltd.");
			setSupportEmail(s.supportEmail ?? "support@dwom.com");
			setSupportPhone(s.supportPhone ?? "0244000000");
			setWarehouseAddress(s.warehouseAddress ?? "Accra Central, Ghana");
			setLogo(s.logo ?? "");
			setAutoAssignOrders(!!s.autoAssignOrders);
			setAutoActivateRiders(!!s.autoActivateRiders);
			setEnableSubscriptionBilling(!!s.enableSubscriptionBilling);
			setDefaultServiceFee(s.defaultServiceFee ?? 2);
			setTimezone(s.timezone ?? "Africa/Accra");
			setDateFormat(s.dateFormat ?? "DD/MM/YYYY");
			setIsServiceClosed(!!s.isServiceClosed);
			setServiceClosedMessage(s.serviceClosedMessage ?? "We're closed for the night. See you tomorrow!");
			setTestMode(!!s.testMode);
			setRetryLogic(s.retryLogic ?? "Exponential");
			setMaxRetryAttempts(s.maxRetryAttempts ?? 3);
			setRetryInterval(s.retryInterval ?? 10);
			setNotifyOrderUpdates(!!s.notifyOrderUpdates);
			setNotifyFailedSubscriptions(!!s.notifyFailedSubscriptions);
			setNotifyLowInventory(!!s.notifyLowInventory);
			setNotifyNewRiders(!!s.notifyNewRiders);
			setEnable2FA(!!s.enable2FA);
			setIpAccessControlList(s.ipAccessControlList ?? []);
		setSettingsLoaded(true);
		} catch (err: any) {
			console.error('❌ Error loading settings:', err);
			setError(err.message || 'Failed to load settings.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSettings();
	}, []);

	// Save handler
	const handleSave = async () => {
		if (!settingsLoaded) {
			setError('Settings failed to load. Please refresh the page before saving.');
			return;
		}
		try {
			setSaving(true);
			setError(null);
			console.log('💾 Saving settings...');

			const updatedSettings: Partial<Settings> = {
				businessName,
				supportEmail,
				supportPhone,
				warehouseAddress,
				logo,
				autoAssignOrders,
				autoActivateRiders,
				enableSubscriptionBilling,
				defaultServiceFee,
				timezone,
				dateFormat,
				isServiceClosed,
				serviceClosedMessage,
				testMode,
				retryLogic,
				maxRetryAttempts,
				retryInterval,
				notifyOrderUpdates,
				notifyFailedSubscriptions,
				notifyLowInventory,
				notifyNewRiders,
				enable2FA,
				ipAccessControlList,
			};

			await settingsService.updateSettings(updatedSettings);
			console.log('✅ Settings saved successfully:', updatedSettings);

			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		} catch (err: any) {
			console.error('❌ Error saving settings:', err);
			setError(err.message || 'Failed to save settings. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const renderSaveButton = () => (
		<div className="mt-4 flex justify-end">
			<button
				className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 shadow-sm"
				onClick={handleSave}
				disabled={saving || !settingsLoaded}
			>
				{saving ? (
					<>
						<svg
							className="animate-spin h-5 w-5 inline mr-2"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Saving...
					</>
				) : (
					"Save Changes"
				)}
			</button>
		</div>
	);

	// Add admin handler
	// const handleAddAdmin = () => {
	// 	setShowAddAdminModal(true);
	// };

	// Manage roles handler
	// const handleManageRoles = () => {
	// 	setShowManageRolesModal(true);
	// };

	// Template management handler
	// const handleTemplateManage = () => {
	// 	setShowTemplateModal(true);
	// };

	// Audit logs handler
	// const handleAuditLogs = () => {
	// 	setShowAuditLogsModal(true);
	// };

	// Danger zone actions
	// const handleDanger = () => {
	//   alert('This action cannot be undone.');
	// };

	return (
		<div className="bg-gray-50 min-h-screen py-10 px-4">
			{loading ? (
				<div className="flex items-center justify-center py-20">
					<svg
						className="animate-spin h-8 w-8 text-blue-600"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p className="ml-3 text-gray-600">Loading settings...</p>
				</div>
			) : (
				<div className="max-w-screen-2xl mx-auto flex flex-col gap-10">
					{/* Error Message */}
					{error && (
						<div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
							{error}
						</div>
					)}

					{/* Success Message */}
					{success && (
						<div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
							✅ Settings saved successfully!
						</div>
					)}

					{/* 1. Business Information */}
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
						{renderSaveButton()}
					</div>
				</div>
				{/* 2. Operating Preferences */}
				<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
					<h2 className="text-xl font-semibold mb-2">Operating Preferences</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="flex items-center gap-3">
							<input type="checkbox" checked={autoAssignOrders} onChange={e => setAutoAssignOrders(e.target.checked)} />
							<span className="text-sm">Order Auto-Assignment</span>
						</div>
						<div className="flex items-center gap-3">
							<input type="checkbox" checked={autoActivateRiders} onChange={e => setAutoActivateRiders(e.target.checked)} />
							<span className="text-sm">Auto-activate new riders</span>
						</div>
						<div className="flex items-center gap-3">
							<input type="checkbox" checked={enableSubscriptionBilling} onChange={e => setEnableSubscriptionBilling(e.target.checked)} />
							<span className="text-sm">Enable Subscription Billing</span>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Default Service Fee (GHS)</label>
							<input type="number" min="0" step="0.5" className="border rounded-lg px-4 py-2 w-full" value={defaultServiceFee} onChange={e => setDefaultServiceFee(Number(e.target.value))} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Timezone</label>
							<select className="border rounded-lg px-4 py-2 w-full" value={timezone} onChange={e => setTimezone(e.target.value)}>
								<option value="Africa/Accra">Africa/Accra</option>
								<option value="Africa/Lagos">Africa/Lagos</option>
								<option value="Africa/Nairobi">Africa/Nairobi</option>
								<option value="Africa/Johannesburg">Africa/Johannesburg</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Date Format</label>
							<select className="border rounded-lg px-4 py-2 w-full" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
								<option value="DD/MM/YYYY">DD/MM/YYYY</option>
								<option value="MM/DD/YYYY">MM/DD/YYYY</option>
								<option value="YYYY-MM-DD">YYYY-MM-DD</option>
							</select>
						</div>
						<div className="md:col-span-2 border border-red-200 rounded-lg p-4 bg-red-50 flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<div>
									<span className="text-sm font-semibold text-red-700">Close Service</span>
									<p className="text-xs text-red-500 mt-0.5">When on, the app will show a closed message to all signed-in users.</p>
								</div>
								<button
									type="button"
									onClick={() => setIsServiceClosed(v => !v)}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isServiceClosed ? 'bg-red-600' : 'bg-gray-300'}`}
								>
									<span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isServiceClosed ? 'translate-x-6' : 'translate-x-1'}`} />
								</button>
							</div>
							{isServiceClosed && (
								<div>
									<label className="block text-xs font-medium text-red-700 mb-1">Message shown to users</label>
									<input
										className="border border-red-300 rounded-lg px-3 py-2 w-full text-sm bg-white"
										value={serviceClosedMessage}
										onChange={e => setServiceClosedMessage(e.target.value)}
										placeholder="We're closed for the night. See you tomorrow!"
									/>
								</div>
							)}
						</div>					{renderSaveButton()}					</div>
				</div>
				{/* 3. User & Roles Management */}
				<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
					<h2 className="text-xl font-semibold mb-2">User & Roles Management</h2>
					<div className="flex flex-col gap-4">
						<div className="flex justify-between items-center mb-2">
							<span className="text-lg font-medium">Admin Users</span>
							{/* <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold" onClick={handleAddAdmin}>Add Admin</button> */}
						</div>
						<table className="min-w-full text-left text-sm mb-2">
							<thead>
								<tr className="text-gray-500 border-b">
									<th className="py-2 pr-4 font-medium">Name</th>
									<th className="py-2 pr-4 font-medium">Email</th>
									<th className="py-2 pr-4 font-medium">Role</th>
									<th className="py-2 pr-4 font-medium">Last Active</th>
								</tr>
							</thead>
							<tbody>
								{adminUsers.map((a, i) => (
									<tr key={i} className="border-b last:border-0">
										<td className="py-2 pr-4 font-medium">{a.name}</td>
										<td className="py-2 pr-4">{a.email}</td>
										<td className="py-2 pr-4">{a.role}</td>
										<td className="py-2 pr-4">{a.lastActive}</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className="flex gap-2 items-center">
							<span className="text-sm font-medium">Role Templates:</span>
							{roleTemplates.map(r => (
								<span key={r} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">{r}</span>
							))}
							{/* <button className="ml-auto px-4 py-2 rounded bg-blue-100 text-blue-700 text-sm font-medium" onClick={handleManageRoles}>Manage Roles</button> */}
						</div>
						{/* Permissions Matrix Modal (UI only) */}
						<div className="mt-4">
							<span className="text-sm font-medium mb-2 block">Permissions Matrix</span>
							<div className="overflow-x-auto">
								<table className="min-w-full text-xs border">
									<thead>
										<tr className="bg-gray-50">
											<th className="p-2 border">Role</th>
											<th className="p-2 border">Permissions</th>
										</tr>
									</thead>
									<tbody>
										{permissionsMatrix.map((row, i) => (
											<tr key={i}>
												<td className="p-2 border font-semibold">{row.role}</td>
												<td className="p-2 border">{row.permissions.join(", ")}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
					{renderSaveButton()}
				</div>
				{/* 4. Payment & Billing Settings */}
				<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
					<h2 className="text-xl font-semibold mb-2">Payment & Billing Settings</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium mb-1">Paystack Public Key</label>
							<input className="border rounded-lg px-4 py-2 w-full" value={paystackPub} onChange={e => setPaystackPub(e.target.value)} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Paystack Secret Key</label>
							<input className="border rounded-lg px-4 py-2 w-full" value={paystackSec} onChange={e => setPaystackSec(e.target.value)} type="password" />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Webhook URL</label>
							<input className="border rounded-lg px-4 py-2 w-full" value={webhookUrl} readOnly />
						</div>
						<div className="flex items-center gap-3 mt-2">
							<input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} />
							<span className="text-sm">Test Mode</span>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Retry Logic</label>
							<select className="border rounded-lg px-4 py-2 w-full" value={retryLogic} onChange={e => setRetryLogic(e.target.value)}>
								<option>Exponential</option>
								<option>Linear</option>
								<option>None</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Max Retry Attempts</label>
							<input type="number" className="border rounded-lg px-4 py-2 w-full" value={maxRetryAttempts} onChange={e => setMaxRetryAttempts(Number(e.target.value))} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Retry Interval (min)</label>
							<input type="number" className="border rounded-lg px-4 py-2 w-full" value={retryInterval} onChange={e => setRetryInterval(Number(e.target.value))} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Billing Cycle</label>
							<input className="border rounded-lg px-4 py-2 w-full" value={billingCycle} readOnly />
						</div>
					</div>
					{renderSaveButton()}
				</div>
				{/* 5. Email & Notification Settings */}
				<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
					<h2 className="text-xl font-semibold mb-2">Email & Notification Settings</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium mb-1">SMTP API Key</label>
							<input className="border rounded-lg px-4 py-2 w-full" value={smtpKey} onChange={e => setSmtpKey(e.target.value)} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">SendGrid API Key</label>
							<input className="border rounded-lg px-4 py-2 w-full" value={sendGridKey} onChange={e => setSendGridKey(e.target.value)} />
						</div>
						<div className="flex flex-col gap-2 mt-2">
							<span className="text-sm font-medium mb-1">Notification Types</span>
							<div className="flex items-center gap-3">
								<input type="checkbox" checked={notifyOrderUpdates} onChange={e => setNotifyOrderUpdates(e.target.checked)} />
								<span className="text-sm">Order updates</span>
							</div>
							<div className="flex items-center gap-3">
								<input type="checkbox" checked={notifyFailedSubscriptions} onChange={e => setNotifyFailedSubscriptions(e.target.checked)} />
								<span className="text-sm">Failed subscription payments</span>
							</div>
							<div className="flex items-center gap-3">
								<input type="checkbox" checked={notifyLowInventory} onChange={e => setNotifyLowInventory(e.target.checked)} />
								<span className="text-sm">Low inventory alerts</span>
							</div>
							<div className="flex items-center gap-3">
								<input type="checkbox" checked={notifyNewRiders} onChange={e => setNotifyNewRiders(e.target.checked)} />
								<span className="text-sm">New rider signup</span>
							</div>
							<button className="mt-2 px-4 py-2 rounded bg-blue-100 text-blue-700 text-sm font-medium" onClick={() => {}}>Template Management</button>
						</div>
					</div>
					{renderSaveButton()}
					<AdminPushNotificationSettings />
				</div>
				{/* 6. Security & Audit */}
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
						{renderSaveButton()}
					</div>
				</div>
			)}

			{/* Modals */}
			{/* <AddAdminModal 
				isOpen={showAddAdminModal} 
				onClose={() => setShowAddAdminModal(false)}
				onSuccess={() => {
					setSuccess(true);
					setTimeout(() => setSuccess(false), 3000);
				}}
			/>
			<ManageRolesModal 
				isOpen={showManageRolesModal} 
				onClose={() => setShowManageRolesModal(false)}
			/>
			<TemplateManagementModal 
				isOpen={showTemplateModal} 
				onClose={() => setShowTemplateModal(false)}
			/>
			<AuditLogsModal 
				isOpen={showAuditLogsModal} 
				onClose={() => setShowAuditLogsModal(false)}
			/> */}
		</div>
	);
};

export default SettingsPage;
