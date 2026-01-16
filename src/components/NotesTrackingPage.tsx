import React from "react";
import NotesTracking from "./NotesTracking";

const NotesTrackingPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">📝 Notes & Search Tracking</h1>
      <p className="text-gray-600 mb-8">
        Monitor all user product searches, track common misspellings, and identify products that need better naming
      </p>
      <NotesTracking />
    </div>
  );
};

export default NotesTrackingPage;
