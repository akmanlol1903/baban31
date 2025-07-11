import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Star, ChevronLeft, ChevronRight, Loader2, Send, ArrowUpRight, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/supabase';

// Tipler
type Game = Database['public']['Tables']['games']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles: { username: string; avatar_url: string | null; };
};
interface SteamDetails {
  about_the_game: string;
  screenshots: { id: number; url:string }[];
  pc_requirements: { minimum: string; recommended?: string };
  short_description: string;
  release_date: { coming_soon: boolean; date: string };
}

// GÜNCELLENDİ: Hem açılıp-kapanma hem de hover animasyonunu doğru şekilde içeren AccordionSection
const AccordionSection = React.memo(({ id, title, children, isOpen, onToggle }: {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className="relative group overflow-hidden border-b border-gray-700 last:border-b-0">
    <div className="absolute bottom-0 left-0 w-full h-0 bg-black group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
    <button
      onClick={onToggle}
      className="relative z-10 w-full flex justify-between items-center p-4 cursor-pointer"
    >
      <span className="font-bold text-sm text-white transition-colors">
        {title.toUpperCase()}
      </span>
      <ChevronDown
        className={`h-5 w-5 text-gray-400 group-hover:text-white transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
    <div
      className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden relative z-10">
        <div className="px-4 pb-4 cursor-pointer" onClick={onToggle}>
          {children}
        </div>
      </div>
    </div>
  </div>
));


const GameDetails: React.FC<{ gameId: string; onBack: () => void; }> = ({ gameId, onBack }) => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [steamDetails, setSteamDetails] = useState<SteamDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const screenshotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    setLoading(true);
    try {
      const { data: gameData, error: gameError } = await supabase.from('games').select('*').eq('id', gameId).single();
      if (gameError) throw new Error("Oyun bulunamadı.");
      setGame(gameData);

      if (!gameData.developer && !gameData.publisher) {
        const { data: profileData } = await supabase.from('profiles').select('username').eq('id', gameData.created_by).single();
        setCreatorName(profileData?.username || 'Anonymous');
      }

      await fetchComments();

      if (gameData.steam_appid) {
        const { data: steamData, error: steamError } = await supabase.functions.invoke('steam-get-details', {
          body: { appId: gameData.steam_appid },
        });
        if (steamError || !steamData.success) console.warn("Steam detayları alınamadı:", steamError || steamData.message);
        else setSteamDetails(steamData);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase.from('comments').select('*, profiles(username, avatar_url)').eq('game_id', gameId).order('created_at', { ascending: false });
    if (error) console.error("Error fetching comments:", error);
    else setComments(data || []);
  };

  const handleToggleSection = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('comments').insert([{ game_id: gameId, user_id: user.id, content: newComment.trim(), rating: newRating }]);
      setNewComment('');
      setNewRating(5);
      await fetchComments();
    } catch (e: any) {
      console.error("Error submitting comment:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!game) return;
    try {
        await supabase.from('games').update({ download_count: game.download_count + 1 }).eq('id', game.id);
        let downloadLink = game.file_url;
        if (downloadLink.includes('drive.google.com')) {
            const fileIdMatch = downloadLink.match(/drive\.google\.com\/file\/d\/([^/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                downloadLink = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
            }
        }
        window.open(downloadLink, '_blank');
        setGame(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);
    } catch (error: any) {
        console.error('Download failed:', error.message);
    }
  };

  const screenshots = game?.screenshots || [];

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>;
  if (error) return <div className="text-center text-red-400 p-8">{error}</div>;
  if (!game) return null;

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="lg:grid lg:grid-cols-[1fr_480px]">
        
        {/* Sol Sütun (Ekran Görüntüleri) */}
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col p-8 lg:p-16">
          <div className="w-16 mb-4">
            <button onClick={onBack} className="flex items-center justify-center h-12 w-12 border border-slate-700 hover:border-slate-500 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
          <div id="screenshots-section" className="flex-grow flex flex-col space-y-4 overflow-hidden">
            <h2 className="text-2xl font-bold flex-shrink-0">SCREENSHOTS</h2>
            <div className="relative flex-grow overflow-hidden">
              <div ref={screenshotsRef} className="absolute inset-0 flex flex-col space-y-4 overflow-y-auto snap-y snap-mandatory scrollbar-hide">
                  {screenshots.map((src, index) => (
                      <img key={index} src={src} alt={`${game.title} screenshot ${index + 1}`} className="snap-start w-full h-auto object-cover flex-shrink-0" />
                  ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sağ Sütun (Bilgiler) */}
        <div className="lg:h-screen lg:overflow-y-auto border-l border-black lg:pt-[100px] lg:px-6 lg:pb-6 p-6">
          <div>
            
            <img src={game.image_url || 'https://via.placeholder.com/1280x720'} alt={game.title} className="w-full h-auto object-cover" />
            
            <div className="border-b border-slate-700 mt-2 pb-2">
                <h1 className="text-[32px] font-black uppercase tracking-wider mb-2">{game.title}</h1>
                <div className="text-slate-400 text-sm">
                    {(steamDetails?.release_date?.date || game.created_at) && (
                        <p className="mb-2">
                            Çıkış Tarihi: {steamDetails?.release_date?.date 
                                ? steamDetails.release_date.date 
                                : new Date(game.created_at).toLocaleDateString()}
                        </p>
                    )}
                    <div>
                        {game.developer && game.developer.length > 0 && (
                            <p>Geliştirici: {game.developer.join(', ')}</p>
                        )}
                        {game.publisher && game.publisher.length > 0 && (
                            <p>Yayıncı: {game.publisher.join(', ')}</p>
                        )}
                        {(!game.developer || game.developer.length === 0) && (!game.publisher || game.publisher.length === 0) && (
                            <p>Yükleyen: {creatorName}</p>
                        )}
                    </div>
                </div>
            </div>
            
            <p className="text-slate-300 leading-relaxed text-sm mt-6">{steamDetails?.short_description || game.description}</p>
            
            <div className="border-t border-slate-700 mt-6">
                <div className="relative group cursor-pointer overflow-hidden border-b border-gray-700">
                    <div className="absolute bottom-0 left-0 w-full h-0 bg-black group-hover:h-full transition-all duration-300 ease-in-out z-0"></div>
                    <button onClick={handleDownload} className="relative z-10 w-full flex justify-between items-center p-4">
                        <span className="font-bold text-sm text-white transition-colors">DOWNLOAD</span>
                        <Download className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {steamDetails && (
                    <AccordionSection 
                      id="about" 
                      title="ABOUT"
                      isOpen={openSection === 'about'}
                      onToggle={() => handleToggleSection('about')}
                    >
                        <div className="prose prose-invert text-gray-300 max-w-none text-sm" dangerouslySetInnerHTML={{ __html: steamDetails.about_the_game }} />
                    </AccordionSection>
                )}

                {steamDetails?.pc_requirements?.minimum && (
                     <AccordionSection 
                        id="requirements" 
                        title="SYSTEM REQUIREMENTS"
                        isOpen={openSection === 'requirements'}
                        onToggle={() => handleToggleSection('requirements')}
                     >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-purple-400 mb-2 text-sm">MINIMUM:</h3>
                                <div className="text-gray-300 prose prose-invert max-w-none prose-sm text-sm" dangerouslySetInnerHTML={{ __html: steamDetails.pc_requirements.minimum }} />
                            </div>
                            {steamDetails.pc_requirements.recommended && (
                                <div>
                                <h3 className="font-semibold text-purple-400 mb-2 text-sm">RECOMMENDED:</h3>
                                <div className="text-gray-300 prose prose-invert max-w-none prose-sm text-sm" dangerouslySetInnerHTML={{ __html: steamDetails.pc_requirements.recommended }} />
                                </div>
                            )}
                        </div>
                    </AccordionSection>
                )}
                
                <AccordionSection 
                  id="comments" 
                  title="COMMENTS & REVIEWS"
                  isOpen={openSection === 'comments'}
                  onToggle={() => handleToggleSection('comments')}
                >
                    {user && (
                        <div className="bg-slate-800/50 p-4 mb-6">
                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write your review..." className="w-full bg-slate-800 text-white p-3 border border-slate-600 focus:border-purple-500 text-sm" rows={3}/>
                        <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center space-x-1">{[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setNewRating(star)} className={`h-6 w-6 ${star <= newRating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}><Star /></button>))}</div>
                            <button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-5 py-2 flex items-center space-x-2 text-sm"><Send className="h-4 w-4" /><span>Submit</span></button>
                        </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        {comments.length === 0 ? (<p className="text-center text-gray-400 py-8 text-sm">No comments yet.</p>) : (
                        comments.map(c => (
                            <div key={c.id} className="bg-slate-800 p-4 flex gap-4">
                            <img src={c.profiles?.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${c.profiles?.username}`} alt="avatar" className="w-10 h-10 rounded-full bg-slate-800"/>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                <span className="font-semibold text-white text-sm">{c.profiles?.username || 'User'}</span>
                                <div className="flex items-center gap-1">{[...Array(c.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-current"/>)}{[...Array(5 - c.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-gray-500"/>)}</div>
                                </div>
                                <p className="text-gray-300 mt-1 text-sm">{c.content}</p>
                            </div>
                            </div>
                        ))
                        )}
                    </div>
                </AccordionSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;