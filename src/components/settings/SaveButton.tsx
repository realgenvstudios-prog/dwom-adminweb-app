interface SaveButtonProps {
  saving: boolean;
  settingsLoaded: boolean;
  onSave: () => void;
}

export default function SaveButton({ saving, settingsLoaded, onSave }: SaveButtonProps) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 shadow-sm"
        onClick={onSave}
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
}
