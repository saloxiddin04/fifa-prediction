import React from 'react';
import { FaHeart, FaCode, FaBrain } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FaBrain className="mr-2" />
              About
            </h3>
            <p className="text-gray-300">
              FIFA Position Predictor uses Machine Learning to analyze player attributes 
              and predict their optimal position on the field.
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FaCode className="mr-2" />
              Tech Stack
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Frontend: React + Vite + TailwindCSS</li>
              <li>• Backend: FastAPI + Python</li>
              <li>• ML: Scikit-learn + Random Forest</li>
              <li>• Data: FIFA 2019 Dataset</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-xl font-bold mb-4">Disclaimer</h3>
            <p className="text-gray-300 text-sm">
              This project is for educational purposes only. FIFA is a registered 
              trademark of EA Sports. Player data is based on FIFA 2019 statistics.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 flex items-center justify-center">
            Made with <FaHeart className="text-red-500 mx-2" /> for football enthusiasts
          </p>
          <p className="text-gray-500 text-sm mt-2">
            © 2023 FIFA Position Predictor | All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;