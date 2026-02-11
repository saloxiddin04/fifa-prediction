import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import PredictionForm from './components/PredictionForm';
import ResultDisplay from './components/ResultDisplay';
import StatsPanel from './components/StatsPanel';
import Footer from './components/Footer';
import HowToUse from './components/HowToUse';
import './index.css';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handlePrediction = (result) => {
    setPrediction(result);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <AnimatePresence>
        {showInstructions && (
          <HowToUse onClose={() => setShowInstructions(false)} />
        )}
      </AnimatePresence>

      <Header onShowInstructions={() => setShowInstructions(true)} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form and Results */}
          <div className="lg:col-span-2 space-y-8">
            <PredictionForm 
              onPrediction={handlePrediction}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
            
            {prediction && (
              <ResultDisplay prediction={prediction} />
            )}
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-8">
            <StatsPanel />
            
            {/* Quick Guide */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Guide</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <p className="text-gray-600">Select player type (Field or GK)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm font-bold">2</span>
                  </div>
                  <p className="text-gray-600">Adjust attributes using sliders</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 text-sm font-bold">3</span>
                  </div>
                  <p className="text-gray-600">Click "Predict Position"</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-sm font-bold">4</span>
                  </div>
                  <p className="text-gray-600">Analyze results and insights</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowInstructions(true)}
                className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                View Detailed Guide
              </button>
            </div>

            {/* Model Info */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Model Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Field Model Accuracy</span>
                  <span className="font-bold text-green-600">76.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GK Model Accuracy</span>
                  <span className="font-bold text-purple-600">96.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Samples</span>
                  <span className="font-bold">18,147</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Features Used</span>
                  <span className="font-bold">29</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;