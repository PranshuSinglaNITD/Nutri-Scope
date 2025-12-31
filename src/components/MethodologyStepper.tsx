import React from 'react';
import { ChefHat, Flame, Droplets } from 'lucide-react';

type ProcessStep={
  action: string;
  detail: string;
  tip?: string;
}

type MethodologyStepperProps={
  title: string;
  steps: string[];
}


export const MethodologyStepper = ({ title, steps } : MethodologyStepperProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ChefHat className="w-5 h-5 text-indigo-500" />
        {title}
      </h3>

      <div className="relative pl-2">
        {/* Vertical Line */}
        <div className="absolute left-2 top-2 bottom-4 w-0.5 bg-gray-100"></div>

        {steps.map((s, index) => {
            const step=JSON.parse(s)
          return (
            <div key={index} className="relative flex gap-4 mb-8 last:mb-0 group">
            
            {/* Number Bubble */}
            <div className="relative z-10 shrink-0 w-8 h-8 rounded-full bg-white border-2 border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:border-indigo-500 group-hover:bg-indigo-50 transition-colors">
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 -mt-1">
              <h4 className="font-semibold text-gray-800 text-sm mb-1">{step.action}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.detail}
              </p>
              
              {/* Optional: Context Tag */}
              {step.tip && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                  <Flame className="w-3 h-3" />
                  <span>Pro Tip: {step.tip}</span>
                </div>
              )}
            </div>
          </div>
          )
        })}
      </div>
    </div>
  );
};

// Usage Example
// <MethodologyStepper 
//    title="How to reduce starch in Potatoes"
//    steps={[
//      { action: "Peel and Cube", detail: "Remove the skin to reduce solanine and chop into even cubes." },
//      { action: "Cold Water Soak", detail: "Soak the cubes in cold water for 30 minutes. You will see the water turn cloudy as starch releases.", tip: "Add a pinch of salt" },
//      { action: "Parboil", detail: "Boil for 5 minutes before roasting to lower the glycemic index." }
//    ]}
// />