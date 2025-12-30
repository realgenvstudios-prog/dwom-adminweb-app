import React, { useState, useEffect } from "react";
import marketingService, { type Campaign, type CartCodeAnalytics, type CampaignMetrics } from "../services/marketingService";
import CreateCampaignModal from "./marketing/CreateCampaignModal";
import SendNotificationModal from "./marketing/SendNotificationModal";
import CreateTemplateModal from "./marketing/CreateTemplateModal";

const MarketingPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [cartCodes, setCartCodes] = useState<CartCodeAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("last-7-days");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const channelFilter = selectedChannel !== "all" ? selectedChannel : undefined;
      const campaignData = await marketingService.getCampaigns(undefined, channelFilter);
      setCampaigns(campaignData);

      // Fetch metrics
      const metricsData = await marketingService.getCampaignMetrics();
      setMetrics(metricsData);

      // Fetch cart code analytics
      const codeData = await marketingService.getAllCartCodeAnalytics();
      setCartCodes(codeData);
    } catch (error) {
      console.error("Failed to fetch marketing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedZone, selectedChannel]);

  const kpis = metrics ? [
    { label: "Marketing Spend", value: `GHS ${metrics.totalSpend.toLocaleString()}` },
    { label: "New Customers", value: metrics.totalConversions },
    { label: "CAC", value: `GHS ${Math.round(metrics.totalSpend / (metrics.totalConversions || 1))}` },
    { label: "ROAS", value: `${metrics.avgRoas.toFixed(1)}x` },
    { label: "Conversion Rate", value: `${metrics.conversionRate.toFixed(1)}%` },
    { label: "Click-Through Rate", value: `${((metrics.totalClicks / (metrics.totalImpressions || 1)) * 100).toFixed(1)}%` },
  ] : [];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading marketing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Top Filter Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
            <select className="border rounded-lg px-4 py-2 min-w-[150px] text-base" value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="custom">Custom</option>
            </select>
            <select className="border rounded-lg px-4 py-2 min-w-[150px] text-base" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
              <option value="all">All Zones</option>
              <option value="accra">Accra Central</option>
              <option value="east-legon">East Legon</option>
              <option value="osu">Osu</option>
              <option value="airport">Airport</option>
              <option value="tema">Tema</option>
            </select>
            <select className="border rounded-lg px-4 py-2 min-w-[150px] text-base" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
              <option value="all">All Channels</option>
              <option value="social">Social</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="in_app">In-App</option>
              <option value="push">Push</option>
            </select>
            <div className="flex-1 text-right text-sm text-gray-500 sm:mt-0 mt-2">Showing performance</div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center h-full">
                <span className="text-lg font-medium mb-2 text-center text-gray-600">{kpi.label}</span>
                <span className="text-2xl font-bold text-center text-gray-900">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Left Column - Campaigns */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Active Campaigns ({campaigns.filter(c => c.status === 'active').length})</h3>
                <button onClick={() => setCampaignModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">+ New Campaign</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 pr-4 font-medium">Campaign Name</th>
                      <th className="py-2 pr-4 font-medium">Channel</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Spend</th>
                      <th className="py-2 pr-4 font-medium">Impressions</th>
                      <th className="py-2 pr-4 font-medium">Conversions</th>
                      <th className="py-2 pr-4 font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 5).map((campaign) => (
                      <tr key={campaign.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                        <td className="py-2 pr-4 font-medium">{campaign.name}</td>
                        <td className="py-2 pr-4 capitalize">{campaign.channel.replace('_', ' ')}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">GHS {campaign.actualSpend.toLocaleString()}</td>
                        <td className="py-2 pr-4">{campaign.impressions.toLocaleString()}</td>
                        <td className="py-2 pr-4">{campaign.conversions}</td>
                        <td className="py-2 pr-4">{campaign.roas.toFixed(1)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {campaigns.length === 0 && (
                <p className="text-center text-gray-400 py-8">No campaigns found</p>
              )}
            </div>
          </div>

          {/* Right Column - Promo & Cart Codes */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cart Sharing Codes</h3>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cartCodes.length > 0 ? (
                  cartCodes.map((code) => (
                    <div key={code.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{code.code}</div>
                          <div className="text-xs text-gray-500">Creator: {code.creator}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${code.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {code.isActive ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div className="bg-blue-50 rounded p-2">
                          <div className="font-semibold text-blue-600">{code.totalShares}</div>
                          <div className="text-gray-500">Shares</div>
                        </div>
                        <div className="bg-green-50 rounded p-2">
                          <div className="font-semibold text-green-600">{code.totalUsages}</div>
                          <div className="text-gray-500">Uses</div>
                        </div>
                        <div className="bg-purple-50 rounded p-2">
                          <div className="font-semibold text-purple-600">GHS {code.totalRevenue.toLocaleString()}</div>
                          <div className="text-gray-500">Revenue</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">No cart codes yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <button onClick={() => setCampaignModalOpen(true)} className="w-full border border-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 text-gray-700">Create Campaign</button>
                <button onClick={() => setNotificationModalOpen(true)} className="w-full border border-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 text-gray-700">Send Notification</button>
                <button onClick={() => setTemplateModalOpen(true)} className="w-full border border-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 text-gray-700">Create Template</button>
                <button onClick={() => {
                  const csv = [
                    ['Campaign Name', 'Channel', 'Status', 'Spend', 'Impressions', 'Conversions', 'ROAS'],
                    ...campaigns.map(c => [c.name, c.channel, c.status, c.actualSpend, c.impressions, c.conversions, c.roas])
                  ].map(row => row.join(',')).join('\n');
                  const link = document.createElement('a');
                  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                  link.download = `marketing-report-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }} className="w-full border border-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 text-gray-700">Export Report</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCampaignModal 
        open={campaignModalOpen} 
        onClose={() => setCampaignModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <SendNotificationModal 
        open={notificationModalOpen} 
        onClose={() => setNotificationModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <CreateTemplateModal 
        open={templateModalOpen} 
        onClose={() => setTemplateModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
};

export default MarketingPage;
