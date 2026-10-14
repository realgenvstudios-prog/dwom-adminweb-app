interface RidersHeaderProps {
  onCreateRider: () => void;
}

export default function RidersHeader({ onCreateRider }: RidersHeaderProps) {
  return (
    <div className="mb-8 flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Riders Management</h1>
        <p className="text-gray-600 mt-1">Manage delivery riders and track performance</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCreateRider}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Rider
        </button>
      </div>
    </div>
  );
}
