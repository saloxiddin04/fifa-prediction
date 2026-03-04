import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaTrophy, 
  FaChartPie, 
  FaStar,
  FaFutbol,
  FaShieldAlt,
  FaChevronRight,
  FaCheckCircle,
  FaPercentage
} from 'react-icons/fa';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const ResultDisplay = ({ prediction }) => {
  if (!prediction) return null;

  const isGK = prediction.player_type === 'goalkeeper';
  const COLORS = ['#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];

  const getPositionColor = (position) => {
    const colors = {
      'Forward': 'bg-red-100 text-red-800 border-red-300',
      'Winger': 'bg-orange-100 text-orange-800 border-orange-300',
      'Midfielder': 'bg-green-100 text-green-800 border-green-300',
      'DefensiveMid': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'CenterBack': 'bg-blue-100 text-blue-800 border-blue-300',
      'FullBack': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'Other': 'bg-gray-100 text-gray-800 border-gray-300',
      'Elite': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Gold': 'bg-amber-100 text-amber-800 border-amber-300',
      'Silver': 'bg-gray-100 text-gray-800 border-gray-300',
      'Bronze': 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[position] || colors.Other;
  };

  const getPositionIcon = (position) => {
    if (position.includes('Forward') || position.includes('Winger')) return '⚽';
    if (position.includes('Midfielder')) return '🎯';
    if (position.includes('Defender') || position.includes('Back')) return '🛡️';
    if (position === 'Goalkeeper') return '🧤';
    return '👤';
  };

  const getConfidenceColor = (confidence) => {
    switch(confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Prepare data for charts
  const pieData = prediction.top_predictions?.map((pred, index) => ({
    name: isGK ? pred.level : pred.position,
    value: Math.round(pred.probability * 100),
    color: COLORS[index % COLORS.length]
  })) || [];

  const barData = prediction.top_predictions?.map((pred, index) => ({
    name: isGK ? pred.level : pred.position,
    probability: Math.round(pred.probability * 100),
    fill: COLORS[index]
  })) || [];

  const mainPrediction = isGK ? prediction.predicted_level : prediction.predicted_position;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fifa-blue to-blue-600 flex items-center justify-center">
              <FaTrophy className="text-2xl text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-fifa-gold rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-sm text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-gray-800">Prediction Result</h2>
            <p className="text-gray-600">
              {isGK ? 'Goalkeeper Analysis' : 'Position Analysis'}
            </p>
          </div>
        </div>
        
        <div className={`px-6 py-3 rounded-full border-2 ${getPositionColor(mainPrediction)} flex items-center gap-3`}>
          <span className="text-2xl">{getPositionIcon(mainPrediction)}</span>
          <div>
            <div className="font-bold text-lg">{mainPrediction}</div>
            <div className="text-xs opacity-75">Predicted {isGK ? 'Level' : 'Position'}</div>
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FaChartPie className="text-fifa-blue mr-2" />
          <span className="font-medium text-gray-700">Confidence Score</span>
          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
            {prediction.confidence.toUpperCase()} CONFIDENCE
          </span>
        </div>
        
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div className="flex items-center">
              <FaPercentage className="text-fifa-green mr-1" />
              <span className="text-sm font-semibold text-fifa-blue">
                {Math.round(prediction.probability * 100)}% confidence
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-fifa-blue">
                100%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prediction.probability * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-fifa-green to-green-500"
            />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pie Chart */}
        <div className="space-y-4">
          <div className="flex items-center">
            <FaChartPie className="text-fifa-blue mr-2" />
            <h3 className="font-medium text-gray-700">Probability Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Probability']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-4">
          <div className="flex items-center">
            <FaStar className="text-fifa-blue mr-2" />
            <h3 className="font-medium text-gray-700">Top Predictions</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  label={{ value: 'Probability %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Probability']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar 
                  dataKey="probability" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Predictions List */}
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <FaStar className="text-fifa-blue mr-2" />
          <h3 className="font-medium text-gray-700">Detailed Predictions</h3>
        </div>
        
        <div className="space-y-3">
          {prediction.top_predictions?.map((pred, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                index === 0 
                  ? 'bg-gradient-to-r from-blue-50 to-white border-fifa-blue shadow-md' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  index === 0 ? 'bg-fifa-blue' : 'bg-gray-200'
                }`}>
                  <span className={`font-bold ${index === 0 ? 'text-white' : 'text-gray-700'}`}>
                    #{index + 1}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getPositionColor(isGK ? pred.level : pred.position)} px-3 py-1 rounded-full`}>
                      {isGK ? pred.level : pred.position}
                    </span>
                    {index === 0 && (
                      <span className="flex items-center text-sm text-fifa-green">
                        <FaCheckCircle className="mr-1" />
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.round(pred.probability * 100)}% probability
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-fifa-blue">
                  {Math.round(pred.probability * 100)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Confidence
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Position Details */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
      >
        <div className="flex items-center mb-3">
          <FaFutbol className="text-fifa-blue mr-2" />
          <h4 className="font-medium text-gray-700">Position Details</h4>
        </div>

        {prediction?.key_features && prediction?.key_features?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {prediction?.key_features.map((feature, idx) => (
              <div key={idx} className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                <FaStar className="text-fifa-gold mr-2 text-sm" />
                <span className="text-sm font-medium text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No details!</p>
        )}
        
        {/*{!isGK ? (*/}
        {/*  <div className="text-gray-700">*/}
        {/*    {prediction.predicted_position === 'Forward' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🎯 <strong>Forward</strong> - Primary goal scorer</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Key Attributes: Finishing, Positioning, Shot Power</li>*/}
        {/*          <li>Role: Score goals, create attacking opportunities</li>*/}
        {/*          <li>Examples: ST (Striker), CF (Center Forward), LW/RW (Wingers)</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {prediction.predicted_position === 'Midfielder' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🔄 <strong>Midfielder</strong> - Game controller</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Key Attributes: Passing, Dribbling, Vision, Stamina</li>*/}
        {/*          <li>Role: Link defense and attack, control tempo</li>*/}
        {/*          <li>Examples: CAM (Attacking Mid), CM (Center Mid), CDM (Defensive Mid)</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {prediction.predicted_position === 'DefensiveMid' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🛡️ <strong>Defensive Midfielder</strong> - Defensive shield</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Key Attributes: Interceptions, Tackling, Strength, Positioning</li>*/}
        {/*          <li>Role: Protect defense, break up attacks</li>*/}
        {/*          <li>Examples: CDM, LDM, RDM</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {prediction.predicted_position === 'CenterBack' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🧱 <strong>Center Back</strong> - Central defender</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Key Attributes: Marking, Strength, Heading, Tackling</li>*/}
        {/*          <li>Role: Prevent goals, organize defense</li>*/}
        {/*          <li>Examples: CB, LCB, RCB</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {prediction.predicted_position === 'FullBack' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🏃 <strong>Full Back</strong> - Wide defender</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Key Attributes: Pace, Crossing, Stamina, Tackling</li>*/}
        {/*          <li>Role: Defend wide areas, support attacks</li>*/}
        {/*          <li>Examples: LB, RB, LWB, RWB</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*  </div>*/}
        {/*) : (*/}
        {/*  <div className="text-gray-700">*/}
        {/*    {prediction.predicted_level === 'Elite' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🏆 <strong>Elite Goalkeeper</strong> - World Class</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Characteristics: Exceptional reflexes, positioning, and leadership</li>*/}
        {/*          <li>Suitable for: Top-tier clubs and international teams</li>*/}
        {/*          <li>Overall Rating: 85+</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {prediction.predicted_level === 'Gold' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🥇 <strong>Gold Goalkeeper</strong> - High Quality</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Characteristics: Reliable, consistent, good technical skills</li>*/}
        {/*          <li>Suitable for: Professional leagues and cup competitions</li>*/}
        {/*          <li>Overall Rating: 75-84</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {prediction.predicted_level === 'Silver' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🥈 <strong>Silver Goalkeeper</strong> - Solid Professional</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Characteristics: Good fundamentals, developing skills</li>*/}
        {/*          <li>Suitable for: Lower divisions and backup roles</li>*/}
        {/*          <li>Overall Rating: 65-74</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {prediction.predicted_level === 'Bronze' && (*/}
        {/*      <div>*/}
        {/*        <p className="font-medium mb-2">🥉 <strong>Bronze Goalkeeper</strong> - Developing Talent</p>*/}
        {/*        <ul className="text-sm space-y-1 ml-5 list-disc">*/}
        {/*          <li>Characteristics: Basic skills, potential for growth</li>*/}
        {/*          <li>Suitable for: Youth teams and lower levels</li>*/}
        {/*          <li>Overall Rating: Below 65</li>*/}
        {/*        </ul>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*  </div>*/}
        {/*)}*/}
      </motion.div>
    </motion.div>
  );
};

export default ResultDisplay;