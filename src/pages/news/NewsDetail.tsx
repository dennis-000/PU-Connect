import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';
import { useNewsArticle, useNews } from '../../hooks/useNews';

export default function NewsDetail() {
  const { id } = useParams();

  const { data: article, isLoading: loadingDocs } = useNewsArticle(id);

  const { data: relatedNews = [] } = useNews({
    category: article?.category,
    isPublished: true
  });

  const filteredRelatedNews = relatedNews
    .filter(n => n.id !== id)
    .slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.excerpt || article?.content?.substring(0, 100),
        url: window.location.href,
      }).catch(err => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loadingDocs) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 transition-colors duration-300">
        <Navbar />
        <div className="text-center py-24">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 transition-colors duration-300">
        <Navbar />
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-file-damage-line text-5xl text-red-300 dark:text-red-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">The news article you are looking for might have been removed or is temporarily unavailable.</p>
          <Link to="/news" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <i className="ri-arrow-left-line mr-2"></i>
            Back to news
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 transition-colors duration-300">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-10 flex items-center justify-between">
          <Link
            to="/news"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold text-[10px] md:text-sm uppercase tracking-widest transition-all cursor-pointer group"
          >
            <i className="ri-arrow-left-s-line text-lg md:text-xl group-hover:-translate-x-1 transition-transform"></i>
            Back to News
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400 cursor-pointer flex items-center justify-center"
              title="Share Article"
            >
              <i className="ri-share-forward-line text-lg"></i>
            </button>
          </div>
        </div>

        <article className="bg-white dark:bg-gray-900 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {article.image_url && (
            <div className="relative h-[24rem] md:h-[40rem] w-full overflow-hidden bg-gray-50 dark:bg-gray-800">
              <img
                src={getOptimizedImageUrl(article.image_url, 1500, 85)}
                alt={article.title}
                className="w-full h-full object-cover object-center"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40 dark:opacity-10 dark:from-gray-900"></div>
            </div>
          )}

          <div className="p-8 md:p-20">
            <div className="flex flex-wrap items-center gap-6 mb-12">
              <span className="px-5 py-2 bg-blue-600 text-white text-[10px] md:text-xs font-bold rounded-full uppercase tracking-widest">
                {article.category}
              </span>
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest border-l border-gray-200 dark:border-gray-700 pl-6">
                <i className="ri-calendar-event-line mr-2 text-blue-600"></i>
                {formatDate(article.created_at)}
              </div>
              {article.views_count > 0 && (
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest border-l border-gray-200 dark:border-gray-700 pl-6">
                  <i className="ri-eye-line mr-2 text-blue-600"></i>
                  {article.views_count} Views
                </div>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-12 leading-tight tracking-tight">
              {article.title}
            </h1>

            <div className="max-w-3xl mx-auto">
              <div className="prose prose-blue prose-lg md:prose-xl max-w-none dark:prose-invert">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg md:text-xl font-medium whitespace-pre-line first-letter:text-5xl first-letter:font-bold first-letter:text-blue-600 first-letter:mr-3 first-letter:float-left">
                  {article.content}
                </p>
              </div>

              {article.author && (
                <div className="mt-20 p-8 md:p-10 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-gray-900 font-bold text-xl">
                    {article.author.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Article Author</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{article.author.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mt-1">Official University Communications</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {filteredRelatedNews.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Related Articles</h2>
              <Link to="/news" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">
                View All News <i className="ri-arrow-right-line ml-1"></i>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredRelatedNews.map((news) => (
                <Link
                  key={news.id}
                  to={`/news/${news.id}`}
                  className="bg-white dark:bg-gray-900 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col p-3"
                >
                  <div className="h-48 bg-gray-50 dark:bg-gray-800 relative overflow-hidden rounded-xl">
                    {news.image_url ? (
                      <img
                        src={getOptimizedImageUrl(news.image_url, 600, 80)}
                        alt={news.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-newspaper-line text-4xl text-gray-100 dark:text-gray-700"></i>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase mb-3">
                      {news.category}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 transition-colors tracking-tight leading-snug">
                      {news.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

