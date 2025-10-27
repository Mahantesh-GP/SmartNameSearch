import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'purple' | 'blue' | 'gray'
}

export function LoadingSpinner({ size = 'md', color = 'purple' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  const colorClasses = {
    purple: 'border-purple-200 border-t-purple-500',
    blue: 'border-blue-200 border-t-blue-500',
    gray: 'border-gray-200 border-t-gray-500'
  }

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} border-2 rounded-full animate-spin`}></div>
  )
}

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={trend.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} 
                />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action 
}: {
  title: string
  description: string
  icon: React.ReactNode
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 btn-hover"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}