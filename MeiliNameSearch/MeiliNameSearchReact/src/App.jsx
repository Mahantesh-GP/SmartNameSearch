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

  // Apply or remove the dark class on the root element when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Perform the search against the API
  const search = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      // Build the proxied path. Ensure apiBasePath doesn't end with a slash.
      const base = apiBasePath.endsWith('/') ? apiBasePath.slice(0, -1) : apiBasePath;
      const url = `${base}/NameSearch/search?query=${encodeURIComponent(trimmed)}&limit=10`;
      const resp = await fetch(url, { credentials: 'same-origin' });
      if (!resp.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await resp.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Search failed. Check the API server and CORS configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger bulk indexing
  const startBulkIndex = async () => {
    setIndexing(true);
    setJobStatus('Initiating bulk upload...');
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
      setError('Failed to start bulk indexing. Check the API server.');
      setIndexing(false);
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
        
        if (data.Status === 'Completed') {
          setJobStatus('✓ Bulk upload completed successfully!');
          setIndexing(false);
        } else if (data.Status === 'Failed') {
          setJobStatus('✗ Bulk upload failed.');
          setIndexing(false);
        } else if (data.Status === 'Running') {
          setJobStatus('⏳ Bulk upload in progress...');
          setTimeout(checkStatus, 2000); // Check again in 2 seconds
        } else {
          setJobStatus(`Status: ${data.Status}`);
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
    <div className="flex flex-col items-center w-full p-4">
      <div className="flex w-full max-w-2xl justify-between items-center mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-gray-100">
          Smart Name Search
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={startBulkIndex}
            disabled={indexing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            title="Upload 100 sample records to the search index"
          >
            {indexing ? '⏳ Uploading...' : '📤 Bulk Upload'}
          </button>
          <button
            onClick={toggleDarkMode}
            className="ml-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-full p-2 text-xl focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-700"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {jobStatus && (
        <div className="mt-4 w-full max-w-2xl">
          <div className={`p-3 rounded-lg text-sm ${
            jobStatus.includes('✓') ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
            jobStatus.includes('✗') ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
            'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
          }`}>
            {jobStatus}
          </div>
        </div>
      )}

      <div className="relative mt-8 w-full max-w-2xl">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.5 3a7.5 7.5 0 010 15z" />
          </svg>
        </div>
        <input
          className="block w-full pl-12 pr-4 py-3 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          placeholder="Search for a name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={search}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-4 w-full max-w-3xl mt-6 items-center">
        <div className="flex items-center">
          <label htmlFor="sort" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
            Sort:
          </label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="score-desc">Score ↓</option>
            <option value="score-asc">Score ↑</option>
            <option value="name-asc">Name A–Z</option>
          </select>
        </div>
        <div className="flex items-center">
          <label
            htmlFor="stateFilter"
            className="mr-2 text-sm text-gray-700 dark:text-gray-300"
          >
            Filter by state:
          </label>
          <select
            id="stateFilter"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="mt-6 text-lg text-gray-600 dark:text-gray-400">Searching…</div>
      )}
      {error && (
        <div className="mt-6 text-red-500 dark:text-red-400">{error}</div>
      )}

      {hasSearched && !loading && filteredAndSorted.length === 0 && !error && (
        <div className="mt-8 w-full max-w-3xl p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            🔍 No results found for "{query}"
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Try a different search term or upload sample data using the Bulk Upload button.
          </div>
        </div>
      )}

      <ul className="mt-8 w-full max-w-3xl space-y-4">
        {filteredAndSorted.map((result) => (
          <li key={result.id}>
            <div className="p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition hover:shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {result.person.firstName}{' '}
                  {result.person.middleName ? `${result.person.middleName} ` : ''}
                  {result.person.lastName}
                </h2>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {result.score.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 mb-2">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: maxScore > 0 ? `${(result.score / maxScore) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {(() => {
                  const city = result.person.city || '';
                  const state = result.person.state || '';
                  if (city && state) return `${city}, ${state}`;
                  if (city) return city;
                  if (state) return state;
                  return '—';
                })()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;