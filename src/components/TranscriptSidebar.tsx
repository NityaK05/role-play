import React, { useState } from 'react';

interface TranscriptSidebarProps {
  transcript: any[];
  session: any;
}

const TranscriptSidebar: React.FC<TranscriptSidebarProps> = ({ transcript, session }) => {
  const [error, setError] = useState('');

  const handleDownload = async (format: 'txt' | 'json') => {
    if (!session) return;
    setError('');
    try {
      const res = await fetch(`/api/session/${session.id}/transcript?format=${format}`);
      if (!res.ok) throw new Error('Failed to fetch transcript');
      const blob = await res.blob();
      if (blob.size === 0) {
        setError('Transcript is empty. Try speaking and waiting for an AI response.');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${session.id}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Download failed');
    }
  };

  return (
    <div>
      <h2 className="font-bold mb-2">Transcript</h2>
      <div className="space-y-2">
        {transcript.map((ex, i) => (
          <div key={i} className="p-2 rounded bg-beige text-brown">
            <span className="font-bold">{ex.speaker}:</span> {ex.text}
          </div>
        ))}
      </div>
      {error && <div className="text-red-700 mt-2">{error}</div>}
      {session && (
        <div className="mt-4 flex gap-2">
          <button className="bg-brown text-beige rounded px-2 py-1" onClick={() => handleDownload('txt')}>
            Download .txt
          </button>
          <button className="bg-brown text-beige rounded px-2 py-1" onClick={() => handleDownload('json')}>
            Download .json
          </button>
        </div>
      )}
    </div>
  );
};

export default TranscriptSidebar;
