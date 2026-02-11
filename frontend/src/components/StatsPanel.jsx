import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, 
  FaDatabase, 
  FaCogs, 
  FaUsers,
  FaPercentage,
  FaSync,
  FaInfoCircle
} from 'react-icons/fa';
import { predictionAPI } from '../services/api';

const StatsPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await predictionAPI.getStats();
      setStats(response.data.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaChartLine className="text-2xl text-fifa-blue mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Model Statistics</h3>
        </div>
        <button
          onClick={loadStats}
          className="p-2 text-gray-500 hover:text-fifa-blue hover:bg-blue-50 rounded-lg transition-all"
          title="Refresh stats"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 mb-4 flex items-center">
          <FaInfoCircle className="mr-1" />
          Last updated: {lastUpdated}
        </div>
      )}

      {/* Field Model Stats */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FaCogs className="text-fifa-green mr-2" />
          <h4 className="font-medium text-gray-700">Field Player Model</h4>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
            {stats.field_model?.accuracy_percentage || 0}% ACC
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-fifa-blue">
              {stats.field_model?.samples?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-600">Training Samples</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.field_model?.features_count || '0'}
            </div>
            <div className="text-xs text-gray-600">Features</div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Accuracy</span>
            <span className="text-sm font-bold text-fifa-blue">
              {(stats.field_model?.accuracy_percentage || 0).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.field_model?.accuracy_percentage || 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-fifa-green to-green-500 h-2 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* GK Model Stats */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FaDatabase className="text-fifa-green mr-2" />
          <h4 className="font-medium text-gray-700">Goalkeeper Model</h4>
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
            {stats.gk_model?.accuracy_percentage || 0}% ACC
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats.gk_model?.samples?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-600">Training Samples</div>
          </div>
          
          <div className="bg-pink-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">
              {stats.gk_model?.features_count || '0'}
            </div>
            <div className="text-xs text-gray-600">Features</div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Accuracy</span>
            <span className="text-sm font-bold text-purple-600">
              {(stats.gk_model?.accuracy_percentage || 0).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.gk_model?.accuracy_percentage || 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Total Stats */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center mb-3">
          <FaUsers className="text-fifa-blue mr-2" />
          <h4 className="font-medium text-gray-700">Overall Statistics</h4>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-700">
              {((stats.field_model?.samples || 0) + (stats.gk_model?.samples || 0)).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total Players</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-700">
              {(((stats.field_model?.features_count || 0) + (stats.gk_model?.features_count || 0))).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total Features</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-700">
              {(stats.field_model?.position_classes?.length || 0) + 4}
            </div>
            <div className="text-xs text-gray-600">Total Classes</div>
          </div>
        </div>
      </div>

      {/* Model Performance */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-700 mb-3 flex items-center">
          <FaPercentage className="mr-2" />
          Model Performance
        </h4>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Field Model</span>
              <span className="text-sm font-bold">
                {(stats.field_model?.accuracy_percentage || 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-fifa-green to-green-500 h-2 rounded-full"
                style={{ width: `${stats.field_model?.accuracy_percentage || 0}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">GK Model</span>
              <span className="text-sm font-bold">
                {(stats.gk_model?.accuracy_percentage || 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                style={{ width: `${stats.gk_model?.accuracy_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsPanel;