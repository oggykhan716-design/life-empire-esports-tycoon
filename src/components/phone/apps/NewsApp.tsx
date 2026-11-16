import React, { useState } from 'react';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { GameState } from '../../../types/game';
import { NewsArticle, NewsCategory } from '../../../types/social';

interface NewsAppProps {
  state: GameState;
}

const OUTLETS = ['All', 'EsportsAmaze', 'CheemsBond', 'LetsNeverGrowEsports'] as const;
const CATEGORIES: ('All' | NewsCategory)[] = [
  'All',
  'Breaking News',
  'Tournament Results',
  'Transfer News',
  'Organisation News',
  'Controversies',
  'Financial Reports',
  'Community Discussions',
];

export const NewsApp: React.FC<NewsAppProps> = ({ state }) => {
  const [selectedOutlet, setSelectedOutlet] = useState<(typeof OUTLETS)[number]>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | NewsCategory>('All');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  const articles = state.phoneState?.news ?? [];
  const filtered = articles.filter((a) => {
    if (selectedOutlet !== 'All' && a.publisherName !== selectedOutlet) return false;
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    return true;
  });

  if (activeArticle) {
    return (
      <div className="flex flex-col h-full bg-[#0B0F17] overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center gap-2 sticky top-0 bg-[#0B0F17]/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveArticle(null)}
            className="min-h-[38px] px-2.5 py-1 rounded-lg hover:bg-slate-800 text-xs font-medium text-slate-300 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={15} />
            Back to Headlines
          </button>
        </div>

        <article className="p-5 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-emerald-400">{activeArticle.publisherName}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">{activeArticle.category}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono text-slate-400">
              Week {activeArticle.gameWeek}
            </span>
          </div>

          <h2 className="font-display text-xl font-extrabold text-white leading-snug">
            {activeArticle.headline}
          </h2>

          <p className="text-sm text-blue-300 font-medium leading-relaxed border-l-2 border-blue-500 pl-3">
            {activeArticle.summary}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {activeArticle.body}
          </p>
        </article>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0F17]">
      {/* Outlet Selector */}
      <div className="px-4 py-3 border-b border-slate-800/80 space-y-2.5 bg-[#0E1420]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {OUTLETS.map((outlet) => (
            <button
              key={outlet}
              type="button"
              onClick={() => setSelectedOutlet(outlet)}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedOutlet === outlet
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#141D2E] text-slate-300 hover:bg-slate-800'
              }`}
            >
              {outlet}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Newspaper size={24} className="opacity-40" />
            <span>No articles match your current outlet or category filter.</span>
          </div>
        ) : (
          filtered.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => setActiveArticle(article)}
              className="w-full text-left p-4 hover:bg-slate-800/40 transition-colors space-y-1.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-semibold text-emerald-400">{article.publisherName}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{article.category}</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-slate-500">Wk {article.gameWeek}</span>
              </div>
              <h3 className="font-display font-bold text-sm text-white leading-snug">
                {article.headline}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
