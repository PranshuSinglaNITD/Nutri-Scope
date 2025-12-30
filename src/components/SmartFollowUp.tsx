import { MessageCircleQuestion } from 'lucide-react';

type SmartFollowUpProps={
  questions: string[]; // e.g. ["Is this safe for toddlers?", "Healthy alternatives?"]
  onSelect: (question: string) => void;
}

export const SmartFollowUp = ({ questions, onSelect }: SmartFollowUpProps) => {
  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageCircleQuestion size={16} className="text-purple-500" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dive Deeper</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm rounded-xl transition-colors text-left border border-purple-100"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};