import { useState } from 'react';

function TranscriptPanel() {
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([
    { id: 1, text: 'Welcome to the AI Accessibility Assistant.', sentiment: 'neutral', time: 'Now' },
  ]);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const sentimentColors = {
    happy: 'bg-emerald-400',
    angry: 'bg-red-500',
    excited: 'bg-amber-400',
    neutral: 'bg-gray-500',
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <span className="text-lg">📝</span>
        <h2 className="text-sm font-semibold text-gray-200 flex-1">Live Transcript</h2>
        <button
          onClick={toggleListening}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-colors
            ${isListening
              ? 'bg-red-500/20 border-red-500/30 animate-pulse-ring'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '🔴' : '🎙️'}
        </button>
      </div>

      {/* Transcript List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {transcripts.length === 0 ? (
          <p className="text-white/25 text-xs text-center mt-4">
            🎙️ Press the microphone button to start live transcription.
          </p>
        ) : (
          transcripts.map((entry) => (
            <div key={entry.id} className="flex gap-2.5 items-stretch">
              <div className={`w-[3px] rounded-full flex-shrink-0 ${sentimentColors[entry.sentiment] || 'bg-gray-500'}`} />
              <div className="flex-1">
                <p className="text-gray-200 text-sm leading-relaxed">{entry.text}</p>
                <span className="text-white/20 text-[0.65rem]">{entry.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Catch Me Up Button */}
      <div className="p-3 border-t border-white/5 text-center flex-shrink-0">
        <button
          disabled
          className="w-full py-2.5 bg-gradient-to-r from-purple-500/40 to-violet-500/40 border border-purple-500/30 text-white rounded-xl text-sm font-semibold
            hover:from-purple-500/60 hover:to-violet-500/60 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]
            disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ✨ Catch Me Up (AI Summary)
        </button>
        <p className="text-white/20 text-[0.65rem] mt-1.5">Summarizes the last 5 minutes using AI</p>
      </div>
    </>
  );
}

export default TranscriptPanel;
