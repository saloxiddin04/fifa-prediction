import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFutbol, FaUser, FaUsers, FaRandom, FaUndo } from 'react-icons/fa';
import { IoStatsChart } from 'react-icons/io5';
import { predictionAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const PredictionForm = ({ onPrediction, isLoading, setIsLoading }) => {
  const [playerType, setPlayerType] = useState('field');
  const [features, setFeatures] = useState([]);
  const [featureNames, setFeatureNames] = useState([]);
  const [featureDescriptions, setFeatureDescriptions] = useState({});
  const [samples, setSamples] = useState({});
  const [modelInfo, setModelInfo] = useState(null);

  // Feature descriptions
  const fieldFeatureDescriptions = {
    "Finishing": "Goal scoring ability (1-100)",
    "Dribbling": "Ball control while moving (1-100)",
    "ShortPassing": "Accuracy of short passes (1-100)",
    "LongPassing": "Accuracy of long passes (1-100)",
    "BallControl": "First touch and control (1-100)",
    "SprintSpeed": "Maximum running speed (1-100)",
    "Acceleration": "How quickly player reaches top speed (1-100)",
    "Agility": "Ability to change direction quickly (1-100)",
    "Reactions": "Quickness of response (1-100)",
    "Strength": "Physical power (1-100)",
    "Stamina": "Endurance and fitness (1-100)",
    "Interceptions": "Ability to intercept passes (1-100)",
    "Marking": "Defensive positioning (1-100)",
    "StandingTackle": "Tackling ability while standing (1-100)",
    "Vision": "Awareness and passing vision (1-100)",
    "Positioning": "Strategic positioning (1-100)",
    "Composure": "Calmness under pressure (1-100)",
    "Balance": "Maintaining balance (1-100)",
    "Jumping": "Vertical jump ability (1-100)",
    "Aggression": "Aggressive play style (1-100)"
  };

  const gkFeatureDescriptions = {
    "GKDiving": "Ability to dive for saves (1-100)",
    "GKHandling": "Catching and holding the ball (1-100)",
    "GKKicking": "Kicking accuracy and power (1-100)",
    "GKPositioning": "Positioning in goal (1-100)",
    "GKReflexes": "Quick reaction saves (1-100)",
    "Reactions": "General reaction speed (1-100)",
    "Strength": "Physical strength (1-100)",
    "Jumping": "Vertical jump ability (1-100)",
    "Composure": "Calmness under pressure (1-100)"
  };

  useEffect(() => {
    loadFeatures();
    loadSamples();
    loadModelInfo();
  }, [playerType]);

  const loadFeatures = async () => {
    try {
      const response = await predictionAPI.getFeatures();
      const data = response.data.data;
      
      if (playerType === 'field') {
        setFeatureNames(data.field_features);
        setFeatures(new Array(data.field_features.length).fill(50));
        setFeatureDescriptions(fieldFeatureDescriptions);
      } else {
        setFeatureNames(data.gk_features);
        setFeatures(new Array(data.gk_features.length).fill(50));
        setFeatureDescriptions(gkFeatureDescriptions);
      }
    } catch (error) {
      toast.error('Failed to load features');
    }
  };

  const loadSamples = async () => {
    try {
      const response = await predictionAPI.getSamples();
      setSamples(response.data.data);
    } catch (error) {
      console.error('Failed to load samples');
    }
  };

  const loadModelInfo = async () => {
    try {
      const response = await predictionAPI.getStats();
      setModelInfo(response.data.data);
    } catch (error) {
      console.error('Failed to load model info');
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = Math.min(100, Math.max(0, parseInt(value) || 0));
    setFeatures(newFeatures);
  };

  const handleSampleSelect = (sampleType) => {
    if (playerType === 'field' && samples.field_samples?.[sampleType]) {
      setFeatures(samples.field_samples[sampleType].features);
      toast.success(`${sampleType} sample loaded`);
    } else if (playerType === 'gk' && samples.gk_samples?.[sampleType]) {
      setFeatures(samples.gk_samples[sampleType].features);
      toast.success(`${sampleType} sample loaded`);
    }
  };

  const handleRandomize = () => {
    const newFeatures = features.map(() => Math.floor(Math.random() * 100));
    setFeatures(newFeatures);
    toast.success('Randomized all attributes');
  };

  const handleReset = () => {
    setFeatures(new Array(featureNames.length).fill(50));
    toast.success('Reset all attributes');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const playerData = {
        type: playerType,
        features: features,
        name: `Player ${Date.now().toString().slice(-4)}`
      };

      const response = await predictionAPI.predict(playerData);
      onPrediction(response.data.data);
      toast.success('Prediction successful! 🎉');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Prediction failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaFutbol className="text-3xl text-fifa-blue mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-white">Player Builder</h2>
            <p className="text-white">Adjust attributes and predict position</p>
          </div>
        </div>
        
        {modelInfo && (
          <div className="text-right">
            <div className="flex items-center text-sm text-white">
              <IoStatsChart className="mr-1" />
              <span className="font-semibold">
                {playerType === 'field' 
                  ? `${(modelInfo.field_model.accuracy_percentage)}% accuracy`
                  : `${(modelInfo.gk_model.accuracy_percentage)}% accuracy`
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Player Type Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-white mb-3">
          Select Player Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlayerType('field')}
            className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all ${
              playerType === 'field'
                ? 'bg-fifa-blue text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaUser className="text-2xl mb-2" />
            <span className="font-medium">Field Player</span>
            <span className="text-xs mt-1 opacity-80">
              {modelInfo?.field_model?.features_count || 20} attributes
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setPlayerType('gk')}
            className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all ${
              playerType === 'gk'
                ? 'bg-fifa-blue text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaUsers className="text-2xl mb-2" />
            <span className="font-medium">Goalkeeper</span>
            <span className="text-xs mt-1 opacity-80">
              {modelInfo?.gk_model?.features_count || 9} attributes
            </span>
          </button>
        </div>
      </div>

      {/* Sample Players */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">
          Quick Templates
        </label>
        <div className="flex flex-wrap gap-2">
          {playerType === 'field' && samples.field_samples && Object.keys(samples.field_samples).map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSampleSelect(sample)}
              className="px-4 py-2 text-black bg-gray-100 hover:bg-gray-200 rounded-lg text-sm capitalize transition-all"
            >
              {sample}
            </button>
          ))}
          
          {playerType === 'gk' && samples.gk_samples && Object.keys(samples.gk_samples).map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSampleSelect(sample)}
              className="px-4 py-2 text-black bg-gray-100 hover:bg-gray-200 rounded-lg text-sm capitalize transition-all"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={handleRandomize}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all"
        >
          <FaRandom />
          Randomize
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
        >
          <FaUndo />
          Reset All
        </button>
      </div>

      {/* Features Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-8 max-h-[400px] overflow-y-auto pr-2">
          <label className="block text-sm font-medium text-white mb-4">
            Player Attributes ({featureNames.length})
          </label>
          <div className="space-y-6">
            {featureNames.map((name, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-white">{name}</span>
                    {featureDescriptions[name] && (
                      <p className="text-xs text-gray-300">{featureDescriptions[name]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-fifa-blue bg-blue-50 px-2 py-1 rounded">
                      {features[index]}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={features[index]}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="input-range"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0 (Poor)</span>
                    <span>50 (Average)</span>
                    <span>100 (Excellent)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || featureNames.length === 0}
          className="w-full py-4 bg-gradient-to-r from-fifa-blue to-blue-600 hover:from-blue-600 hover:to-fifa-blue text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Predicting...
            </span>
          ) : (
            '🎯 Predict Position'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default PredictionForm;