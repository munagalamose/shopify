import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Simple Chart component since we can't install Chart.js dependencies yet
const SimpleChart = ({ data, title, type = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-500 text-center py-8">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || d.revenue || d.order_count || 0));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.slice(0, 10).map((item, index) => {
          const value = item.value || item.revenue || item.order_count || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate">
                {item.label || item.date || item.name || `Item ${index + 1}`}
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-20 text-sm text-gray-900 text-right">
                {typeof value === 'number' && value > 1000 ? `$${value.toFixed(0)}` : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Charts = () => {
  const [chartsData, setChartsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const { token, API_BASE_URL } = useAuth();

  useEffect(() => {
    fetchChartsData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChartsData = async () => {
    setLoading(true);
    try {
      const [ordersResponse, customersResponse, revenueResponse, topCustomersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/data/orders-by-date?groupBy=day&startDate=${getStartDate()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/data/customer-acquisition?period=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/data/revenue-trends?period=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/data/top-customers?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [ordersData, customersData, revenueData, topCustomersData] = await Promise.all([
        ordersResponse.json(),
        customersResponse.json(),
        revenueResponse.json(),
        topCustomersResponse.json()
      ]);

      setChartsData({
        orders: ordersData.ordersByDate || [],
        customers: customersData.customerAcquisition || [],
        revenue: revenueData.revenueTrends || [],
        topCustomers: topCustomersData.topCustomers || []
      });
    } catch (error) {
      console.error('Error fetching charts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(dateRange));
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart
          data={chartsData.revenue?.map(item => ({
            label: new Date(item.date).toLocaleDateString(),
            value: parseFloat(item.revenue || 0)
          }))}
          title="Revenue Trends"
        />
        
        <SimpleChart
          data={chartsData.orders?.map(item => ({
            label: new Date(item.date).toLocaleDateString(),
            value: item.order_count
          }))}
          title="Orders by Date"
        />
        
        <SimpleChart
          data={chartsData.customers?.map(item => ({
            label: new Date(item.date).toLocaleDateString(),
            value: item.new_customers
          }))}
          title="Customer Acquisition"
        />
        
        <SimpleChart
          data={chartsData.topCustomers?.map(customer => ({
            label: `${customer.first_name} ${customer.last_name}`,
            value: parseFloat(customer.total_spent || 0)
          }))}
          title="Top 5 Customers by Spend"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              ${chartsData.revenue?.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Revenue ({dateRange} days)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {chartsData.orders?.reduce((sum, item) => sum + (item.order_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Orders ({dateRange} days)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {chartsData.customers?.reduce((sum, item) => sum + (item.new_customers || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">New Customers ({dateRange} days)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
