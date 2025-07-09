import React from 'react';

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
    </div>
  );
};

export default GameCard;