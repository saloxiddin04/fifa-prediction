import React from 'react';
import { motion } from 'framer-motion';
import { FaMousePointer, FaSlidersH, FaChartBar, FaLightbulb } from 'react-icons/fa';

const HowToUse = ({ onClose }) => {
  const steps = [
    {
      icon: <FaMousePointer />,
      title: "Select Player Type",
      description: "Choose between Field Player or Goalkeeper based on the position you want to predict.",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: <FaSlidersH />,
      title: "Adjust Attributes",
      description: "Use sliders to set player attributes from 0 (Poor) to 100 (Excellent). You can also use templates.",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: <FaChartBar />,
      title: "Get Prediction",
      description: "Click 'Predict Position' to get AI-powered position prediction with confidence scores.",
      color: "text-purple-600 bg-purple-100"
    },
    {
      icon: <FaLightbulb />,
      title: "Analyze Results",
      description: "View detailed analysis including probability distribution and position recommendations.",
      color: "text-orange-600 bg-orange-100"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-fifa-blue to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">How to Use FIFA Predictor</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            Follow these simple steps to predict player positions using AI
          </p>
        </div>

        {/* Steps */}
        <div className="p-6">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.color}`}>
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  <div className="text-center text-sm font-bold text-gray-500 mt-1">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                  <p className="text-gray-600 mt-1">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tips Section */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
              <FaLightbulb className="mr-2" />
              Pro Tips
            </h4>
            <ul className="text-yellow-700 space-y-1">
              <li>• Use templates for quick testing</li>
              <li>• Randomize attributes for creative combinations</li>
              <li>• Check model statistics for accuracy information</li>
              <li>• Higher confidence scores indicate more reliable predictions</li>
            </ul>
          </div>

          {/* API Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h4 className="font-bold text-blue-800 mb-2">API Endpoints</h4>
            <div className="space-y-2 text-sm text-black">
              <code className="block bg-white p-2 rounded border">POST /api/predict</code>
              <code className="block bg-white p-2 rounded border">GET /api/stats</code>
              <code className="block bg-white p-2 rounded border">GET /api/features</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-fifa-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HowToUse;