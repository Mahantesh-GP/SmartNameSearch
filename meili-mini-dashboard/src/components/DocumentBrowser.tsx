import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { meili } from '../lib/meili'
import SearchBar from './SearchBar'
import { useNotifications } from '../contexts/NotificationContext'

type Props = {
  indexUid: string
}

type Hit = Record<string, unknown>

export default function DocumentBrowser({ indexUid }: Props) {
  const [query, setQuery] = React.useState('')
  const [limit, setLimit] = React.useState(20)
  const [offset, setOffset] = React.useState(0)
  const [viewMode, setViewMode] = React.useState<'card' | 'json'>('card')
  const [expandedCards, setExpandedCards] = React.useState<Set<number>>(new Set())
  const { success, error: notifyError } = useNotifications()

  const { data, isLoading, error: queryError, refetch, isFetching } = useQuery({
    queryKey: ['docs', indexUid, query, limit, offset],
    queryFn: async () => {
      const index = meili.index(indexUid)
      if (query && query.trim().length > 0) {
        const res = await index.search(query, { limit, offset })
        return { hits: res.hits as Hit[], total: res.estimatedTotalHits ?? 0 }
      } else {
        const res = await index.getDocuments({ limit, offset })
        return { hits: res.results as Hit[], total: res.total ?? 0 }
      }
    }
  })

  const total = data?.total ?? 0
  const canPrev = offset > 0
  const canNext = offset + limit < total
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  const onSearch = () => {
    setOffset(0)
    refetch()
  }

  const next = () => setOffset(o => o + limit)
  const prev = () => setOffset(o => Math.max(0, o - limit))

  const copyToClipboard = async (text: string, itemType: string = 'Document') => {
    try {
      await navigator.clipboard.writeText(text)
      success(`${itemType} Copied!`, 'Content copied to clipboard successfully')
    } catch (err) {
      notifyError('Copy Failed', 'Unable to copy to clipboard')
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={`glass border border-gray-200/50 dark:border-gray-600/50 rounded-xl p-6 shimmer animate-stagger-in stagger-${i}`}>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6 mb-2"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderCardView = (hit: Hit, index: number) => {
    const keys = Object.keys(hit)
    const idKey = keys.find(k => k.toLowerCase().includes('id')) || 'id'
    const documentId = hit[idKey] || `doc-${offset + index + 1}`
    const mainKey = keys.find(k => k !== idKey && typeof hit[k] === 'string' && (hit[k] as string).length > 10) || keys.find(k => k !== idKey && typeof hit[k] !== 'object') || keys[0]
    // Filter out object fields to avoid showing "[Obj]" or "[Object]"
    const allOtherKeys = keys.filter(k => 
      k !== mainKey && 
      k !== idKey && 
      typeof hit[k] !== 'object' && 
      hit[k] !== null && 
      hit[k] !== undefined &&
      String(hit[k]).trim() !== '' // Also filter out empty strings
    )
    
    const cardKey = offset + index
    const isExpanded = expandedCards.has(cardKey)
    const maxVisibleFields = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 3
    const visibleKeys = isExpanded ? allOtherKeys : allOtherKeys.slice(0, maxVisibleFields)
    const hiddenCount = Math.max(0, allOtherKeys.length - maxVisibleFields)
    
    const toggleExpanded = () => {
      const newExpanded = new Set(expandedCards)
      if (isExpanded) {
        newExpanded.delete(cardKey)
      } else {
        newExpanded.add(cardKey)
      }
      setExpandedCards(newExpanded)
    }

    return (
      <div key={index} className={`bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/80 border border-gray-200/60 dark:border-gray-600/60 rounded-lg p-3 hover:shadow-md hover:border-purple-300/50 dark:hover:border-purple-600/50 transition-all duration-200 group animate-stagger-in stagger-${(index % 3) + 1}`}>
        {/* Responsive Layout */}
        <div className="flex items-start gap-2 md:gap-3">
          {/* Left: Status Indicator */}
          <div className="flex-shrink-0 flex items-center">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"></div>
          </div>

          {/* Middle: Main Content */}
          <div className="flex-1 min-w-0">
            {/* Document ID - Full Display */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID:</span>
              <code className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-200/50 dark:border-purple-700/50 break-all">
                {String(documentId)}
              </code>
            </div>
            
            {mainKey && (
              <div className="mb-1">
                <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{mainKey.slice(0, 15)}{mainKey.length > 15 ? '...' : ''}:</span>
                </div>
                <p className="text-xs md:text-sm text-gray-800 dark:text-gray-200 leading-tight overflow-hidden">
                  {String(hit[mainKey]).length > (window.innerWidth < 768 ? 80 : 120) 
                    ? `${String(hit[mainKey]).slice(0, window.innerWidth < 768 ? 80 : 120)}...`
                    : String(hit[mainKey])
                  }
                </p>
              </div>
            )}
            
            {/* Responsive Fields */}
            {allOtherKeys.length > 0 && (
              <div className="flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1 mt-1 md:mt-2">
                {visibleKeys.map((key: string) => (
                  <div key={key} className="flex items-center gap-1 text-xs">
                    <span className="font-medium text-gray-500 dark:text-gray-400 truncate max-w-12 md:max-w-none">{key}:</span>
                    <span className="text-gray-700 dark:text-gray-300 max-w-16 md:max-w-20 truncate">
                      {String(hit[key])}
                    </span>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={toggleExpanded}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-200 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show less</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>+{hiddenCount} more fields</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Copy Button */}
          <button 
            onClick={() => copyToClipboard(JSON.stringify(hit, null, 2), 'Document')}
            className="opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 active:opacity-100 flex-shrink-0 p-1 rounded bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 touch-manipulation"
            title="Copy JSON"
          >
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const renderJsonView = (hit: Hit, index: number) => {
    const keys = Object.keys(hit)
    const idKey = keys.find(k => k.toLowerCase().includes('id')) || 'id'
    const documentId = hit[idKey] || `doc-${offset + index + 1}`
    
    return (
      <div key={index} className={`glass hover:glass-strong border border-gray-200/50 dark:border-gray-600/50 rounded-2xl overflow-hidden shadow-lg animate-stagger-in stagger-${(index % 3) + 1}`}>
        <div className="flex items-center justify-between p-4 bg-gray-50/70 dark:bg-gray-800/70 border-b border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-sm animate-pulse"></div>
            <div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">JSON View</span>
              <code className="ml-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {String(documentId)}
              </code>
            </div>
          </div>
          <button 
            onClick={() => copyToClipboard(JSON.stringify(hit, null, 2), 'Document JSON')}
            className="p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 btn-hover shadow-md border border-gray-200/50 dark:border-gray-600/50"
            title="Copy Document JSON"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <pre className="p-5 overflow-auto text-xs font-mono leading-loose max-h-96 bg-gradient-to-br from-gray-50/50 to-white/80 dark:from-gray-900/50 dark:to-gray-800/80 text-gray-800 dark:text-gray-200 selection:bg-purple-200 dark:selection:bg-purple-700/50">
          {JSON.stringify(hit, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="glass-strong rounded-2xl shadow-soft flex flex-col h-full overflow-hidden">
      {/* Compact Header - Sticky */}
      <div className="flex-shrink-0 px-3 md:px-5 py-3 md:py-4 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 border-b border-gray-200/50 dark:border-gray-700/30 rounded-t-2xl">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">Documents</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-32 md:max-w-none">{indexUid}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            {isFetching && (
              <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-purple-200 dark:border-purple-700 border-t-purple-500 rounded-full animate-spin"></div>
                <span className="font-medium hidden sm:inline">Loading...</span>
              </div>
            )}
            {total > 0 && !isFetching && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 md:px-3 py-1 md:py-1.5 rounded md:rounded-lg font-semibold shadow-sm">
                {total > 999 ? `${Math.floor(total / 1000)}k` : total.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Compact Info Bar */}
        <div className="flex items-center justify-between mb-2 md:mb-3 px-2 md:px-3 py-1.5 md:py-2 bg-white/50 dark:bg-gray-800/30 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
          <div className="flex items-center gap-2 md:gap-3 text-xs overflow-hidden">
            <div className="flex items-center gap-1 md:gap-1.5">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <code className="bg-purple-100 dark:bg-purple-900/30 px-1.5 md:px-2 py-0.5 rounded text-xs font-semibold text-purple-700 dark:text-purple-300 truncate max-w-20 md:max-w-none">
                {indexUid}
              </code>
            </div>
            {query && (
              <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
                <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="bg-blue-100 dark:bg-blue-900/30 px-1.5 md:px-2 py-0.5 rounded text-xs font-semibold text-blue-700 dark:text-blue-300 truncate max-w-16 md:max-w-24">
                  "{query}"
                </span>
              </div>
            )}
          </div>
          
          {total > 0 && (
            <div className="flex items-center gap-1 md:gap-1.5 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">{total > 999 ? `${Math.floor(total / 1000)}k` : total.toLocaleString()}</span>
              <span className="hidden sm:inline">results</span>
            </div>
          )}
        </div>

        {/* Search Bar - Compact */}
        <div className="mb-2">
          <SearchBar 
            query={query} 
            setQuery={setQuery} 
            onSearch={onSearch} 
            placeholder="Search documents... (leave empty to browse all)" 
          />
        </div>

        {/* Compact Controls */}
        <div className="flex items-center justify-between flex-wrap gap-1 md:gap-2">
          <div className="flex items-center gap-1 md:gap-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Show</label>
            <select
              value={limit}
              onChange={e => { setLimit(parseInt(e.target.value)); setOffset(0); }}
              className="px-2 md:px-3 py-1 md:py-1.5 border border-gray-200 dark:border-gray-600 rounded md:rounded-lg bg-white dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-300 dark:focus:ring-purple-500 focus:border-purple-400 dark:focus:border-purple-400 transition-all duration-200 shadow-sm"
            >
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">per page</span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">View:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded md:rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'card' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Cards
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'json' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && <LoadingSkeleton />}
        
        {queryError && (
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 mb-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium text-sm">Failed to load documents</div>
              <div className="text-xs">Please check your connection and try again</div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {data?.hits?.map((hit, i) => 
            viewMode === 'card' 
              ? renderCardView(hit, i)
              : renderJsonView(hit, i)
          )}
        </div>

        {!isLoading && data?.hits?.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
              {query ? 'No matches found' : 'No documents found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              {query 
                ? 'Try adjusting your search query or browse all documents'
                : 'This index appears to be empty'
              }
            </p>
            {query && (
              <button 
                onClick={() => {setQuery(''); onSearch()}}
                className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Browse All Documents
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination - Sticky Bottom */}
      {total > 0 && (
        <div className="flex-shrink-0 p-6 pt-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 rounded-b-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium text-gray-700 dark:text-gray-200 shadow-lg"
              onClick={prev}
              disabled={!canPrev}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 text-center font-medium">
                Showing <span className="font-bold text-purple-600 dark:text-purple-400 text-base">{offset + 1}</span> to{' '}
                <span className="font-bold text-purple-600 dark:text-purple-400 text-base">{Math.min(offset + limit, total)}</span> of{' '}
                <span className="font-bold text-purple-600 dark:text-purple-400 text-base">{total.toLocaleString()}</span> documents
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full border border-purple-200 dark:border-purple-800 shadow-sm">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </div>
            
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium text-gray-700 dark:text-gray-200 shadow-lg"
              onClick={next}
              disabled={!canNext}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
