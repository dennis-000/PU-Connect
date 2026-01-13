import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

type SellerProfile = {
  id: string;
  user_id: string;
  business_name: string;
  subscription_status: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  last_payment_amount: number | null;
  last_payment_date: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
};

type Payment = {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  payment_reference: string;
  payment_status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
};

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sellers' | 'payments'>('sellers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: sellersData, error: sellersError } = await supabase
        .from('seller_profiles')
        .select('*, profiles!seller_profiles_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false });

      if (sellersError) throw sellersError;
      setSellers(sellersData || []);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('subscription_payments')
        .select('*, profiles!subscription_payments_seller_id_fkey(full_name, email)')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRenewal = async (sellerId: string) => {
    if (!confirm('Manually renew this seller\'s subscription for 1 month + 3 days?')) {
      return;
    }

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() + 3);

      const { error } = await supabase
        .from('seller_profiles')
        .update({
          subscription_status: 'active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          last_payment_date: startDate.toISOString(),
        })
        .eq('user_id', sellerId);

      if (error) throw error;

      await fetchData();
      alert('Subscription renewed successfully!');
    } catch (error) {
      console.error('Error renewing subscription:', error);
      alert('Failed to renew subscription');
    }
  };

  const handleSuspendSeller = async (sellerId: string) => {
    if (!confirm('Suspend this seller\'s subscription? Their products will be hidden.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({ subscription_status: 'inactive' })
        .eq('user_id', sellerId);

      if (error) throw error;

      await fetchData();
      alert('Seller subscription suspended');
    } catch (error) {
      console.error('Error suspending seller:', error);
      alert('Failed to suspend seller');
    }
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = 
      seller.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.profiles.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || seller.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter(payment =>
    payment.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: sellers.length,
    active: sellers.filter(s => s.subscription_status === 'active').length,
    expired: sellers.filter(s => s.subscription_status === 'expired').length,
    inactive: sellers.filter(s => s.subscription_status === 'inactive').length,
    totalRevenue: payments
      .filter(p => p.payment_status === 'success')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-sky-600 animate-spin"></i>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-gray-600">Monitor seller subscriptions and payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sellers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <i className="ri-store-line text-2xl text-sky-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-close-circle-line text-2xl text-red-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="ri-pause-circle-line text-2xl text-gray-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  GH₵ {stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-2xl text-amber-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('sellers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'sellers'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Seller Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment History
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                />
              </div>

              {activeTab === 'sellers' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Inactive</option>
                </select>
              )}
            </div>

            {activeTab === 'sellers' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSellers.map((seller) => {
                      const daysRemaining = getDaysRemaining(seller.subscription_end_date);
                      return (
                        <tr key={seller.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {seller.profiles.full_name}
                              </div>
                              <div className="text-sm text-gray-500">{seller.profiles.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{seller.business_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              seller.subscription_status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : seller.subscription_status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {seller.subscription_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {daysRemaining !== null ? (
                              <span className={`text-sm font-medium ${
                                daysRemaining < 0 ? 'text-red-600' :
                                daysRemaining <= 7 ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                                {daysRemaining < 0 ? 'Expired' : `${daysRemaining} days`}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {seller.last_payment_amount ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  GH₵ {seller.last_payment_amount.toFixed(2)}
                                </div>
                                {seller.last_payment_date && (
                                  <div className="text-sm text-gray-500">
                                    {new Date(seller.last_payment_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No payment</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleManualRenewal(seller.user_id)}
                                className="text-sky-600 hover:text-sky-800 font-medium cursor-pointer"
                              >
                                Renew
                              </button>
                              {seller.subscription_status === 'active' && (
                                <button
                                  onClick={() => handleSuspendSeller(seller.user_id)}
                                  className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredSellers.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-store-line text-5xl text-gray-300"></i>
                    <p className="mt-4 text-gray-500">No sellers found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.profiles.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{payment.profiles.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.currency} {payment.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">
                            {payment.payment_reference}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.payment_status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : payment.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(payment.subscription_start_date).toLocaleDateString()} -
                          </div>
                          <div className="text-sm text-gray-900">
                            {new Date(payment.subscription_end_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-money-dollar-circle-line text-5xl text-gray-300"></i>
                    <p className="mt-4 text-gray-500">No payments found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
