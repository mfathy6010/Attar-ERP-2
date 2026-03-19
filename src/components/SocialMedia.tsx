import React, { useState, useEffect, useMemo } from 'react';
import { 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Share2, 
  Plus, 
  Send, 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  RefreshCw, 
  Settings as SettingsIcon,
  Smartphone,
  Video,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialAccount, SocialPost, SocialMessage, SocialComment } from '../types';
import { GoogleGenAI } from "@google/genai";

const AITip: React.FC<{ 
  accounts: SocialAccount[], 
  posts: SocialPost[], 
  messages: SocialMessage[],
  companyName: string 
}> = ({ accounts, posts, messages, companyName }) => {
  const [tip, setTip] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateTip = async () => {
      if (!process.env.GEMINI_API_KEY) {
        setTip('قم بإضافة GEMINI_API_KEY في الإعدادات للحصول على نصائح ذكية.');
        setIsLoading(false);
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `
            أنت خبير تسويق رقمي ومساعد ذكاء اصطناعي لشركة "${companyName}".
            بناءً على البيانات التالية، قدم نصيحة واحدة قصيرة ومحددة (باللغة العربية) حول أفضل وقت للنشر اليوم وما يجب نشره لزيادة التفاعل.
            
            البيانات الحالية:
            - الحسابات المتصلة: ${accounts.map(a => a.platform).join(', ')}
            - عدد المنشورات الأخيرة: ${posts.length}
            - إجمالي التفاعلات: ${posts.reduce((acc, p) => acc + (p.stats?.likes || 0) + (p.stats?.comments || 0), 0)}
            - رسائل غير مقروءة: ${messages.filter(m => !m.isRead && m.isIncoming).length}
            - التاريخ والوقت الحالي: ${new Date().toLocaleString('ar-EG')}
            
            اجعل النصيحة ملهمة وعملية ومختصرة جداً (أقل من 30 كلمة).
          `,
        });

        const response = await model;
        setTip(response.text || 'أفضل وقت للنشر هو عندما يكون جمهورك أكثر نشاطاً. جرب النشر في أوقات الذروة.');
      } catch (error) {
        console.error('AI Tip Error:', error);
        setTip('أفضل وقت للنشر هو عندما يكون جمهورك أكثر نشاطاً. جرب النشر في أوقات الذروة.');
      } finally {
        setIsLoading(false);
      }
    };

    generateTip();
  }, [accounts.length, posts.length, messages.length, companyName]);

  return (
    <div className="bg-emerald-600 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Sparkles size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} />
          <h3 className="font-bold">نصيحة الذكاء الاصطناعي</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-white/70">
            <RefreshCw size={14} className="animate-spin" />
            <span>جاري تحليل البيانات...</span>
          </div>
        ) : (
          <p className="text-xs text-white/90 leading-relaxed">
            {tip}
          </p>
        )}
      </div>
    </div>
  );
};

