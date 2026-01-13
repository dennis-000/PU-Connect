
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: any;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function ActivityMonitor() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/marketplace');
      return;
    }
    fetchActivities();
    
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        user:profiles!user_id(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setActivities(data as any);
    }
    setLoading(false);
  };

  const filteredActivities = filterType === 'all' 
    ? activities 
    : activities.filter(a => a.action_type === filterType);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login': return 'ri-login-box-line';
      case 'logout': return 'ri-logout-box-line';
      case 'product_created': return 'ri-add-box-line';
      case 'product_updated': return 'ri-edit-box-line';
      case 'product_deleted': return 'ri-delete-bin-line';
      case 'message_sent': return 'ri-message-line';
      case 'application_submitted': return 'ri-file-list-line';
      default: return 'ri-information-line';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'login': return 'bg-green-100 text-green-700';
      case 'logout': return 'bg-gray-100 text-gray-700';
      case 'product_created': return 'bg-blue-100 text-blue-700';
      case 'product_updated': return 'bg-yellow-100 text-yellow-700';
      case 'product_deleted': return 'bg-red-100 text-red-700';
      case 'message_sent': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Monitor</h1>
          <p className="text-gray-600">Real-time monitoring of platform activities</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Activities
            </button>
            <button
              onClick={() => setFilterType('login')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'login'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Logins
            </button>
            <button
              onClick={() => setFilterType('product_created')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'product_created'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setFilterType('message_sent')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'message_sent'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Messages
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-history-line text-5xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">Activities will appear here as users interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action_type)}`}>
                    <i className={`${getActionIcon(activity.action_type)} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {activity.user?.full_name || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {activity.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {activity.action_details && (
                      <p className="text-xs text-gray-500">
                        {JSON.stringify(activity.action_details)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
