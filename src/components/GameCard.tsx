import React from 'react';

// Game arayüzü burada da güncellendi
interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  image_url: string | null;
  screenshots: string[] | null;
  download_count: number;
  rating: number;
  created_by: string;
  created_at: string;
  profiles: { username: string } | null;
}

interface GameCardProps {
  game: Game;
  onViewDetails: (gameId: string) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onViewDetails }) => {
  return (
    <div
      className="relative group bg-slate-900 border-t border-l border-slate-700 flex items-center justify-center p-4 sm:p-8 cursor-pointer aspect-square hover:bg-slate-800 transition-colors duration-300"
      onClick={() => onViewDetails(game.id)}
    >
      <img
        src={game.image_url || 'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=800'}
        alt={game.title}
        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
      />

      {/* YENİ: Üzerine gelince çıkan bilgi kutusu */}
      <div className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="relative">
          {/* Oyun Adı */}
          <div className="bg-white text-black text-lg font-black uppercase px-3 py-1 border border-black shadow-lg">
            {game.title}
          </div>
          {/* Stüdyo Adı */}
          <div className="bg-white text-black text-sm font-semibold px-3 py-1 border border-black shadow-lg absolute top-[90%] left-2">
            {game.profiles?.username || 'Unknown Studio'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;