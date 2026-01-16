import React, { useState, useEffect } from "react";

interface NoteRecord {
  id: number;
  userId: number;
  user: {
    id: number;
    email: string;
    phone: string;
  };
  originalText: string;
  status: "pending" | "processed" | "error" | "added_to_cart";
  confidence: number;
  itemsCount: number;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    originalText: string;
    confidence: number;
    matchRatio: number;
  }>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  stats: {
    totalNotes: number;
    processedNotes: number;
    errorNotes: number;
    addedToCart: number;
    avgConfidence: number;
  };
  commonSearches: Array<{
    text: string;
    count: number;
  }>;
  errorNotes: Array<{
    id: number;
    originalText: string;
    notes: string;
    confidence: number;
    createdAt: string;
  }>;
  lowConfidenceMatches: Array<{
    originalText: string;
    searchedAs: string;
    matchedProduct: string;
    confidence: number;
    matchRatio: number;
  }>;
}

const NotesTracking: React.FC = () => {
  const [allNotes, setAllNotes] = useState<NoteRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "processed" | "error" | "added_to_cart">("all");
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all-notes" | "analytics">("analytics");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesRes, analyticsRes] = await Promise.all([
        fetch("/api/notes/admin/all?skip=0&take=50").then(r => r.json()),
        fetch("/api/notes/admin/analytics?limit=100").then(r => r.json()),
      ]);

      setAllNotes(notesRes.data || []);
      setAnalytics(analyticsRes);
    } catch (error) {
      console.error("Failed to fetch notes data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "added_to_cart":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredNotes = filterStatus === "all" ? allNotes : allNotes.filter(n => n.status === filterStatus);

  return (
    <div className="mt-10">
      <div className="flex gap-6 mb-6">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === "analytics"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab("all-notes")}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === "all-notes"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          📝 All Notes ({allNotes.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : activeTab === "analytics" ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          {analytics && (
            <>
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
                  <p className="text-gray-500 text-sm">Total Notes</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.stats.totalNotes}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
                  <p className="text-gray-500 text-sm">Processed</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.stats.processedNotes}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-600">
                  <p className="text-gray-500 text-sm">Errors</p>
                  <p className="text-3xl font-bold text-red-600">{analytics.stats.errorNotes}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-600">
                  <p className="text-gray-500 text-sm">Added to Cart</p>
                  <p className="text-3xl font-bold text-purple-600">{analytics.stats.addedToCart}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-600">
                  <p className="text-gray-500 text-sm">Avg Confidence</p>
                  <p className={`text-3xl font-bold ${getConfidenceColor(analytics.stats.avgConfidence)}`}>
                    {(analytics.stats.avgConfidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Common Searches */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">🔍 Most Common Searches</h3>
                <div className="space-y-2">
                  {analytics.commonSearches.slice(0, 10).map((search, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">{search.text}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {search.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Notes */}
              {analytics.errorNotes.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">❌ Failed Parsing Attempts</h3>
                  <div className="space-y-2">
                    {analytics.errorNotes.slice(0, 10).map((note) => (
                      <div key={note.id} className="p-3 bg-red-50 rounded border border-red-200">
                        <p className="font-semibold text-sm">"{note.originalText}"</p>
                        <p className="text-xs text-gray-600 mt-1">{note.notes}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Confidence Matches */}
              {analytics.lowConfidenceMatches.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">⚠️ Low Confidence Matches (Possible Misspellings)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">What User Searched</th>
                          <th className="text-left py-2">Matched Product</th>
                          <th className="text-left py-2">Confidence</th>
                          <th className="text-left py-2">Match Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.lowConfidenceMatches.map((match, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-2">{match.originalText}</td>
                            <td className="py-2">{match.matchedProduct}</td>
                            <td className={`py-2 font-semibold ${getConfidenceColor(match.confidence)}`}>
                              {(match.confidence * 100).toFixed(1)}%
                            </td>
                            <td className="py-2">{(match.matchRatio * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {["all", "processed", "error", "added_to_cart"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded text-sm font-semibold transition ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {status === "all" ? "All" : status.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Notes List */}
          <div className="space-y-2">
            {filteredNotes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{note.originalText}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        User: {note.user.email || note.user.phone} | Items: {note.itemsCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(note.status)}`}>
                        {note.status.replace(/_/g, " ")}
                      </span>
                      <span className={`text-sm font-bold ${getConfidenceColor(note.confidence)}`}>
                        {(note.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedNoteId === note.id && (
                  <div className="bg-gray-50 p-4 border-t">
                    <h4 className="font-semibold mb-2">Parsed Items:</h4>
                    <div className="space-y-2 mb-4">
                      {note.items.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-semibold">{item.productName}</span>
                            <span className="text-gray-600">× {item.quantity}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Searched as: "{item.originalText}"
                          </p>
                          <p className="text-xs text-gray-500">
                            Confidence: {(item.confidence * 100).toFixed(1)}% | Match: {(item.matchRatio * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                    {note.notes && (
                      <div className="bg-yellow-50 p-3 rounded text-sm">
                        <p className="font-semibold text-yellow-800">Notes:</p>
                        <p className="text-yellow-700">{note.notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      Created: {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {filteredNotes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No notes found with status: {filterStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTracking;
