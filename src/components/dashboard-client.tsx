"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Droplets, TrendingUp, CheckCircle, Store, AlertCircle, Box, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getDashboardData } from '@/lib/data';

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const urlStart = searchParams.get('start') || '';
  const urlEnd = searchParams.get('end') || '';
  const urlWarehouse = searchParams.get('warehouse') || '';

  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(urlStart);
  const [endDate, setEndDate] = useState(urlEnd);
  const [warehouse, setWarehouse] = useState(urlWarehouse);
  const [showMissingStores, setShowMissingStores] = useState(false);
  const [showTopOutlets, setShowTopOutlets] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getDashboardData(urlStart, urlEnd, urlWarehouse)
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [urlStart, urlEnd, urlWarehouse]);

  const handleDateFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (warehouse) params.set('warehouse', warehouse);
    router.push(`/?${params.toString()}`);
  };

  const handleResetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setWarehouse('');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow-sm max-w-md text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { kpiData, volumeTrendData, topPerformers, topOutlets, bottomOutlets, summary } = data;

  const filteredTransactions = data.recentTransactions?.filter((tx: any) => 
    tx.outlet.toLowerCase().includes(filterText.toLowerCase()) || 
    tx.sender.toLowerCase().includes(filterText.toLowerCase())
  ) || [];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = [...filteredTransactions].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-600" />
      : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-600" />;
  };

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            {/* Global Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-2 bg-white p-3 sm:px-3 sm:py-1.5 rounded-md shadow-sm border w-full sm:w-auto">
              <select 
                className="text-sm border-none focus:ring-0 text-slate-600 bg-slate-50 sm:bg-transparent rounded px-2 py-1 outline-none cursor-pointer w-full sm:w-auto"
                value={warehouse}
                onChange={(e) => {
                  const newWarehouse = e.target.value;
                  setWarehouse(newWarehouse);
                  const params = new URLSearchParams();
                  if (startDate) params.set('start', startDate);
                  if (endDate) params.set('end', endDate);
                  if (newWarehouse) params.set('warehouse', newWarehouse);
                  router.push(`/?${params.toString()}`);
                }}
              >
                <option value="">All Warehouses</option>
                <option value="Bangalore Warehouse">Bangalore Warehouse</option>
                <option value="Chennai Warehouse">Chennai Warehouse</option>
                <option value="Gurgaon Warehouse">Gurgaon Warehouse</option>
                <option value="Hyderabad Warehouse">Hyderabad Warehouse</option>
              </select>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-slate-50 sm:bg-transparent rounded px-2 py-1 w-full sm:w-auto">
                <input 
                  type="date" 
                  className="text-sm border-none focus:ring-0 text-slate-600 bg-transparent outline-none cursor-pointer w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-400 text-sm text-center">to</span>
                <input 
                  type="date" 
                  className="text-sm border-none focus:ring-0 text-slate-600 bg-transparent outline-none cursor-pointer w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 justify-end sm:justify-start mt-1 sm:mt-0">
                <button 
                  onClick={handleDateFilter}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors flex-1 sm:flex-none"
                >
                  Apply
                </button>
                <button 
                  onClick={handleResetDateFilter}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-3 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors border border-transparent hover:border-slate-200 flex-1 sm:flex-none"
                >
                  Reset
                </button>
                
                <div className="hidden sm:block w-px h-5 bg-slate-200 mx-1"></div>
                
                <button 
                  onClick={() => setShowMissingStores(!showMissingStores)}
                  className={`px-3 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors border flex-1 sm:flex-none ${
                    showMissingStores 
                      ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600' 
                      : 'text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  {showMissingStores ? 'Hide Missing' : 'Show Missing'}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-md shadow-sm border hidden sm:flex">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>Live System Active</span>
            </div>
          </div>
        </div>

        {/* AI Insight Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-4 shadow-sm">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-0.5">
            <TrendingUp size={20} />
          </div>
          <div className="flex items-center">
            <p className="text-blue-800 text-sm font-medium">{summary}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume Collected</CardTitle>
              <Droplets className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalVolume} kg</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp size={12} className="mr-1" />
                {kpiData.totalVolumeGrowth} from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tins</CardTitle>
              <Box className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalTins}</div>
              <p className="text-xs text-slate-500 mt-1">
                Collected in current cycle
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fill Efficiency Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.fillEfficiency} kg/tin</div>
              <p className="text-xs text-amber-600 flex items-center mt-1">
                Expected: 15.0 kg/tin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Outlets</CardTitle>
              <Store className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.activeOutlets}</div>
              <p className="text-xs text-slate-500 mt-1">
                Participating in current cycle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Full Fill Compliance</CardTitle>
              <CheckCircle className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.complianceRate}%</div>
              <p className="text-xs text-emerald-600 mt-1">
                Target: &gt; 90%
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md hover:ring-2 hover:ring-rose-200 transition-all duration-200"
            onClick={() => setShowMissingStores(!showMissingStores)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-600">Missing Outlet</CardTitle>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-700">{kpiData.missingStoresCount}</div>
              <p className="text-xs text-rose-600 mt-1 truncate" title={kpiData.missingStoresList.join(', ')}>
                {kpiData.missingStoresList.slice(0, 2).join(', ')} 
                {kpiData.missingStoresCount > 2 ? ` & ${kpiData.missingStoresCount - 2} more` : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Warehouses</CardTitle>
              <CardDescription>Highest volume by Warehouse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4 min-w-[0]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={topPerformers} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} width={110} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                    <Bar dataKey="volume" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
              <div>
                <CardTitle>{showTopOutlets ? 'Top Outlets' : 'Lowest Outlets'}</CardTitle>
                <CardDescription>{showTopOutlets ? 'Highest volume by Outlet' : 'Lowest volume by Outlet'}</CardDescription>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button 
                  onClick={() => setShowTopOutlets(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${showTopOutlets ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Top 10
                </button>
                <button 
                  onClick={() => setShowTopOutlets(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${!showTopOutlets ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Lowest 10
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4 min-w-[0]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={showTopOutlets ? topOutlets : bottomOutlets} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} width={130} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                    <Bar dataKey="volume" fill={showTopOutlets ? "#8b5cf6" : "#f43f5e"} radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conditional Tables */}
        {showMissingStores ? (
          <Card className="mt-8 border-rose-100 shadow-sm ring-1 ring-rose-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 bg-rose-50/50 rounded-t-lg">
              <div>
                <CardTitle className="text-rose-700 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Missing Outlets List
                </CardTitle>
                <CardDescription>Stores that have not submitted data in the selected period</CardDescription>
              </div>
              <button 
                onClick={() => setShowMissingStores(false)}
                className="text-sm px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-md hover:bg-rose-50 font-medium transition-colors"
              >
                Close List
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-rose-800 uppercase bg-rose-50 border-y border-rose-100">
                    <tr>
                      <th className="px-6 py-4 font-medium w-24">S.No</th>
                      <th className="px-6 py-4 font-medium">Outlet Name</th>
                      <th className="px-6 py-4 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {kpiData.missingStoresList.map((store: string, idx: number) => (
                      <tr key={store} className="hover:bg-rose-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{store}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            Missing
                          </span>
                        </td>
                      </tr>
                    ))}
                    {kpiData.missingStoresList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">All stores have submitted data!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>All Collections</CardTitle>
                <CardDescription>Full dispatch log from all outlets</CardDescription>
              </div>
              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                <input 
                  type="text" 
                  placeholder="Search outlet or sender..." 
                  className="px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-64"
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium rounded-tl-lg cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('date')}>
                        <div className="flex items-center">Date {renderSortIcon('date')}</div>
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('warehouse')}>
                        <div className="flex items-center">Warehouse {renderSortIcon('warehouse')}</div>
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('outlet')}>
                        <div className="flex items-center">Outlet {renderSortIcon('outlet')}</div>
                      </th>
                      <th className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('sender')}>
                        <div className="flex items-center">Sender {renderSortIcon('sender')}</div>
                      </th>
                      <th className="px-6 py-4 font-medium text-right cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('tins')}>
                        <div className="flex items-center justify-end">Tins {renderSortIcon('tins')}</div>
                      </th>
                      <th className="px-6 py-4 font-medium text-right whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('volume')}>
                        <div className="flex items-center justify-end">Volume (kg) {renderSortIcon('volume')}</div>
                      </th>
                      <th className="px-6 py-4 font-medium text-center rounded-tr-lg cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('status')}>
                        <div className="flex items-center justify-center">Status {renderSortIcon('status')}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedTransactions.map((tx: any, idx: number) => (
                      <tr key={`${tx.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{tx.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            {tx.warehouse}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{tx.outlet}</td>
                        <td className="px-6 py-4 text-slate-600">{tx.sender}</td>
                        <td className="px-6 py-4 text-right text-slate-900">{tx.tins}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">{tx.volume}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No transactions found matching your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mt-4 border-t pt-4">
                  <span className="text-sm text-slate-500 text-center sm:text-left">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries
                  </span>
                  <div className="flex flex-wrap justify-center gap-1 sm:space-x-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded-md text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                      Prev
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                          currentPage === page 
                            ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded-md text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
