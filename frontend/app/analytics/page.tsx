"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Undo2,
  DollarSign,
  BarChart3,
  PieChart,
  LayoutDashboard,
  Store,
  Warehouse,
  Settings,
  Menu,
  RefreshCw,
} from "lucide-react";
import { api } from "../../lib/api";

type MetricCardProps = {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  iconBgColor: string;
  isLoading?: boolean;
};

type ChartDataPoint = {
  date: string;
  label: string;
  sales: number;
  returns: number;
  orders: number;
};

type CategoryData = {
  category: string;
  value: number;
  percentage: number;
  color: string;
};

type TimePeriod = '7' | '30' | '90' | '365';

const MetricCard = ({ title, value, change, icon, iconBgColor, isLoading }: MetricCardProps) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          {isLoading ? (
            <div className="h-9 w-32 bg-gray-700 animate-pulse rounded mb-3"></div>
          ) : (
            <h3 className="text-3xl font-bold text-white mb-3">{value}</h3>
          )}
          <div className="flex items-center gap-1">
            {isLoading ? (
              <div className="h-4 w-24 bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
                  {isPositive ? "+" : ""}{change.toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm ml-1">vs last period</span>
              </>
            )}
          </div>
        </div>
        <div className={`${iconBgColor} rounded-lg p-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const SalesChart = ({ data, isLoading, activePeriod, onPeriodChange }: { 
  data: ChartDataPoint[]; 
  isLoading: boolean;
  activePeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}) => {
  if (isLoading || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="h-8 w-48 bg-gray-700 animate-pulse rounded mb-6"></div>
        <div className="h-80 bg-gray-700 animate-pulse rounded"></div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => Math.max(d.sales, d.returns)));
  const chartHeight = 300;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Sales & Returns Overview</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => onPeriodChange('7')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activePeriod === '7' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            7D
          </button>
          <button 
            onClick={() => onPeriodChange('30')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activePeriod === '30' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            30D
          </button>
          <button 
            onClick={() => onPeriodChange('90')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activePeriod === '90' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            90D
          </button>
          <button 
            onClick={() => onPeriodChange('365')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activePeriod === '365' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            1Y
          </button>
        </div>
      </div>
      
      <div className="relative" style={{ height: chartHeight }}>
        <div className="absolute inset-0 flex items-end justify-between gap-2">
          {data.map((point, index) => {
            const salesHeight = maxValue > 0 ? (point.sales / maxValue) * chartHeight : 0;
            const returnsHeight = maxValue > 0 ? (point.returns / maxValue) * chartHeight : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end gap-1 h-full relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-gray-700">
                    <div>Sales: ${point.sales.toLocaleString()}</div>
                    <div>Returns: ${point.returns.toLocaleString()}</div>
                    <div>Orders: {point.orders}</div>
                  </div>
                  
                  <div 
                    className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ height: `${salesHeight}px`, minHeight: point.sales > 0 ? '2px' : '0' }}
                  />
                  <div 
                    className="flex-1 bg-gradient-to-t from-red-600 to-red-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ height: `${returnsHeight}px`, minHeight: point.returns > 0 ? '2px' : '0' }}
                  />
                </div>
                <span className="text-xs text-gray-400">{point.label}</span>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>${Math.round(maxValue / 1000)}k</span>
          <span>${Math.round(maxValue * 0.6 / 1000)}k</span>
          <span>${Math.round(maxValue * 0.4 / 1000)}k</span>
          <span>${Math.round(maxValue * 0.2 / 1000)}k</span>
          <span>$0k</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-green-600 to-green-400 rounded"></div>
          <span className="text-sm text-gray-400">Sales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-red-600 to-red-400 rounded"></div>
          <span className="text-sm text-gray-400">Returns</span>
        </div>
      </div>
    </div>
  );
};

const DonutChart = ({ data, isLoading }: { data: CategoryData[]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="h-6 w-40 bg-gray-700 animate-pulse rounded mb-6"></div>
        <div className="h-48 bg-gray-700 animate-pulse rounded"></div>
      </div>
    );
  }
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-6">Value Distribution</h3>
      
      <div className="flex items-center gap-8">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {data.map((item, index) => {
              const angle = (item.percentage / 100) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;
              
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (currentAngle * Math.PI) / 180;
              
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              
              const largeArc = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');
              
              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={item.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                  <title>{`${item.category}: $${item.value.toLocaleString()} (${item.percentage.toFixed(1)}%)`}</title>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="25" fill="#1f2937" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white text-xl font-bold">${(total / 1000).toFixed(0)}k</div>
              <div className="text-gray-400 text-xs">Total</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between hover:bg-gray-700/50 p-2 rounded transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }} />
                <span className="text-gray-300">{item.category}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">${item.value.toLocaleString()}</div>
                <div className="text-gray-500 text-sm">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const menuItems = [
    { icon: ShoppingCart, label: "E-commerce", href: "/analytics", active: true },
    { icon: Store, label: "Retail", href: "/retail-homepage" },
    { icon: LayoutDashboard, label: "Distribution", href: "/forms" },
    { icon: Package, label: "Inventory", href: "/domestic-inventory" },
    { icon: Warehouse, label: "Shop Warehouse", href: "/shop-inventory" },
  ];
  
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-gray-900 border-r border-gray-800 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-8 h-8 text-green-500" />
            <div>
              <h2 className="text-white font-bold text-lg">Analytics</h2>
              <p className="text-gray-400 text-sm">Admin Dashboard</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${item.active 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <a
            href="/forms"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    ordersCount: 0,
    productsSold: 0,
    totalReturns: 0,
    salesChange: 0,
    ordersChange: 0,
    productsSoldChange: 0,
    returnsChange: 0,
  });
  
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timePeriod]);
  
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all analytics data in one call
      const response = await api.get(`/analytics/dashboard?days=${timePeriod}`);
      
      if (response.data.success) {
        const { summary, timeSeries, distribution } = response.data.data;
        
        // Update metrics
        setMetrics({
          totalSales: summary.totalSales || 0,
          ordersCount: summary.ordersCount || 0,
          productsSold: summary.productsSold || 0,
          totalReturns: summary.totalReturns || 0,
          salesChange: summary.salesChange || 0,
          ordersChange: summary.ordersChange || 0,
          productsSoldChange: summary.productsSoldChange || 0,
          returnsChange: summary.returnsChange || 0,
        });
        
        // Update chart data
        setChartData(timeSeries || []);
        
        // Update category distribution
        setCategoryData(distribution || []);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      // Set some default data on error
      setChartData([]);
      setCategoryData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalyticsData();
  };
  
  const handlePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search metrics..."
                  className="bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`text-gray-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-6 h-6" />
              </button>
              <button className="relative text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <a
                href="/forms"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Data
              </a>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">E-commerce Analytics</h1>
            <p className="text-gray-400">Monitor your online store performance - Last {timePeriod} days</p>
          </div>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Sales"
              value={`$${metrics.totalSales.toLocaleString()}`}
              change={metrics.salesChange}
              icon={<DollarSign className="w-6 h-6 text-white" />}
              iconBgColor="bg-teal-600"
              isLoading={isLoading}
            />
            <MetricCard
              title="Orders"
              value={metrics.ordersCount.toLocaleString()}
              change={metrics.ordersChange}
              icon={<ShoppingCart className="w-6 h-6 text-white" />}
              iconBgColor="bg-teal-600"
              isLoading={isLoading}
            />
            <MetricCard
              title="Products Sold"
              value={metrics.productsSold.toLocaleString()}
              change={metrics.productsSoldChange}
              icon={<Package className="w-6 h-6 text-white" />}
              iconBgColor="bg-amber-600"
              isLoading={isLoading}
            />
            <MetricCard
              title="Returns"
              value={`$${metrics.totalReturns.toLocaleString()}`}
              change={metrics.returnsChange}
              icon={<Undo2 className="w-6 h-6 text-white" />}
              iconBgColor="bg-red-600"
              isLoading={isLoading}
            />
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesChart 
                data={chartData} 
                isLoading={isLoading}
                activePeriod={timePeriod}
                onPeriodChange={handlePeriodChange}
              />
            </div>
            <div>
              <DonutChart data={categoryData} isLoading={isLoading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
