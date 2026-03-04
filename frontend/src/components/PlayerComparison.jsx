import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Radar, RadarChart, PolarGrid, PolarAngleAxis,
	PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip
} from 'recharts';
import {
	FaTimes, FaSearch, FaFutbol,
	FaShieldAlt, FaUserPlus, FaTrash, FaStar,
	FaSpinner, FaExclamationCircle
} from 'react-icons/fa';
import {TbChartRadar} from "react-icons/tb";
import { comparisonAPI, utilityAPI } from '../services/api.js';

const PlayerComparison = () => {
	const [selectedPlayers, setSelectedPlayers] = useState([]);
	const [comparisonData, setComparisonData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [error, setError] = useState(null);
	const [positions, setPositions] = useState([]);
	const [filterPosition, setFilterPosition] = useState('all');

	// Neon ranglar palitrasi
	const COLORS = [
		'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D',
		'#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
		'#FF9999', '#6DD5FA', '#FFEAA7', '#B5EAD7', '#C7CEEA'
	];

	// Load positions on mount
	useEffect(() => {
		loadPositions();
	}, []);

	const loadPositions = async () => {
		try {
			const response = await utilityAPI.getPositions();
			setPositions(response.data.data || []);
		} catch (error) {
			console.error('Error loading positions:', error);
		}
	};

	// O'yinchilarni qidirish
	useEffect(() => {
		const searchPlayers = async () => {
			if (searchTerm.length < 2) {
				setSearchResults([]);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const response = await comparisonAPI.searchPlayers(searchTerm, 20);
				let results = response.data.data || [];

				// Filter by position if needed
				if (filterPosition !== 'all') {
					results = results.filter(p =>
						(p.MainPosition || p.Position) === filterPosition
					);
				}

				setSearchResults(results);
			} catch (error) {
				console.error('Error searching players:', error);
				setError('Failed to search players. Please try again.');
			} finally {
				setLoading(false);
			}
		};

		const debounce = setTimeout(searchPlayers, 500);
		return () => clearTimeout(debounce);
	}, [searchTerm, filterPosition]);

	// O'yinchini qo'shish
	const addPlayer = async (player) => {
		if (selectedPlayers.some(p => p.id === player.ID)) {
			alert('This player is already added!');
			return;
		}

		if (selectedPlayers.length >= 8) {
			alert('Maximum 8 players can be compared!');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await comparisonAPI.comparePlayers([player.ID]);
			const newPlayer = response.data.data[0];

			if (newPlayer) {
				setSelectedPlayers(prev => [...prev, {
					id: player.ID,
					name: player.Name,
					overall: player.Overall,
					position: player.MainPosition || player.Position,
					club: player.Club,
					type: newPlayer.type
				}]);

				setComparisonData(prev => [...prev, newPlayer]);
			}

			setSearchTerm('');
			setSearchResults([]);
		} catch (error) {
			console.error('Error adding player:', error);
			setError('Failed to add player. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	// O'yinchini o'chirish
	const removePlayer = (playerId) => {
		setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
		setComparisonData(prev => prev.filter(p => p.id !== playerId));
	};

	// Barchasini tozalash
	const clearAll = () => {
		setSelectedPlayers([]);
		setComparisonData([]);
		setError(null);
	};

	// Featurelarni aniqlash (useMemo bilan - infinite loop ni oldini olish)
	const commonFeatures = useMemo(() => {
		if (comparisonData.length === 0) return [];

		// Barcha o'yinchilardagi featurelarni yig'ish
		const allFeatures = new Set();
		comparisonData.forEach(player => {
			Object.keys(player.features || {}).forEach(feat => allFeatures.add(feat));
		});

		// Muhim featurelarni ajratish
		const importantFeatures = [
			'Finishing', 'Dribbling', 'ShortPassing', 'LongPassing', 'BallControl',
			'SprintSpeed', 'Acceleration', 'Agility', 'Reactions', 'Strength',
			'Stamina', 'Interceptions', 'Marking', 'StandingTackle', 'Vision',
			'Positioning', 'Composure', 'Balance', 'Jumping', 'Aggression',
			'GKDiving', 'GKHandling', 'GKKicking', 'GKPositioning', 'GKReflexes'
		];

		// Mavjud va muhim featurelarni filterlash
		const features = Array.from(allFeatures)
			.filter(f => importantFeatures.includes(f))
			.slice(0, 12); // Maksimum 12 feature

		return features;
	}, [comparisonData]); // Faqat comparisonData o'zgarganda qayta hisoblanadi

	// RadarChart ma'lumotlarini tayyorlash (useMemo bilan)
	const chartData = useMemo(() => {
		if (comparisonData.length === 0 || commonFeatures.length === 0) return [];

		return commonFeatures.map(feature => {
			const dataPoint = {
				feature: feature.substring(0, 4).toUpperCase(),
				fullName: feature
			};

			comparisonData.forEach((player) => {
				if (player.features && player.features[feature] !== undefined) {
					dataPoint[player.name] = player.features[feature];
				} else {
					// O'xshash featurelardan o'rtacha hisoblash
					const similarFeatures = Object.keys(player.features || {}).filter(f =>
						f.includes(feature) || feature.includes(f)
					);

					if (similarFeatures.length > 0) {
						const avg = similarFeatures.reduce((sum, f) => sum + (player.features[f] || 0), 0) / similarFeatures.length;
						dataPoint[player.name] = Math.round(avg);
					} else {
						dataPoint[player.name] = 50; // Default qiymat
					}
				}
			});

			return dataPoint;
		});
	}, [comparisonData, commonFeatures]);

	// Custom Tooltip
	const CustomTooltip = ({ active, payload, label }) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-gray-800 text-white p-4 rounded-lg shadow-xl border border-gray-700">
					<p className="font-bold text-lg mb-2 text-blue-400">{payload[0].payload.fullName}</p>
					{payload.map((entry, index) => (
						<div key={index} className="flex items-center justify-between gap-4 py-1">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}:
              </span>
							<span className="font-bold text-white">{Math.round(entry.value)}</span>
						</div>
					))}
				</div>
			);
		}
		return null;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700"
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-white flex items-center">
					<TbChartRadar className="text-blue-500 mr-3 text-3xl" />
					Player Comparison
					{selectedPlayers.length > 0 && (
						<span className="ml-3 text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
              {selectedPlayers.length} / 8
            </span>
					)}
				</h2>

				{selectedPlayers.length > 0 && (
					<button
						onClick={clearAll}
						className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						<FaTrash /> Clear All
					</button>
				)}
			</div>

			{/* Error Display */}
			<AnimatePresence>
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200"
					>
						<FaExclamationCircle className="text-red-400" />
						<span>{error}</span>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Search Section */}
			<div className="relative mb-6">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Search players by name..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<select
						value={filterPosition}
						onChange={(e) => setFilterPosition(e.target.value)}
						className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
					>
						<option value="all">All Positions</option>
						{positions.map(pos => (
							<option key={pos} value={pos}>{pos}</option>
						))}
					</select>
				</div>

				{/* Loading Indicator */}
				{loading && (
					<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
						<FaSpinner className="animate-spin text-blue-500" size={20} />
					</div>
				)}

				{/* Search Results */}
				<AnimatePresence>
					{searchResults.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="absolute z-20 mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
						>
							{searchResults?.map((player) => (
								<motion.div
									key={player.ID}
									whileHover={{ backgroundColor: '#374151' }}
									onClick={() => addPlayer(player)}
									className="p-4 cursor-pointer border-b border-gray-700 last:border-0 hover:bg-gray-700 transition-colors"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div>
												<div className="text-white font-medium">{player.Name}</div>
												<div className="text-sm text-gray-400">
													{player.Overall} OVR • {player.Club || 'Free Agent'} • {player.MainPosition || player.Position}
												</div>
											</div>
										</div>
										<button className="text-blue-400 hover:text-blue-300">
											<FaUserPlus size={20} />
										</button>
									</div>
								</motion.div>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Selected Players */}
			<AnimatePresence>
				{selectedPlayers.length > 0 && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="mb-6"
					>
						<div className="flex flex-wrap gap-3">
							{selectedPlayers.map((player, idx) => (
								<motion.div
									key={player.id}
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									exit={{ scale: 0 }}
									className="group relative"
								>
									<div
										className="flex items-center gap-2 px-4 py-2 rounded-full text-white"
										style={{ backgroundColor: COLORS[idx % COLORS.length] }}
									>
										{player.type === 'gk' ? <FaShieldAlt /> : <FaFutbol />}
										<span className="font-medium">{player.name}</span>
										<span className="text-xs opacity-75">({player.overall})</span>
										<button
											onClick={() => removePlayer(player.id)}
											className="ml-2 hover:text-red-300 transition-colors"
										>
											<FaTimes />
										</button>
									</div>
									{/* Tooltip */}
									<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
										<div className="bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap border border-gray-700">
											{player.club} • {player.position}
										</div>
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* RadarChart */}
			{comparisonData.length > 0 && chartData.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="mt-8"
				>
					<div className="h-[600px] w-full bg-gray-800/50 rounded-xl p-4">
						<ResponsiveContainer width="100%" height="100%">
							<RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
								<PolarGrid stroke="#374151" />
								<PolarAngleAxis
									dataKey="feature"
									tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
								/>
								<PolarRadiusAxis
									angle={30}
									domain={[0, 100]}
									tick={{ fill: '#6B7280', fontSize: 10 }}
									stroke="#374151"
								/>

								{comparisonData.map((player, idx) => (
									<Radar
										key={player.id}
										name={player.name}
										dataKey={player.name}
										stroke={COLORS[idx % COLORS.length]}
										fill={COLORS[idx % COLORS.length]}
										fillOpacity={0.2}
										strokeWidth={2}
									/>
								))}

								<Tooltip content={<CustomTooltip />} />
								<Legend
									wrapperStyle={{
										color: '#fff',
										paddingTop: '20px',
										fontSize: '12px'
									}}
								/>
							</RadarChart>
						</ResponsiveContainer>
					</div>

					{/* Key Features Section */}
					<div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{comparisonData.map((player, idx) => (
							<motion.div
								key={player.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.1 }}
								className="bg-gray-800 rounded-xl p-4 border border-gray-700"
							>
								<div className="flex items-center gap-3 mb-3">
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center"
										style={{ backgroundColor: COLORS[idx % COLORS.length] }}
									>
										{player.type === 'gk' ? <FaShieldAlt /> : <FaFutbol />}
									</div>
									<div>
										<h3 className="text-white font-bold">{player.name}</h3>
										<p className="text-sm text-gray-400">{player.position} • {player.overall} OVR</p>
									</div>
								</div>

								<h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
									<FaStar className="text-yellow-500" />
									Key Features
								</h4>

								<div className="space-y-2">
									{player.key_features?.slice(0, 5).map((feat, i) => (
										<div key={i} className="flex items-center justify-between">
											<span className="text-gray-300 text-sm">{feat}</span>
											<span className="text-white font-bold">
                        {Math.round(player.features?.[feat] || 0)}
                      </span>
										</div>
									))}
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>
			)}

			{/* Empty State */}
			{comparisonData.length === 0 && !loading && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center py-16"
				>
					<TbChartRadar className="text-6xl text-gray-600 mx-auto mb-4" />
					<p className="text-gray-400 text-lg">
						Search and add players to compare
					</p>
					<p className="text-gray-500 text-sm mt-2">
						You can compare up to 8 players at once
					</p>
				</motion.div>
			)}
		</motion.div>
	);
};

export default PlayerComparison;