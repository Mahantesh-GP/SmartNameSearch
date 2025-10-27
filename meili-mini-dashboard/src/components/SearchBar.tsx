import React from 'react'
import { useNotifications } from '../contexts/NotificationContext'

interface Props {
  query: string
  setQuery: (s: string) => void
  onSearch: () => void
  placeholder?: string
  suggestions?: string[]
}

// Local storage keys
const SEARCH_HISTORY_KEY = 'meili-search-history'
const MAX_HISTORY_ITEMS = 10

export default function SearchBar({query, setQuery, onSearch, placeholder, suggestions = []}: Props) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const { info, success } = useNotifications()
  
  // Load search history on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (error) {
        console.warn('Failed to parse search history:', error)
      }
    }
  }, [])
  
  // Update filtered suggestions when query or suggestions change
  React.useEffect(() => {
    if (!query.trim()) {
      setFilteredSuggestions(searchHistory.slice(0, 5))
      return
    }
    
    const allSuggestions = [...suggestions, ...searchHistory]
    const filtered = Array.from(new Set(allSuggestions))
      .filter(item => 
        item.toLowerCase().includes(query.toLowerCase()) && 
        item !== query
      )
      .slice(0, 8)
    
    setFilteredSuggestions(filtered)
  }, [query, suggestions, searchHistory])
  
  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updatedHistory = [
      searchQuery,
      ...searchHistory.filter(item => item !== searchQuery)
    ].slice(0, MAX_HISTORY_ITEMS)
    
    setSearchHistory(updatedHistory)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory))
  }
  
  const handleSearch = () => {
    if (query.trim()) {
      saveToHistory(query.trim())
      onSearch()
      setShowDropdown(false)
      info(`Searching for "${query.trim()}"`)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Enter') {
        handleSearch()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setShowDropdown(true)
        setSelectedIndex(0)
      }
      return
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          setQuery(filteredSuggestions[selectedIndex])
          handleSearch()
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowDropdown(false)
    // Auto-search when clicking suggestion
    setTimeout(() => {
      saveToHistory(suggestion)
      onSearch()
      info(`Searching for "${suggestion}"`)
    }, 100)
  }
  
  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
    success('Search history cleared')
    setShowDropdown(false)
  }
  
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    
    const regex = new RegExp(`(${highlight})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded px-1">
          {part}
        </mark> : part
    )
  }
  
  return (
    <div className="relative">
      <div className={`relative flex gap-2 items-center transition-all duration-300 ${
        isFocused ? 'transform scale-[1.02]' : ''
      }`}>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className={`w-5 h-5 transition-colors duration-200 ${
              isFocused ? 'text-purple-500' : 'text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              setShowDropdown(true)
            }}
            onBlur={() => {
              setIsFocused(false)
              // Delay hiding dropdown to allow clicks
              setTimeout(() => setShowDropdown(false), 150)
            }}
            placeholder={placeholder ?? 'Search documents... (↓ for history)'}
            className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
              isFocused 
                ? 'border-purple-400 dark:border-purple-500 bg-white dark:bg-gray-800 shadow-xl ring-4 ring-purple-200/50 dark:ring-purple-400/20' 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md dark:hover:shadow-lg'
            } focus:outline-none ${showDropdown && filteredSuggestions.length > 0 ? 'rounded-b-none' : ''}`}
          />
          
          {/* Search actions */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                title="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {searchHistory.length > 0 && (
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                title="Search history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Dropdown for suggestions and history */}
          {showDropdown && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-800 border-2 border-t-0 border-purple-400 dark:border-purple-500 rounded-b-xl shadow-xl backdrop-blur-sm max-h-64 overflow-y-auto">
              {!query.trim() && searchHistory.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                  <span>Recent searches</span>
                  <button
                    onClick={clearHistory}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              {query.trim() && suggestions.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  Suggestions
                </div>
              )}
              
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-150 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                    index === selectedIndex ? 'bg-purple-100 dark:bg-purple-900/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {searchHistory.includes(suggestion) ? (
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    <span className="text-gray-900 dark:text-gray-100 flex-1 truncate">
                      {query.trim() ? highlightMatch(suggestion, query) : suggestion}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 border ${
            query.trim()
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-purple-400/50'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>
    </div>
  )
}