const SocialMedia: React.FC = () => {
  const { 
    socialAccounts, setSocialAccounts, 
    socialPosts, setSocialPosts, 
    socialMessages, setSocialMessages, 
    socialComments, setSocialComments,
    settings
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'messages' | 'comments' | 'accounts'>('feed');
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Calculate Stats
  const stats = useMemo(() => {
    const totalInteractions = socialPosts.reduce((acc, post) => {
      return acc + (post.stats?.likes || 0) + (post.stats?.comments || 0) + (post.stats?.shares || 0) + (post.stats?.views || 0);
    }, 0);

    const unreadMessages = socialMessages.filter(m => !m.isRead && m.isIncoming).length;

    const now = new Date();
    const postsThisMonth = socialPosts.filter(post => {
      const postDate = new Date(post.publishedAt || '');
      return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalInteractions,
      unreadMessages,
      postsThisMonth
    };
  }, [socialPosts, socialMessages]);

  // Listen for OAuth success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SOCIAL_AUTH_SUCCESS') {
        const { platform, data } = event.data;
        
        // Create new social account
        const newAccount: SocialAccount = {
          id: `${platform}_${Date.now()}`,
          platform: platform as any,
          name: platform === 'facebook' ? 'صفحة الفيسبوك' : platform === 'tiktok' ? 'حساب تيك توك' : 'حساب',
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + (data.expires_in * 1000),
          isActive: true
        };
        
        setSocialAccounts(prev => [...prev, newAccount]);
        setIsConnecting(null);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = (platform: string) => {
    setIsConnecting(platform);
    const authUrl = `/api/auth/${platform}`;
    window.open(authUrl, 'social_auth_popup', 'width=600,height=700');
  };

  const handlePost = async () => {
    if (!postContent || selectedPlatforms.length === 0) return;
    
    setIsPosting(true);
    
    // Simulate posting
    setTimeout(() => {
      const newPosts: SocialPost[] = selectedPlatforms.map(platform => ({
        id: `post_${Date.now()}_${platform}`,
        platform: platform as any,
        content: postContent,
        status: 'published',
        publishedAt: new Date().toISOString(),
        stats: { likes: 0, comments: 0, shares: 0, views: 0 }
      }));
      
      setSocialPosts(prev => [...newPosts, ...prev]);
      setPostContent('');
      setSelectedPlatforms([]);
      setIsPosting(false);
    }, 2000);
  };

  const platforms = [
    { id: 'facebook', name: 'فيسبوك', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'instagram', name: 'إنستجرام', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'whatsapp', name: 'واتساب', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'tiktok', name: 'تيك توك', icon: Video, color: 'text-black', bg: 'bg-gray-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة السوشيال ميديا</h1>
          <p className="text-gray-500">تحكم في جميع حساباتك من مكان واحد</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('accounts')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SettingsIcon size={18} />
            <span>إدارة الحسابات</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'feed', label: 'المنشورات', icon: Share2 },
          { id: 'messages', label: 'الرسائل', icon: MessageSquare },
          { id: 'comments', label: 'التعليقات', icon: MessageCircle },
          { id: 'accounts', label: 'الحسابات المتصلة', icon: Smartphone },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Create Post Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold mb-4">إنشاء منشور جديد</h3>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="ماذا تريد أن تنشر اليوم؟"
                    className="w-full h-32 p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                  
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                      {platforms.filter(p => p.id !== 'whatsapp').map(platform => {
                        const isConnected = socialAccounts.some(a => a.platform === platform.id);
                        const isSelected = selectedPlatforms.includes(platform.id);
                        
                        return (
                          <button
                            key={platform.id}
                            disabled={!isConnected}
                            onClick={() => {
                              setSelectedPlatforms(prev => 
                                prev.includes(platform.id) 
                                  ? prev.filter(id => id !== platform.id)
                                  : [...prev, platform.id]
                              );
                            }}
                            className={`p-2 rounded-lg border transition-all ${
                              !isConnected 
                                ? 'opacity-30 grayscale cursor-not-allowed border-gray-200' 
                                : isSelected
                                  ? `border-${platform.color.split('-')[1]}-500 ${platform.bg} ${platform.color}`
                                  : 'border-gray-200 hover:border-gray-300'
                            }`}
                            title={isConnected ? `نشر على ${platform.name}` : `قم بربط ${platform.name} أولاً`}
                          >
                            <platform.icon size={20} />
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={handlePost}
                      disabled={isPosting || !postContent || selectedPlatforms.length === 0}
                      className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                    >
                      {isPosting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                      <span>{isPosting ? 'جاري النشر...' : 'نشر الآن'}</span>
                    </button>
                  </div>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {socialPosts.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <Share2 size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">لا توجد منشورات حتى الآن</p>
                    </div>
                  ) : (
                    socialPosts.map(post => (
                      <div key={post.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${platforms.find(p => p.id === post.platform)?.bg}`}>
                              {React.createElement(platforms.find(p => p.id === post.platform)?.icon || Share2, { 
                                size: 18, 
                                className: platforms.find(p => p.id === post.platform)?.color 
                              })}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{platforms.find(p => p.id === post.platform)?.name}</p>
                              <p className="text-[10px] text-gray-500">{new Date(post.publishedAt || '').toLocaleString('ar-EG')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] rounded-full font-medium">تم النشر</span>
                            <button className="p-1 text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm leading-relaxed">{post.content}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex items-center gap-6">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <ThumbsUp size={14} />
                            <span className="text-xs">{post.stats?.likes}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <MessageCircle size={14} />
                            <span className="text-xs">{post.stats?.comments}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Share2 size={14} />
                            <span className="text-xs">{post.stats?.shares}</span>
                          </div>
                          {post.platform === 'tiktok' && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Eye size={14} />
                              <span className="text-xs">{post.stats?.views}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold">الرسائل الواردة</h3>
                  <div className="flex gap-2">
                    {platforms.map(p => (
                      <button key={p.id} className={`p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 ${p.color}`}>
                        <p.icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {socialMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <MessageSquare size={48} className="mb-4 opacity-20" />
                      <p>لا توجد رسائل حالياً</p>
                    </div>
                  ) : (
                    socialMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.isIncoming ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.isIncoming 
                            ? 'bg-gray-100 dark:bg-slate-900 rounded-tr-none' 
                            : 'bg-emerald-600 text-white rounded-tl-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {msg.isIncoming && <span className="font-bold text-[10px]">{msg.senderName}</span>}
                            {React.createElement(platforms.find(p => p.id === msg.platform)?.icon || MessageSquare, { 
                              size: 10, 
                              className: msg.isIncoming ? platforms.find(p => p.id === msg.platform)?.color : 'text-white/70'
                            })}
                          </div>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[8px] mt-1 ${msg.isIncoming ? 'text-gray-400' : 'text-white/50'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اكتب ردك هنا..."
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'accounts' && (
              <motion.div
                key="accounts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {platforms.map(platform => {
                  const account = socialAccounts.find(a => a.platform === platform.id);
                  
                  return (
                    <div key={platform.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 rounded-xl ${platform.bg}`}>
                          <platform.icon size={24} className={platform.color} />
                        </div>
                        {account ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 size={14} />
                            متصل
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                            <AlertCircle size={14} />
                            غير متصل
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold mb-1">{platform.name}</h3>
                      <p className="text-xs text-gray-500 mb-6">
                        {account ? `متصل كـ ${account.name}` : `اربط حساب ${platform.name} الخاص بك للنشر والرد على الرسائل`}
                      </p>
                      
                      {account ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSocialAccounts(prev => prev.filter(a => a.id !== account.id))}
                            className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            قطع الاتصال
                          </button>
                          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <RefreshCw size={18} className="text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting === platform.id}
                          className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {isConnecting === platform.id ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                          <span>{isConnecting === platform.id ? 'جاري الاتصال...' : 'ربط الحساب الآن'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Stats & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-bold mb-4">إحصائيات سريعة</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ThumbsUp size={16} className="text-blue-500" />
                  <span className="text-xs">إجمالي التفاعلات</span>
                </div>
                <span className="font-bold">{stats.totalInteractions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-500" />
                  <span className="text-xs">رسائل لم يتم الرد عليها</span>
                </div>
                <span className={`font-bold ${stats.unreadMessages > 0 ? 'text-emerald-600' : ''}`}>
                  {stats.unreadMessages}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-purple-500" />
                  <span className="text-xs">منشورات هذا الشهر</span>
                </div>
                <span className="font-bold">{stats.postsThisMonth}</span>
              </div>
            </div>
          </div>

          <AITip 
            accounts={socialAccounts} 
            posts={socialPosts} 
            messages={socialMessages}
            companyName={settings.companyName}
          />
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;
