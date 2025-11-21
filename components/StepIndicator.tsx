import React from 'react';
import { AppStep } from '../types';
import { UploadCloud, Scan, CheckCircle2 } from 'lucide-react';

interface Props {
  currentStep: AppStep;
}

const StepIndicator: React.FC<Props> = ({ currentStep }) => {
  const steps = [
    { id: AppStep.UPLOAD, label: "Upload", icon: UploadCloud },
    { id: AppStep.DETECT, label: "Detection", icon: Scan },
    { id: AppStep.CROP, label: "Export", icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        {/* Connecting Lines */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 -z-10"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                  ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-300 text-slate-400'}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;