import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import { useAuth } from '../../contexts/AuthContext';

export default function EmailTemplates() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('breaking_news');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  // Dynamic Content State
  const [content, setContent] = useState({
    subject: 'Breaking News: Campus Connect Launch! 🚀',
    preheader: 'You don\'t want to miss this update...',
    heading: 'Big Things Are Happening',
    body: 'We are excited to announce major updates to the platform. Students can now trade faster, safer, and easier than ever before. Login today to see what is new!',
    ctaText: 'Check it Out',
    ctaLink: 'https://campusconnect.com/login',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  });

  // Template Definitions
  const templates = useMemo(() => ({
    breaking_news: {
      id: 'breaking_news',
      name: 'Breaking News',
      description: 'Urgent announcements and major updates.',
      generateHtml: (c: typeof content) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Montserrat', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
  .header h1 { margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 24px; }
  .hero-image { width: 100%; height: 250px; object-fit: cover; display: block; }
  .content { padding: 40px 30px; }
  .heading { font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 20px; color: #111; line-height: 1.2; }
  .text { font-size: 16px; color: #555; margin-bottom: 30px; }
  .btn { display: inline-block; background-color: #dc2626; color: white; text-decoration: none; padding: 15px 30px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
  .footer { background-color: #1f2937; color: #9ca3af; text-align: center; padding: 20px; font-size: 12px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Breaking News</h1>
    </div>
    ${c.imageUrl ? `<img src="${c.imageUrl}" alt="News" class="hero-image" />` : ''}
    <div class="content">
      <h2 class="heading">${c.heading}</h2>
      <p class="text">${c.body}</p>
      <div style="text-align: center;">
        <a href="${c.ctaLink}" class="btn">${c.ctaText}</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Campus Connect. All rights reserved.</p>
      <p>You received this email because you are subscribed to news updates.</p>
    </div>
  </div>
</body>
</html>`
    },
    general_blast: {
      id: 'general_blast',
      name: 'General Blast',
      description: 'Standard newsletter for varied content.',
      generateHtml: (c: typeof content) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Montserrat', sans-serif; line-height: 1.6; color: #334155; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .logo { font-weight: 900; font-size: 24px; color: #2563eb; text-decoration: none; display: block; text-align: center; margin-bottom: 30px; }
  .card { background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; }
  .image-container { width: 100%; height: 200px; background-color: #f1f5f9; }
  .image-container img { width: 100%; height: 100%; object-fit: cover; }
  .content { padding: 40px; }
  .header-text { font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 16px; }
  .body-text { color: #64748b; margin-bottom: 30px; font-size: 16px; }
  .btn { display: block; width: 100%; background: #2563eb; color: white; text-align: center; text-decoration: none; padding: 16px 0; border-radius: 12px; font-weight: bold; }
  .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="container">
    <a href="#" class="logo">CampusConnect.</a>
    <div class="card">
      ${c.imageUrl ? `<div class="image-container"><img src="${c.imageUrl}" alt="Update" /></div>` : ''}
      <div class="content">
        <h1 class="header-text">${c.heading}</h1>
        <p class="body-text">${c.body}</p>
        <a href="${c.ctaLink}" class="btn">${c.ctaText}</a>
      </div>
    </div>
    <div class="footer">
      <p>Sent with ❤️ from your campus team</p>
    </div>
  </div>
</body>
</html>`
    },
    welcome: {
      id: 'welcome',
      name: 'Welcome Series',
      description: 'Onboarding email for new users.',
      generateHtml: (c: typeof content) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Montserrat', sans-serif; line-height: 1.6; color: #334155; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .header { text-align: center; margin-bottom: 40px; }
  .logo { font-weight: 900; font-size: 24px; color: #2563eb; text-decoration: none; }
  .card { background: #f8fafc; border-radius: 24px; padding: 40px; border: 1px solid #e2e8f0; }
  .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: bold; margin-top: 20px; }
  .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">CampusConnect.</a>
    </div>
    <div class="card">
      <h1 style="margin: 0 0 20px 0; color: #0f172a;">${c.heading}</h1>
      <p>Hey there,</p>
      <p>${c.body}</p>
      <div style="text-align: center;">
        <a href="${c.ctaLink}" class="btn">${c.ctaText}</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Campus Connect. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
    }
  }), [content]);

  const handleCopy = () => {
    const html = templates[selectedTemplate as keyof typeof templates].generateHtml(content);
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    const template = templates[selectedTemplate as keyof typeof templates];
    if (!confirm(`Are you sure you want to send the "${template.name}" campaign to ALL newsletter subscribers?`)) return;

    setSending(true);
    try {
      // In a real app, this would call an Edge Function to loop through subscribers and send emails
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Campaign queued successfully! Emails will be sent shortly.');
    } catch (err) {
      alert('Failed to send campaign.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-20 font-sans">
      <Navbar />

      <div className="pt-32 md:pt-40 pb-12 box-border max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
                Marketing Tools
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Email Templates
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Create, customize, and blast emails.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/newsletter')}
              className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              <i className="ri-group-line text-lg"></i>
              View Subscribers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
          {/* Editor Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">1. Select Template</h3>
              <div className="space-y-3">
                {Object.values(templates).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTemplate === template.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                  >
                    <div className="font-bold text-sm">{template.name}</div>
                    <div className={`text-xs mt-1 ${selectedTemplate === template.id ? 'text-blue-100' : 'text-slate-500'}`}>{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">2. Customize Content</h3>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 block">Email Subject</label>
                <input
                  type="text"
                  value={content.subject}
                  onChange={(e) => setContent({ ...content, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 block">Main Heading</label>
                <input
                  type="text"
                  value={content.heading}
                  onChange={(e) => setContent({ ...content, heading: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 block">Image URL (Optional)</label>
                <input
                  type="text"
                  value={content.imageUrl}
                  onChange={(e) => setContent({ ...content, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium text-sm outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 block">Body Text</label>
                <textarea
                  value={content.body}
                  onChange={(e) => setContent({ ...content, body: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium text-sm min-h-[100px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 block">CTA Text</label>
                  <input
                    type="text"
                    value={content.ctaText}
                    onChange={(e) => setContent({ ...content, ctaText: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 block">CTA Link</label>
                  <input
                    type="text"
                    value={content.ctaLink}
                    onChange={(e) => setContent({ ...content, ctaLink: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-slate-200 dark:bg-slate-900 rounded-3xl p-4 md:p-8 flex flex-col border border-slate-300 dark:border-slate-800 flex-1 relative overflow-hidden min-h-[500px]">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

              {selectedTemplate && (
                <>
                  <div className="bg-white dark:bg-slate-800 rounded-t-2xl p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 z-10">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Previewing: {templates[selectedTemplate as keyof typeof templates].name}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Subject: {content.subject}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                      >
                        {copied ? <i className="ri-check-line text-emerald-500"></i> : <i className="ri-code-line"></i>}
                        {copied ? 'Copied' : 'Copy HTML'}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-white rounded-b-2xl shadow-xl overflow-hidden relative z-0">
                    <iframe
                      title="Preview"
                      srcDoc={templates[selectedTemplate as keyof typeof templates].generateHtml(content)}
                      className="w-full h-full border-none"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Ready to blast?</h3>
                <p className="text-sm text-slate-500">This will send emails to all subscribed users.</p>
              </div>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
              >
                {sending ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-rocket-2-fill"></i>}
                Send Campaign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
