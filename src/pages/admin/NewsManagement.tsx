import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

type NewsArticle = {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  author_id: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  author?: { full_name: string };
};

export default function NewsManagement() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'news_publisher') {
      fetchNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    image_url: '',
    status: 'draft' as 'draft' | 'published',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin' && profile?.role !== 'news_publisher') {
      navigate('/marketplace');
      return;
    }
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, navigate]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('campus_news')
        .select('*, author:profiles!author_id(full_name)')
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter === 'published') {
        query = query.eq('is_published', true);
      } else if (filter === 'draft') {
        query = query.eq('is_published', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNews(data as any || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { status, ...rest } = formData;
      const newsData = {
        ...rest,
        author_id: profile?.id,
        is_published: status === 'published',
      };

      if (editingNews) {
        const { error } = await supabase
          .from('campus_news')
          .update(newsData)
          .eq('id', editingNews.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campus_news')
          .insert([newsData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingNews(null);
      setFormData({
        title: '',
        content: '',
        category: 'General',
        image_url: '',
        status: 'draft',
      });
      fetchNews();
    } catch (error: any) {
      alert(error.message || 'Failed to save news');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingNews(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      image_url: article.image_url || '',
      status: article.is_published ? 'published' : 'draft',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news article?')) return;

    try {
      const { error } = await supabase
        .from('campus_news')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNews();
    } catch (error: any) {
      alert(error.message || 'Failed to delete news');
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('campus_news')
        .update({
          is_published: !isPublished,
        })
        .eq('id', id);

      if (error) throw error;

      // If we just published the article (was false, now true)
      if (!isPublished) {
        try {
          const { data: article } = await supabase.from('campus_news').select('*').eq('id', id).single();

          if (article) {
            const { sendSMS } = await import('../../lib/arkesel');

            // In a real app with thousands of users, you would use a backend job or batching.
            // Here we fetch users with phones. Warning: limit 1000 for safety, but could be more.
            const { data: users } = await supabase.from('profiles').select('phone').not('phone', 'is', null).limit(1000);

            if (users && users.length > 0) {
              // Extract phone numbers properly
              const phoneNumbers = users.map(u => u.phone).filter(p => p && p.length > 5);

              if (phoneNumbers.length > 0) {
                await sendSMS(
                  phoneNumbers,
                  `CAMPUS NEWS: ${article.title}. Read more at: https://pentvars-connect.netlify.app/news/${id}`
                );
              }
            }
          }
        } catch (smsErr) {
          console.error('Failed to send news broadcast:', smsErr);
        }
      }

      fetchNews();
      alert(`News ${!isPublished ? 'published' : 'unpublished'} successfully!`);
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredNews = news.filter((article) => {
    // 1. Filter by Status
    if (filter !== 'all') {
      const isPublished = filter === 'published';
      if (article.is_published !== isPublished) return false;
    }

    // 2. Filter by Search Query
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.author?.full_name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">News Management</h1>
            <p className="text-gray-600 mt-2">Create and manage campus news articles</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(profile?.role === 'admin' ? '/admin' : '/publisher')}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Dashboard
            </button>
            <button
              onClick={() => {
                setEditingNews(null);
                setFormData({
                  title: '',
                  content: '',
                  category: 'General',
                  image_url: '',
                  status: 'draft',
                });
                setShowModal(true);
              }}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line mr-2"></i>
              Create News
            </button>
          </div>
        </div>
      </div>  {/* Closing Search/Filter Flex Container */}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search news by title, category, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-2 flex-shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${filter === 'all' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              All ({news.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${filter === 'published' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Published ({news.filter(n => n.is_published).length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${filter === 'draft' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Drafts ({news.filter(n => !n.is_published).length})
            </button>
          </div>
        </div>

        {/* News List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-sky-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading news...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <i className="ri-newspaper-line text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No news articles</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first news article</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              Create News
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredNews.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex">
                  {article.image_url && (
                    <div className="w-48 h-48 flex-shrink-0">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
                            {article.category}
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${article.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                            }`}>
                            {article.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            <i className="ri-user-line mr-1"></i>
                            {article.author?.full_name}
                          </span>
                          <span>
                            <i className="ri-eye-line mr-1"></i>
                            {article.views_count} views
                          </span>
                          <span>
                            <i className="ri-calendar-line mr-1"></i>
                            {new Date(article.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(article)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-edit-line mr-2"></i>
                        Edit
                      </button>
                      <button
                        onClick={() => handlePublish(article.id, article.is_published)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${article.is_published
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                      >
                        <i className={`${article.is_published ? 'ri-eye-off-line' : 'ri-send-plane-line'} mr-2`}></i>
                        {article.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-delete-bin-line mr-2"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingNews ? 'Edit News Article' : 'Create News Article'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter news title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Events">Events</option>
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                  <option value="Announcements">Announcements</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  placeholder="Write your news content here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent cursor-pointer"
                >
                  <option value="draft">Save as Draft</option>
                  <option value="published">Publish Now</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {saving ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2"></i>
                      {editingNews ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
