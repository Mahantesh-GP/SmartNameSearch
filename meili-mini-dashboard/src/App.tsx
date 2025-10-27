import React from 'react'
import IndexList from './components/IndexList'
import DocumentBrowser from './components/DocumentBrowser'
import { StatsDashboard } from './components/StatsDashboard'
import { ThemeToggle } from './contexts/ThemeContext'

type ViewMode = 'indexes' | 'stats'

export default function App() {
  const [selected, setSelected] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>('indexes')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 transition-colors duration-500">
      {/* Animated background layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5 dark:from-purple-500/10 dark:via-blue-500/5 dark:to-pink-500/10 animate-pulse"></div>
      
      {/* Floating orbs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 bg-purple-300/10 dark:bg-purple-400/5 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/10 dark:bg-pink-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 p-3 md:p-4 max-w-7xl mx-auto">
        {/* Compact Header */}
        <header className="mb-3 md:mb-4 text-center relative">
          {/* Theme Toggle - positioned absolutely */}
          <div className="absolute top-0 right-0 z-20">
            <ThemeToggle />
          </div>
          
          <div className="inline-flex items-center gap-2 md:gap-3 mb-2 md:mb-3 animate-bounce-in">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                MeiliSearch
              </h1>
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 -mt-0.5">
                Dashboard
              </p>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 glass-strong rounded-lg md:rounded-xl shadow-soft animate-stagger-in">
            <div className="relative">
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Connected:</span>
            <code className="font-mono text-xs bg-white/50 dark:bg-gray-800/50 px-1.5 md:px-2 py-1 rounded text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-gray-600/50 max-w-32 truncate">
              {import.meta.env.VITE_MEILI_HOST || '⚠️ Not configured'}
            </code>
            <div className="hidden sm:flex dark:flex items-center gap-1 ml-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-400 font-medium">Dark</span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="mb-4 animate-stagger-in">
          <div className="glass-strong rounded-lg p-1 shadow-soft inline-flex">
            <button
              onClick={() => {
                setViewMode('indexes')
                setSelected(null)
              }}
              className={`
                relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                ${viewMode === 'indexes'
                  ? 'bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white shadow-soft'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Indexes & Documents
              </div>
              {viewMode === 'indexes' && (
                <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              )}
            </button>
            
            <button
              onClick={() => setViewMode('stats')}
              className={`
                relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                ${viewMode === 'stats'
                  ? 'bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white shadow-soft'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistics
              </div>
              {viewMode === 'stats' && (
                <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              )}
            </button>
          </div>
        </nav>

        {/* Main Content */}
        {viewMode === 'stats' ? (
          <div className="animate-stagger-in">
            <StatsDashboard />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 min-h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
            {/* Sidebar */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
              <div className="space-y-2 md:space-y-3 h-full max-h-screen lg:max-h-none overflow-y-auto">
                <div className="animate-stagger-in stagger-1">
                  <IndexList selected={selected} onSelect={setSelected} />
                </div>


                {/* Quick Stats */}
                <div className="glass rounded-2xl p-4 shadow-soft animate-stagger-in stagger-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm">Quick Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Active Index</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {selected || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Status</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 animate-stagger-in stagger-2">
              {selected ? (
                <DocumentBrowser indexUid={selected} />
              ) : (
                <div className="glass-strong rounded-2xl p-16 shadow-soft text-center h-full flex flex-col justify-center animate-float">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 text-balance">
                    Select an Index to Begin
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
                    Choose an index from the sidebar to explore documents, perform searches, and analyze your data.
                  </p>
                  <div className="mt-8">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Powered by MeiliSearch
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
