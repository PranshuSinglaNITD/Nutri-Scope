import { Scale, TrendingDown, TrendingUp } from 'lucide-react';

type ComparisonCardProps={
  nutrient: string;        // e.g. "Sugar"
  currentValue: string;    // e.g. "24g"
  comparisonText: string;  // e.g. "Equivalent to 6 sugar cubes"
  sentiment: 'positive' | 'negative' | 'neutral';
}

export const ComparisonCard = ({ nutrient, currentValue, comparisonText, sentiment }: ComparisonCardProps) => {
  const color = sentiment === 'positive' ? 'green' : sentiment === 'negative' ? 'red' : 'blue';
  
  return (
    <div className={`p-4 rounded-xl border border-${color}-100 bg-${color}-50/50 mb-4 flex items-center gap-4`}>
      <div className={`p-3 bg-white rounded-full shadow-sm text-${color}-500`}>
        {sentiment === 'positive' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <h4 className="font-bold text-gray-800">{nutrient}: {currentValue}</h4>
        </div>
        <p className={`text-sm text-${color}-700 font-medium mt-0.5`}>
          {comparisonText}
        </p>
      </div>
    </div>
  );
};