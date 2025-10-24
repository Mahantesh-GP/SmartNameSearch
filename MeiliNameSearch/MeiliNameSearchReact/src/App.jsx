import React, { useState, useMemo, useEffect } from 'react';

// Base path for the NameSearch API. Prefer the Vite env var `VITE_API_BASE_URL` (set to
// the full API host, e.g. https://smartnamesearch.onrender.com). Fall back to the older
// `VITE_API_BASE_PATH` or to '/api' for local/docker proxying.
const apiBasePath = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_PATH || '/api';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortOption, setSortOption] = useState('score-desc');
  const [filterState, setFilterState] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });
  const [indexing, setIndexing] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    // Show banner if user hasn't dismissed it before
    return !localStorage.getItem('welcomeBannerDismissed');
  });
  const [indexEmpty, setIndexEmpty] = useState(false);

  // Apply or remove the dark class on the root element when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const dismissWelcomeBanner = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  // Perform the search against the API
  const search = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setIndexEmpty(false);
      return;
    }
    setLoading(true);
    setError('');
    setHasSearched(true);
    setIndexEmpty(false);
    try {
      // Build the proxied path. Ensure apiBasePath doesn't end with a slash.
      const base = apiBasePath.endsWith('/') ? apiBasePath.slice(0, -1) : apiBasePath;
      const url = `${base}/NameSearch/search?query=${encodeURIComponent(trimmed)}&limit=10`;
      const resp = await fetch(url, { credentials: 'same-origin' });
      if (!resp.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await resp.json();
      const results = Array.isArray(data) ? data : [];
      setResults(results);
      
      // If no results, check if index might be empty
      if (results.length === 0) {
        // Try a very common search to verify if index has any data
        await checkIfIndexEmpty(base);
      }
    } catch (e) {
      console.error(e);
      setError('Search failed. Check the API server and CORS configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Check if the index is empty by trying a wildcard/common search
  const checkIfIndexEmpty = async (base) => {
    try {
      // Search for very common names to check if index has data
      const testQuery = 'a'; // Single letter should match something if index has data
      const url = `${base}/NameSearch/search?query=${encodeURIComponent(testQuery)}&limit=1`;
      const resp = await fetch(url, { credentials: 'same-origin' });
      if (resp.ok) {
        const data = await resp.json();
        const hasData = Array.isArray(data) && data.length > 0;
        setIndexEmpty(!hasData);
      }
    } catch (e) {
      // If check fails, don't show index empty message
      console.error('Failed to check if index is empty:', e);
    }
  };

  // Trigger bulk indexing
  const startBulkIndex = async () => {
    setIndexing(true);
    setJobStatus('⏳ Initiating bulk upload... (This may take 1-2 minutes if the API is waking up from cold start)');
    setError('');
    try {
      const base = apiBasePath.endsWith('/') ? apiBasePath.slice(0, -1) : apiBasePath;
      const url = `${base}/NameSearch/enqueue-bulk-index?count=100`;
      const resp = await fetch(url, { 
        method: 'POST',
        credentials: 'same-origin' 
      });
      if (!resp.ok) {
        throw new Error('Failed to start bulk indexing');
      }
      const data = await resp.json();
      if (data.jobId) {
        setJobStatus('Bulk upload started. Checking status...');
        pollJobStatus(data.jobId);
      } else {
        setJobStatus('Bulk upload initiated successfully!');
        setIndexing(false);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to start bulk indexing. The API may still be waking up from cold start. Please wait a moment and try again.');
      setIndexing(false);
      setJobStatus('');
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId) => {
    const base = apiBasePath.endsWith('/') ? apiBasePath.slice(0, -1) : apiBasePath;
    const url = `${base}/NameSearch/job-status/${jobId}`;
    
    const checkStatus = async () => {
      try {
        const resp = await fetch(url, { credentials: 'same-origin' });
        if (!resp.ok) {
          throw new Error('Failed to check job status');
        }
        const data = await resp.json();
        
        // API returns lowercase 'status', not 'Status'
        const status = data.status || data.Status;
        
        if (status === 'Completed' || status?.startsWith('Completed:')) {
          setJobStatus('✓ Bulk upload completed successfully!');
          setIndexing(false);
        } else if (status === 'Failed') {
          setJobStatus('✗ Bulk upload failed.');
          setIndexing(false);
        } else if (status === 'Running') {
          setJobStatus('⏳ Bulk upload in progress...');
          setTimeout(checkStatus, 2000); // Check again in 2 seconds
        } else if (status === 'Queued') {
          setJobStatus('⏳ Bulk upload queued...');
          setTimeout(checkStatus, 2000);
        } else {
          setJobStatus(`Status: ${status || 'Unknown'}`);
          setTimeout(checkStatus, 2000);
        }
      } catch (e) {
        console.error(e);
        setJobStatus('Failed to check job status.');
        setIndexing(false);
      }
    };
    
    checkStatus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search();
    }
  };

  // Unique list of states for the filter drop-down
  const availableStates = useMemo(() => {
    const set = new Set();
    results.forEach((r) => {
      if (r.person && r.person.state) set.add(r.person.state);
    });
    return Array.from(set).sort();
  }, [results]);

  // Apply filter and sort the results
  const filteredAndSorted = useMemo(() => {
    let list = results;
    if (filterState) {
      list = list.filter((r) => r.person && r.person.state === filterState);
    }
    const arr = [...list];
    if (sortOption === 'score-asc') {
      arr.sort((a, b) => a.score - b.score);
    } else if (sortOption === 'score-desc') {
      arr.sort((a, b) => b.score - a.score);
    } else if (sortOption === 'name-asc') {
      arr.sort((a, b) => {
        const aName = `${a.person.firstName} ${a.person.middleName || ''} ${a.person.lastName}`.toLowerCase();
        const bName = `${b.person.firstName} ${b.person.middleName || ''} ${b.person.lastName}`.toLowerCase();
        return aName.localeCompare(bName);
      });
    }
    return arr;
  }, [results, filterState, sortOption]);

  // Maximum score for the progress bar normalization
  const maxScore = useMemo(() => {
    return filteredAndSorted.reduce((max, r) => Math.max(max, r.score), 0);
  }, [filteredAndSorted]);

  // Toggle dark mode
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative flex flex-col items-center w-full p-4 pb-16">
        {/* Header */}
        <div className="flex w-full max-w-4xl justify-between items-center mt-8 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
              <span className="text-3xl">🔍</span>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Smart Name Search
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI-Powered Name Matching Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startBulkIndex}
              disabled={indexing}
              className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100"
              title="Upload 100 sample records to the search index"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{indexing ? '⏳' : '📤'}</span>
                <span>{indexing ? 'Uploading...' : 'Bulk Upload'}</span>
              </span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="w-12 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl text-2xl focus:outline-none hover:scale-110 transition-all shadow-md hover:shadow-lg"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcomeBanner && (
          <div className="mt-4 w-full max-w-4xl animate-fadeIn">
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-2xl">
              <button
                onClick={dismissWelcomeBanner}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Dismiss"
              >
                ×
              </button>
              <div className="pr-12">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <span className="text-2xl">👋</span>
                  Welcome to Smart Name Search!
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <span className="text-2xl flex-shrink-0">⏳</span>
                    <div>
                      <strong className="font-semibold text-gray-900 dark:text-gray-100">First visit?</strong>
                      <p className="text-sm mt-1">The API is hosted on Render.com and may take 1-2 minutes to wake up from cold start on first request.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                    <span className="text-2xl flex-shrink-0">📤</span>
                    <div>
                      <strong className="font-semibold text-gray-900 dark:text-gray-100">Get started:</strong>
                      <p className="text-sm mt-1">Click the <strong>"Bulk Upload"</strong> button above to index 100 sample records into the search database.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <span className="text-2xl flex-shrink-0">🔍</span>
                    <div>
                      <strong className="font-semibold text-gray-900 dark:text-gray-100">Then search:</strong>
                      <p className="text-sm mt-1">Once indexing completes, try searching for names like "Bob", "Elizabeth", or "John" to see the smart matching in action!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Status */}
        {jobStatus && (
          <div className="mt-4 w-full max-w-4xl animate-fadeIn">
            <div className={`p-4 rounded-xl font-medium shadow-lg backdrop-blur-sm ${
              jobStatus.includes('✓') ? 'bg-green-100/90 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-2 border-green-300 dark:border-green-700' :
              jobStatus.includes('✗') ? 'bg-red-100/90 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-2 border-red-300 dark:border-red-700' :
              'bg-blue-100/90 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-700'
            }`}>
              {jobStatus}
            </div>
          </div>
        )}

        {/* Search Box */}
        <div className="relative mt-8 w-full max-w-4xl">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                    <svg
                      className="h-6 w-6 text-gray-400 dark:text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.5 3a7.5 7.5 0 010 15z" />
                    </svg>
                  </div>
                  <input
                    className="block w-full pl-16 pr-6 py-4 text-lg rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    type="text"
                    placeholder="Search for a name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <button
                  type="button"
                  onClick={search}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4 w-full max-w-4xl mt-8 items-center">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <label htmlFor="sort" className="font-medium text-gray-700 dark:text-gray-300">
              Sort:
            </label>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border-0 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="score-desc">Score ↓</option>
              <option value="score-asc">Score ↑</option>
              <option value="name-asc">Name A–Z</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <label htmlFor="stateFilter" className="font-medium text-gray-700 dark:text-gray-300">
              Filter:
            </label>
            <select
              id="stateFilter"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="border-0 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-12 flex flex-col items-center gap-4 animate-fadeIn">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
            <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">Searching...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 w-full max-w-4xl animate-fadeIn">
            <div className="bg-red-100/90 dark:bg-red-900/50 border-2 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 p-4 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !loading && filteredAndSorted.length === 0 && !error && (
          <div className={`mt-12 w-full max-w-4xl animate-fadeIn ${
            indexEmpty 
              ? 'bg-amber-100/90 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700'
              : 'bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700'
          } backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center`}>
            {indexEmpty ? (
              <>
                <div className="text-6xl mb-4">⚠️</div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mb-3">
                  Index is Empty
                </div>
                <div className="text-amber-600 dark:text-amber-400 mb-6 text-lg">
                  No records found in the search index. Please index some data first before searching.
                </div>
                <button
                  onClick={startBulkIndex}
                  disabled={indexing}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100 inline-flex items-center gap-2"
                >
                  <span className="text-xl">📤</span>
                  <span>{indexing ? 'Uploading...' : 'Index 100 Sample Records'}</span>
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                  No results found for "{query}"
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-lg">
                  Try a different search term or check your spelling.
                </div>
              </>
            )}
          </div>
        )}

        {/* Results */}
        <div className="mt-12 w-full max-w-4xl space-y-4">
          {filteredAndSorted.map((result, index) => (
            <div 
              key={result.id}
              className="group animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 overflow-hidden">
                {/* Gradient accent on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300"></div>
                
                <div className="relative p-6">
                  {/* Header with name and score */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {result.person.firstName.charAt(0)}{result.person.lastName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {result.person.firstName}{' '}
                          {result.person.middleName ? `${result.person.middleName} ` : ''}
                          {result.person.lastName}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>📍</span>
                          <span>
                            {(() => {
                              const city = result.person.city || '';
                              const state = result.person.state || '';
                              if (city && state) return `${city}, ${state}`;
                              if (city) return city;
                              if (state) return state;
                              return 'Location not specified';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2 px-4 rounded-full text-sm shadow-lg">
                        {Math.round(result.score * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Score progress bar */}
                  <div className="mt-4">
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: maxScore > 0 ? `${(result.score / maxScore) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;