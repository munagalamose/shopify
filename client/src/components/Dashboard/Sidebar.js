import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'charts', name: 'Analytics', icon: '📈' },
    { id: 'products', name: 'Products', icon: '📦' },
    { id: 'customers', name: 'Customers', icon: '👥' },
    { id: 'orders', name: 'Orders', icon: '🛒' }
  ];

  return (
    <div className="bg-gray-800 text-white w-64 flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold">Xeno Analytics</h2>
        <p className="text-gray-300 text-sm mt-1">Shopify Insights</p>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
