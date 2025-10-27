import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { meili, IndexInfo } from '../lib/meili'

interface Props {
  selected: string | null
  onSelect: (uid: string) => void
}

export default function IndexList({ selected, onSelect }: Props) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['indexes'],
    queryFn: async () => {
      const res = await meili.getIndexes()
      return res.results as IndexInfo[]
    }
  })

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse shimmer stagger-${i}`}></div>
      ))}
    </div>
  )

  return (
    <div className="glass-strong rounded-2xl shadow-soft overflow-hidden">
      {/* Compact Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-50/30 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10 border-b border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Indexes</h3>
                {data && !isLoading && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-md font-semibold shadow-sm">
                    {data.length}
                  </span>
                )}
              </div>
              {data && !isLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data.length} available</p>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700/80 rounded-lg border border-gray-200/60 dark:border-gray-600/60 transition-all duration-200 disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isFetching ? 'Sync' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">

        {isLoading && <LoadingSkeleton />}
        
        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-300 animate-bounce-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold text-sm">Connection Error</div>
              <div className="text-xs opacity-80">Failed to load indexes</div>
            </div>
          </div>
        )}
        
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-600 scrollbar-track-transparent">
          {data?.map((ix, index) => (
            <button
              key={ix.uid}
              onClick={() => onSelect(ix.uid)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 group animate-stagger-in ${
                selected === ix.uid 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-[1.01]' 
                  : 'bg-white/50 dark:bg-gray-800/30 hover:bg-white/80 dark:hover:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md hover:border-purple-300/50 dark:hover:border-purple-600/50'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className={`relative ${
                  selected === ix.uid ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    selected === ix.uid 
                      ? 'bg-white/90 shadow-md' 
                      : 'bg-gradient-to-r from-purple-400 to-pink-400 shadow-sm'
                  }`}></div>
                  {selected === ix.uid && (
                    <div className="absolute inset-0 w-3 h-3 bg-white/50 rounded-full animate-ping"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm truncate ${
                    selected === ix.uid ? 'text-white' : 'text-gray-800 dark:text-gray-100'
                  }`}>
                    {ix.uid}
                  </div>
                  {ix.primaryKey && (
                    <div className={`text-xs truncate mt-0.5 ${
                      selected === ix.uid ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Key: {ix.primaryKey}
                    </div>
                  )}
                </div>
                
                <div className={`transition-all duration-200 ${
                  selected === ix.uid 
                    ? 'opacity-100 transform rotate-0' 
                    : 'opacity-0 group-hover:opacity-70 transform -rotate-90 group-hover:rotate-0'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
          
          {!isLoading && data?.length === 0 && (
            <div className="text-center py-8 animate-bounce-in">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md animate-float">
                <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">No Indexes Found</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed px-2">
                Create an index in MeiliSearch to start exploring your data
              </p>
              <div className="mt-3">
                <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check your MeiliSearch instance
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
