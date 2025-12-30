import React, { useState, useEffect } from "react";
import supportService, { type SupportTicket, type SupportMetrics } from "../services/supportService";

const channels = ["All", "In-app", "WhatsApp", "Phone", "Email"];
const statuses = ["All", "Open", "In Progress", "Resolved", "Escalated"];
const priorities = ["Low", "Medium", "High", "Urgent"];
const quickReplies = ["Thank you for reaching out.", "We're looking into this for you.", "Your issue has been escalated.", "Please provide more details."];
const assignees = ["Yaw Mensah", "Ama Serwaa", "Akosua Dede", "Efua Owusu", "Kofi Mensah"];

const priorityColors = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

const statusColors = {
  "Open": "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  "Resolved": "bg-green-100 text-green-700",
  "Escalated": "bg-red-100 text-red-700",
};

const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState(channels[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [reply, setReply] = useState("");
  const [quickReply, setQuickReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsData, metricsData] = await Promise.all([
        supportService.getAllTickets(50),
        supportService.getSupportMetrics(),
      ]);
      
      setTickets(ticketsData);
      setMetrics(metricsData);
      
      if (ticketsData.length > 0 && !selectedTicket) {
        setSelectedTicket(ticketsData[0]);
      }
    } catch (error) {
      console.error("Failed to fetch support data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter(t =>
    (channel === "All" || t.channel === channel) &&
    (status === "All" || t.status === status) &&
    (t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.topic.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedTicket) return;

    try {
      setReplyLoading(true);
      await supportService.sendReply(selectedTicket.id, reply);
      
      // Add message to conversation
      const updatedTicket = {
        ...selectedTicket,
        conversation: [
          ...selectedTicket.conversation,
          { sender: "Admin", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: reply }
        ],
        lastUpdate: `Today ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };
      
      setSelectedTicket(updatedTicket);
      setReply("");
      setQuickReply("");
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      await supportService.updateTicketStatus(selectedTicket.id, newStatus as any);
      setSelectedTicket({ ...selectedTicket, status: newStatus as any });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedTicket) return;
    try {
      await supportService.updateTicketPriority(selectedTicket.id, newPriority as any);
      setSelectedTicket({ ...selectedTicket, priority: newPriority as any });
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const handleAssignChange = async (newAssignee: string) => {
    if (!selectedTicket) return;
    try {
      await supportService.assignTicket(selectedTicket.id, newAssignee);
      setSelectedTicket({ ...selectedTicket, assigned: newAssignee });
    } catch (error) {
      console.error("Failed to assign ticket:", error);
    }
  };

  const pageSize = 20;
  const pageStart = 1;
  const pageEnd = Math.min(pageSize, filtered.length);

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="text-gray-600 text-sm font-medium mb-2">Total Tickets</div>
              <div className="text-3xl font-bold text-gray-900">{metrics.totalTickets}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="text-gray-600 text-sm font-medium mb-2">Open</div>
              <div className="text-3xl font-bold text-blue-600">{metrics.openTickets}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="text-gray-600 text-sm font-medium mb-2">Avg Response</div>
              <div className="text-3xl font-bold text-yellow-600">{metrics.avgResponseTime}m</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="text-gray-600 text-sm font-medium mb-2">Avg Resolution</div>
              <div className="text-3xl font-bold text-green-600">{Math.floor(metrics.avgResolutionTime / 60)}h</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="text-gray-600 text-sm font-medium mb-2">FCR Rate</div>
              <div className="text-3xl font-bold text-purple-600">{metrics.firstContactResolution}%</div>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
            <select className="border rounded-lg px-4 py-2 min-w-[120px] text-base" value={channel} onChange={e => { setChannel(e.target.value); setSelectedTicket(null); }}>
              {channels.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base" value={status} onChange={e => { setStatus(e.target.value); setSelectedTicket(null); }}>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <input
              className="border rounded-lg px-4 py-2 min-w-[200px] flex-1 text-base"
              placeholder="Search by customer, order, or ticket…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedTicket(null); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Ticket List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Tickets ({filtered.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 pr-4 font-medium">Ticket ID</th>
                      <th className="py-2 pr-4 font-medium">Customer</th>
                      <th className="py-2 pr-4 font-medium">Topic</th>
                      <th className="py-2 pr-4 font-medium">Priority</th>
                      <th className="py-2 pr-4 font-medium">Channel</th>
                      <th className="py-2 pr-4 font-medium">Last update</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr
                        key={t.id}
                        className={`border-b last:border-0 cursor-pointer hover:bg-blue-50 transition ${selectedTicket?.id === t.id ? 'bg-blue-100' : ''}`}
                        onClick={() => setSelectedTicket(t)}
                      >
                        <td className="py-2 pr-4 font-medium">{t.id}</td>
                        <td className="py-2 pr-4">{t.customer}</td>
                        <td className="py-2 pr-4">{t.topic}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[t.priority as keyof typeof priorityColors]}`}>{t.priority}</span>
                        </td>
                        <td className="py-2 pr-4">{t.channel}</td>
                        <td className="py-2 pr-4">{t.lastUpdate}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[t.status as keyof typeof statusColors]}`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                  {`${pageStart}–${pageEnd} of ${filtered.length}`}
                </div>
                <div className="flex gap-2 items-center">
                  <button className="px-2 py-1 rounded hover:bg-gray-100">Prev</button>
                  <button className="px-2 py-1 rounded hover:bg-gray-100">Next</button>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {selectedTicket ? (
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-lg">{selectedTicket.subject}</div>
                      <div className="flex gap-2">
                        <select 
                          className="border rounded px-2 py-1 text-xs" 
                          value={selectedTicket.status} 
                          onChange={(e) => handleStatusChange(e.target.value)}
                        >
                          {statuses.filter(s => s !== "All").map(s => <option key={s}>{s}</option>)}
                        </select>
                        <select 
                          className="border rounded px-2 py-1 text-xs" 
                          value={selectedTicket.priority} 
                          onChange={(e) => handlePriorityChange(e.target.value)}
                        >
                          {priorities.map(p => <option key={p}>{p}</option>)}
                        </select>
                        <select 
                          className="border rounded px-2 py-1 text-xs" 
                          value={selectedTicket.assigned} 
                          onChange={(e) => handleAssignChange(e.target.value)}
                        >
                          {assignees.map(a => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>{selectedTicket.customer} ({selectedTicket.phone})</span>
                      {selectedTicket.orderId && <span>Order: {selectedTicket.orderId}</span>}
                      <span>Channel: {selectedTicket.channel}</span>
                      <span>Created: {selectedTicket.created}</span>
                      <span className="font-semibold text-blue-600">SLA: {selectedTicket.sla}</span>
                    </div>
                  </div>

                  {/* Conversation */}
                  <div className="flex-1 overflow-y-auto mb-4 max-h-80">
                    <div className="flex flex-col gap-3">
                      {selectedTicket.conversation.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === "Admin" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm ${msg.sender === "Admin" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{msg.sender}</span>
                              <span className="text-xs text-gray-400">{msg.time}</span>
                            </div>
                            <div>{msg.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Box */}
                  <div className="border-t pt-4 mt-auto">
                    <div className="flex gap-2 mb-2">
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={quickReply}
                        onChange={e => setQuickReply(e.target.value)}
                      >
                        <option value="">Insert quick reply…</option>
                        {quickReplies.map(q => <option key={q}>{q}</option>)}
                      </select>
                      <button
                        className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                        onClick={() => setReply(reply + (quickReply ? (reply ? "\n" : "") + quickReply : ""))}
                      >
                        Insert
                      </button>
                    </div>
                    <textarea
                      className="border rounded-lg px-4 py-2 w-full mb-2 text-sm"
                      rows={3}
                      placeholder="Type your reply…"
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                        onClick={handleSendReply}
                        disabled={!reply.trim() || replyLoading}
                      >
                        {replyLoading ? "Sending..." : "Send reply"}
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        onClick={() => setReply("")}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm flex items-center justify-center h-full min-h-[300px]">
                  Select a ticket to view details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
