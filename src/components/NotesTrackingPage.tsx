import React, { useState, useEffect } from 'react';
import notesService from '../services/notesService';
import type { NotesAnalytics } from '../services/notesService';

const NotesTrackingPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<NotesAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'searches' | 'errors' | 'low-confidence'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await notesService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load notes analytics
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notes & Search Tracking</h1>
        <p className="text-gray-600">Monitor how users search for products using the Notes feature</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm">Total Notes</p>
          <p className="text-3xl font-bold text-blue-600">{analytics.stats.totalNotes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm">Successfully Parsed</p>
          <p className="text-3xl font-bold text-green-600">{analytics.stats.processedNotes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
          <p className="text-gray-600 text-sm">Parsing Errors</p>
          <p className="text-3xl font-bold text-yellow-600">{analytics.stats.errorNotes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <p className="text-gray-600 text-sm">Added to Cart</p>
          <p className="text-3xl font-bold text-purple-600">{analytics.stats.addedToCart}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
          <p className="text-gray-600 text-sm">Avg Confidence</p>
          <p className="text-3xl font-bold text-indigo-600">{(analytics.stats.avgConfidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-6 py-4 font-medium ${
              selectedTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('searches')}
            className={`px-6 py-4 font-medium ${
              selectedTab === 'searches'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Common Searches ({analytics.commonSearches.length})
          </button>
          <button
            onClick={() => setSelectedTab('errors')}
            className={`px-6 py-4 font-medium ${
              selectedTab === 'errors'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Parsing Errors ({analytics.errorNotes.length})
          </button>
          <button
            onClick={() => setSelectedTab('low-confidence')}
            className={`px-6 py-4 font-medium ${
              selectedTab === 'low-confidence'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Low Confidence Matches ({analytics.lowConfidenceMatches.length})
          </button>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Common Searches</h3>
                <div className="space-y-3">
                  {analytics.commonSearches.slice(0, 10).map((search, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{search.text}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {search.count}
                      </span>
                    </div>
                  ))}
                  {analytics.commonSearches.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No searches yet</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-green-600 mb-2">
                      {analytics.stats.totalNotes > 0
                        ? ((analytics.stats.processedNotes / analytics.stats.totalNotes) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                    <p className="text-gray-600">of notes successfully parsed</p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{
                          width: `${
                            analytics.stats.totalNotes > 0
                              ? (analytics.stats.processedNotes / analytics.stats.totalNotes) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Common Searches Tab */}
        {selectedTab === 'searches' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Search Query</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Count</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Frequency %</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.commonSearches.map((search, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{search.text}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {search.count}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {analytics.stats.totalNotes > 0
                          ? ((search.count / analytics.stats.totalNotes) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                  {analytics.commonSearches.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500">
                        No search data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Parsing Errors Tab */}
        {selectedTab === 'errors' && (
          <div className="p-6">
            <div className="space-y-4">
              {analytics.errorNotes.map((error) => (
                <div key={error.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-red-900">{error.originalText}</p>
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                      {new Date(error.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{error.notes}</p>
                  <p className="text-xs text-red-600">
                    Confidence: {(error.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
              {analytics.errorNotes.length === 0 && (
                <p className="text-center py-8 text-gray-500">No parsing errors</p>
              )}
            </div>
          </div>
        )}

        {/* Low Confidence Matches Tab */}
        {selectedTab === 'low-confidence' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User Searched For</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Matched Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Confidence</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Match Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.lowConfidenceMatches.map((match, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{match.originalText}</td>
                      <td className="py-3 px-4">{match.matchedProduct}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          match.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                          match.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(match.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${match.matchRatio * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{(match.matchRatio * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {analytics.lowConfidenceMatches.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        No low confidence matches
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default NotesTrackingPage;
