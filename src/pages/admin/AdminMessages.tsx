
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  last_message: string | null;
  last_message_at: string;
  buyer?: { full_name: string; email: string };
  seller?: { full_name: string; email: string };
  product?: { name: string };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender?: { full_name: string };
}

export default function AdminMessages() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/marketplace');
      return;
    }
    fetchConversations();
  }, [profile, navigate]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          buyer:profiles!buyer_id(full_name, email),
          seller:profiles!seller_id(full_name, email),
          product:products(name)
        `)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to fetch conversations');
      } else if (data) {
        setConversations(data as any);
        if (data.length > 0) {
          setSelectedConversation(data[0] as any);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        setMessages(data as any);
      }
    } catch (err) {
      console.error('Unexpected error fetching messages:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-full mb-6">
              <i className="ri-shield-user-line text-blue-400"></i>
              Administrative Oversight
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Communications<br /><span className="text-blue-600">Audit.</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-wide text-[10px] mt-4">
              Monitoring verified student marketplace interactions
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4">
            <i className="ri-error-warning-fill text-2xl text-rose-600"></i>
            <p className="text-sm font-bold text-rose-900 uppercase tracking-tight">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden" style={{ height: 'calc(100vh - 350px)' }}>
          <div className="grid grid-cols-12 h-full">
            {/* Conversations List */}
            <div className="col-span-12 md:col-span-4 border-r border-gray-50 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                    <i className="ri-message-3-line text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-2">Internal Traffic Zero</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-relaxed">No active marketplace conversations recorded</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-6 hover:bg-gray-50/50 cursor-pointer transition-all relative ${selectedConversation?.id === conversation.id ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      {selectedConversation?.id === conversation.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                      )}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider truncate mr-4">
                            {conversation.buyer?.full_name} / {conversation.seller?.full_name}
                          </h3>
                          <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                            {new Date(conversation.last_message_at).toLocaleDateString()}
                          </span>
                        </div>
                        {conversation.product && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-md text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-3">
                            <i className="ri-shopping-bag-3-fill text-blue-500"></i>
                            {conversation.product.name}
                          </div>
                        )}
                        <p className="text-xs font-semibold text-gray-500 truncate leading-relaxed">
                          {conversation.last_message || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="col-span-12 md:col-span-8 flex flex-col bg-gray-50/20">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-50 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 leading-none">Record View</h3>
                        <p className="text-lg font-bold text-gray-900 tracking-tight">
                          {selectedConversation.buyer?.full_name} ↔ {selectedConversation.seller?.full_name}
                        </p>
                      </div>
                      {selectedConversation.product && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 leading-none">Inquiry On</p>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">{selectedConversation.product.name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Metadata Only - No Payload</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="flex flex-col">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                              {message.sender?.full_name?.[0]}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wide mr-2">
                                {message.sender?.full_name}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 tabular-nums">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-6 py-4 max-w-xl shadow-sm">
                            <p className="text-sm font-semibold text-gray-700 leading-relaxed">{message.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                      <i className="ri-chat-3-line text-3xl text-gray-300"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-2">Select Transcript</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Awaiting interaction protocol selection</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
