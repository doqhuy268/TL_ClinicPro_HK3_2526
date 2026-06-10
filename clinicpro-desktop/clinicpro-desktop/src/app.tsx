// # src/app.tsx

import './index.css'; // import css

import * as React from "react";
import { createRoot } from "react-dom/client";
import { AppMode, AppStep, Counter } from './types';
import ModeSelection from './components/ModeSelection';
import CounterSelection from './components/CounterSelection';
import CounterDashboard from './components/CounterDashboard';
import ClinicDashboard from './components/ClinicDashboard';
import KioskScreen from './components/KioskScreen';
import StartServices from './components/StartServices';

const App: React.FC = () => {
  const [appMode, setAppMode] = React.useState<AppMode | null>(null);
  const [appStep, setAppStep] = React.useState<AppStep>('select-mode');
  const [selectedCounter, setSelectedCounter] = React.useState<Counter | null>(null);

  const handleSelectMode = (mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'counter') {
      setAppStep('select-counter');
    } else if (mode === 'clinic') {
      setAppStep('counter-dashboard'); // For now, show clinic dashboard directly
    } else if (mode === 'kiosk') {
      setAppStep('kiosk');
    } else if (mode === 'start-services') {
      setAppStep('start-services');
    }
  };

  const handleSelectCounter = (counter: Counter) => {
    setSelectedCounter(counter);
    setAppStep('counter-dashboard');
  };

  const handleBack = () => {
    if (appStep === 'counter-dashboard') {
      if (appMode === 'counter') {
        setAppStep('select-counter');
        setSelectedCounter(null);
      } else {
        setAppStep('select-mode');
        setAppMode(null);
      }
    } else if (appStep === 'select-counter') {
      setAppStep('select-mode');
      setAppMode(null);
    } else if (appStep === 'kiosk') {
      setAppStep('select-mode');
      setAppMode(null);
    } else if (appStep === 'start-services') {
      setAppStep('select-mode');
      setAppMode(null);
    }
  };

  const renderCurrentStep = () => {
    switch (appStep) {
      case 'select-mode':
        return <ModeSelection onSelectMode={handleSelectMode} />;
      
      case 'select-counter':
        return (
          <CounterSelection
            onSelectCounter={handleSelectCounter}
            onBack={handleBack}
          />
        );
      
      case 'counter-dashboard':
        if (appMode === 'counter' && selectedCounter) {
          return (
            <CounterDashboard
              counter={selectedCounter}
              onBack={handleBack}
            />
          );
        } else if (appMode === 'clinic') {
          return <ClinicDashboard onBack={handleBack} />;
        }
        break;
      case 'kiosk':
        if (appMode === 'kiosk') {
          return <KioskScreen onBack={handleBack} />;
        }
        break;
      case 'start-services':
        if (appMode === 'start-services') {
          return <StartServices onBack={handleBack} />;
        }
        break;
      
      default:
        return <ModeSelection onSelectMode={handleSelectMode} />;
    }
  };

  return (
    <React.StrictMode>
      <div className="min-h-screen">
        {renderCurrentStep()}
      </div>
    </React.StrictMode>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
