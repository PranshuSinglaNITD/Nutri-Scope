import { Factory, Leaf, TestTube } from 'lucide-react';

type ProcessingMeterProps={
  level: 1 | 2 | 3 | 4; // 1 = Unprocessed, 4 = Ultra-processed
  title: string;        // e.g., "NOVA Group 4"
  description: string;  // e.g., "Industrial formulation with 5+ additives."
}

export const ProcessingMeter = ({ level, title, description }: ProcessingMeterProps) => {
  const levels = [
    { color: 'bg-green-500', label: 'Natural' },
    { color: 'bg-yellow-400', label: 'Culinary' },
    { color: 'bg-orange-500', label: 'Processed' },
    { color: 'bg-red-500', label: 'Ultra' },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          {level === 1 ? <Leaf size={18} className="text-green-500"/> : 
           level === 4 ? <Factory size={18} className="text-red-500"/> :
           <TestTube size={18} className="text-orange-500"/>}
          Processing Level
        </h3>
        <span className="text-xs font-mono text-gray-400">NOVA {level}</span>
      </div>

      {/* The Meter Bar */}
      <div className="flex gap-1 h-3 mb-3">
        {levels.map((l, i) => (
          <div 
            key={i}
            className={`flex-1 rounded-full transition-all duration-500 ${
              i + 1 === level ? l.color : 'bg-gray-100 opacity-40'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col">
        <span className={`font-bold text-sm ${
          level === 1 ? 'text-green-700' : level === 4 ? 'text-red-700' : 'text-gray-700'
        }`}>
          {title}
        </span>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};