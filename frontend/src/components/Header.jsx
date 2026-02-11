import React from 'react';
import { motion } from 'framer-motion';
import { FaFutbol, FaGithub, FaServer, FaQuestionCircle } from 'react-icons/fa';

const Header = ({ onShowInstructions }) => {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-fifa-blue to-blue-700 shadow-lg"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and Title */}
          <div className="flex items-center mb-4 md:mb-0">
            <div className="relative">
              <FaFutbol className="text-4xl text-white mr-3 animate-spin-slow" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-fifa-gold rounded-full"></div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                FIFA Position Predictor
              </h1>
              <p className="text-blue-100 text-sm">
                AI-powered player position prediction
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onShowInstructions}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
            >
              <FaQuestionCircle className="mr-2" />
              How to Use
            </button>
            
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
            >
              <FaServer className="mr-2" />
              API Docs
            </a>
            
            <a
              href="#"
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
            >
              <FaGithub className="mr-2" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;