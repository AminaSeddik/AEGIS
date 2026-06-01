import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-b border-dark-700 shadow-lg">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          {/* Logo with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 opacity-30 blur-xl rounded-full"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              AEGIS
            </h1>
            <p className="text-xs text-dark-400 font-medium tracking-wide">
              Advanced Ensemble Guard for IoT Security
            </p>
          </div>
        </div>

        {/* Center - System Health */}
        <div className="hidden lg:flex items-center space-x-6">
          {/* CPU Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-dark-300">CPU: 23%</span>
          </div>
          
          {/* Memory */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-dark-300">MEM: 4.2GB</span>
          </div>
          
          {/* Network */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-dark-300">NET: 125 Mbps</span>
          </div>
        </div>

        {/* Right Side - Status and User */}
        <div className="flex items-center space-x-6">
          {/* OMNeT++ Connection Status */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-dark-800 rounded-lg border border-dark-700">
            <div className="relative">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <div className="absolute inset-0 bg-success rounded-full animate-ping"></div>
            </div>
            <span className="text-sm text-dark-200 font-medium">OMNeT++ Connected</span>
          </div>

          {/* Alerts */}
          <button className="relative p-2 text-dark-300 hover:text-white transition-colors rounded-lg hover:bg-dark-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-dark-800 rounded-lg border border-dark-700">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-dark-400">Security Officer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;