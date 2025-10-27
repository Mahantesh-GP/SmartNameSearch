import { useQuery } from '@tanstack/react-query';
import { meili } from '../lib/meili';
import { useTheme } from '../contexts/ThemeContext';

interface IndexStats {
  uid: string;
  primaryKey?: string;
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution?: Record<string, number>;
}

interface ConnectionStatus {
  isConnected: boolean;
  version?: string;
  responseTime: number;
}

export const StatsDashboard = () => {
  const { theme } = useTheme();

  // Fetch connection status and version
  const { data: connectionStatus, isLoading: connectionLoading } = useQuery({
    queryKey: ['connection-status'],
    queryFn: async (): Promise<ConnectionStatus> => {
      const startTime = Date.now();
      try {
        const version = await meili.getVersion();
        const responseTime = Date.now() - startTime;
        return {
          isConnected: true,
          version: version.pkgVersion,
          responseTime
        };
      } catch (error) {
        return {
          isConnected: false,
          responseTime: Date.now() - startTime
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch all indexes with stats
  const { data: indexStats, isLoading: statsLoading } = useQuery({
    queryKey: ['index-stats'],
    queryFn: async (): Promise<IndexStats[]> => {
      try {
        const indexes = await meili.getIndexes();
        const statsPromises = indexes.results.map(async (index: any) => {
          const [stats, fieldDistribution] = await Promise.all([
            meili.index(index.uid).getStats(),
            meili.index(index.uid).getFilterableAttributes().then(() => ({})).catch(() => ({}))
          ]);
          
          return {
            uid: index.uid,
            primaryKey: index.primaryKey,
            numberOfDocuments: stats.numberOfDocuments,
            isIndexing: stats.isIndexing,
            fieldDistribution
          };
        });
        
        return Promise.all(statsPromises);
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: connectionStatus?.isConnected,
  });

  const totalDocuments = indexStats?.reduce((sum, index) => sum + index.numberOfDocuments, 0) || 0;
  const indexingCount = indexStats?.filter(index => index.isIndexing).length || 0;

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color = 'blue',
    isLoading = false 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    isLoading?: boolean;
  }) => {
    const colorClasses = {
      blue: 'from-blue-400/20 to-blue-600/20 border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10',
      green: 'from-green-400/20 to-green-600/20 border-green-500/30 bg-green-50/50 dark:bg-green-900/10',
      purple: 'from-purple-400/20 to-purple-600/20 border-purple-500/30 bg-purple-50/50 dark:bg-purple-900/10',
      orange: 'from-orange-400/20 to-orange-600/20 border-orange-500/30 bg-orange-50/50 dark:bg-orange-900/10',
      red: 'from-red-400/20 to-red-600/20 border-red-500/30 bg-red-50/50 dark:bg-red-900/10'
    };

    const iconColorClasses = {
      blue: 'text-blue-500 dark:text-blue-400',
      green: 'text-green-500 dark:text-green-400',
      purple: 'text-purple-500 dark:text-purple-400',
      orange: 'text-orange-500 dark:text-orange-400',
      red: 'text-red-500 dark:text-red-400'
    };

    const titleColorClasses = {
      blue: 'text-blue-700 dark:text-blue-300',
      green: 'text-green-700 dark:text-green-300',
      purple: 'text-purple-700 dark:text-purple-300',
      orange: 'text-orange-700 dark:text-orange-300',
      red: 'text-red-700 dark:text-red-300'
    };

    const valueColorClasses = {
      blue: 'text-blue-900 dark:text-blue-100',
      green: 'text-green-900 dark:text-green-100',
      purple: 'text-purple-900 dark:text-purple-100',
      orange: 'text-orange-900 dark:text-orange-100',
      red: 'text-red-900 dark:text-red-100'
    };

    const glowEffects = {
      blue: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-400/20',
      green: 'hover:shadow-green-200/50 dark:hover:shadow-green-400/20',
      purple: 'hover:shadow-purple-200/50 dark:hover:shadow-purple-400/20',
      orange: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-400/20',
      red: 'hover:shadow-red-200/50 dark:hover:shadow-red-400/20'
    };

    return (
      <div className={`
        relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 group
        bg-gradient-to-br ${colorClasses[color]}
        hover:scale-[1.02] hover:shadow-xl ${glowEffects[color]}
        ${theme === 'dark' 
          ? 'shadow-lg shadow-black/20' 
          : 'shadow-md shadow-gray-200/50'
        }
      `}>
        {/* Animated background overlay */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${colorClasses[color]}`}></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${titleColorClasses[color]} uppercase tracking-wide`}>
              {title}
            </h3>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} border ${
              theme === 'dark' ? 'border-white/10' : 'border-black/10'
            }`}>
              <span className={`text-xl ${iconColorClasses[color]} drop-shadow-sm`}>
                {icon}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            {isLoading ? (
              <div className="animate-pulse">
                <div className={`h-10 rounded-lg w-24 ${
                  theme === 'dark' 
                    ? `bg-${color}-800/30` 
                    : `bg-${color}-200/50`
                }`}></div>
              </div>
            ) : (
              <p className={`text-3xl font-bold ${valueColorClasses[color]} tracking-tight`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            )}
            
            {subtitle && (
              <p className={`text-sm ${titleColorClasses[color]} font-medium opacity-80`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Decorative gradient line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
          color === 'blue' ? 'from-blue-400 to-blue-600' :
          color === 'green' ? 'from-green-400 to-green-600' :
          color === 'purple' ? 'from-purple-400 to-purple-600' :
          color === 'orange' ? 'from-orange-400 to-orange-600' :
          'from-red-400 to-red-600'
        } rounded-b-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>
      </div>
    );
  };

  const ConnectionIndicator = () => {
    if (connectionLoading) {
      return (
        <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Checking connection...</span>
        </div>
      );
    }

    const isConnected = connectionStatus?.isConnected;
    const responseTime = connectionStatus?.responseTime;

    return (
      <div className={`flex items-center space-x-3 px-4 py-2 rounded-full border transition-all duration-300 ${
        isConnected 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      }`}>
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${
            isConnected 
              ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-400/50' 
              : 'bg-gradient-to-r from-red-400 to-red-600 shadow-lg shadow-red-400/50'
          } ${isConnected ? 'animate-pulse' : ''}`}></div>
          {isConnected && (
            <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-40"></div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {responseTime && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              responseTime < 100 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : responseTime < 300
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {responseTime}ms
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl glass-strong">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Statistics Dashboard
              </h2>
              <p className="text-purple-600 dark:text-purple-300 font-medium text-sm">
                Real-time insights into your MeiliSearch instance
              </p>
            </div>
          </div>
        </div>
        <ConnectionIndicator />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={totalDocuments}
          subtitle="Across all indexes"
          icon="📄"
          color="blue"
          isLoading={statsLoading}
        />
        
        <StatCard
          title="Active Indexes"
          value={indexStats?.length || 0}
          subtitle={indexingCount > 0 ? `${indexingCount} indexing` : 'All ready'}
          icon="🗂️"
          color="green"
          isLoading={statsLoading}
        />
        
        <StatCard
          title="Server Version"
          value={connectionStatus?.version || 'Unknown'}
          subtitle="MeiliSearch version"
          icon="🚀"
          color="purple"
          isLoading={connectionLoading}
        />
        
        <StatCard
          title="Response Time"
          value={connectionStatus?.responseTime ? `${connectionStatus.responseTime}ms` : 'N/A'}
          subtitle="Server latency"
          icon="⚡"
          color={connectionStatus?.responseTime ? 
            (connectionStatus.responseTime < 100 ? 'green' : 
             connectionStatus.responseTime < 300 ? 'orange' : 'red') : 'blue'
          }
          isLoading={connectionLoading}
        />
      </div>

      {/* Index Details */}
      {indexStats && indexStats.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <span className="text-xl">🗂️</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Index Details
            </h3>
          </div>
          
          <div className="grid gap-6">
            {indexStats.map((index, i) => (
              <div 
                key={index.uid}
                className={`
                  group p-6 rounded-xl border backdrop-blur-sm transition-all duration-300
                  bg-gradient-to-br from-white/70 to-gray-50/70 dark:from-gray-800/70 dark:to-gray-900/70
                  border-gray-200/60 dark:border-gray-700/60
                  hover:shadow-xl hover:scale-[1.01] hover:border-blue-300 dark:hover:border-blue-600
                  animate-stagger-in
                `}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Header with index name and status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <h4 className="font-bold text-xl text-gray-900 dark:text-white font-mono">
                        {index.uid}
                      </h4>
                    </div>
                    {index.isIndexing && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full border border-orange-200 dark:border-orange-800">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                          ⚡ INDEXING
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {index.numberOfDocuments.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      📄 documents
                    </div>
                  </div>
                </div>
                
                {/* Metadata section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30">
                      <span className="text-sm">🔑</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Primary Key</span>
                      <div className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                        {index.primaryKey || 'Auto-generated'}
                      </div>
                    </div>
                  </div>
                  
                  {index.fieldDistribution && Object.keys(index.fieldDistribution).length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-green-100 dark:bg-green-900/30">
                        <span className="text-sm">🏷️</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Fields</span>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">
                          {Object.keys(index.fieldDistribution).length} attributes
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Field Distribution */}
                {index.fieldDistribution && Object.keys(index.fieldDistribution).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {Object.entries(index.fieldDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 8)
                        .map(([field, count]) => (
                          <div key={field} className="flex justify-between">
                            <span className="font-mono text-gray-600 dark:text-gray-400 truncate">
                              {field}
                            </span>
                            <span className="text-gray-500 dark:text-gray-500 ml-1">
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!statsLoading && (!indexStats || indexStats.length === 0) && (
        <div className="text-center py-16 px-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full mb-6 shadow-lg">
            <span className="text-4xl">📭</span>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent mb-3">
            No indexes found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            Create an index and add some documents to see detailed statistics and insights here.
          </p>
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <span className="text-sm">💡</span>
              <span className="text-sm font-medium">Use the "Indexes & Documents" tab to get started</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};