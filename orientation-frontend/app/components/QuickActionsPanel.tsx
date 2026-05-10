'use client';

import { useEffect, useMemo, useState } from 'react';
import { DomainSuggestion, RoadmapSelectorData } from '@/lib/types/ai';
import { API_BASE_URL } from '@/lib/api/config';

type QuickActionKey = 'roadmaps' | 'careers' | 'best-fields' | 'compare';

interface Props {
  language: 'fr' | 'ar';
  bacType?: string;
  score?: number;
  interest?: string;
  showRoadmaps: boolean;
  onToggleRoadmaps: (value: boolean) => void;
  onSendPrompt: (prompt: string) => Promise<void> | void;
  onSelectRoadmapDomain: (domain: DomainSuggestion) => Promise<void> | void;
}

const demandRank = (value = '') => {
  const v = value.toLowerCase();
  if (v.includes('very high') || v.includes('excellent')) return 3;
  if (v.includes('high') || v.includes('strong') || v.includes('growing')) return 2;
  return 1;
};

export default function QuickActionsPanel({
  language,
  bacType,
  score,
  interest,
  showRoadmaps,
  onToggleRoadmaps,
  onSendPrompt,
  onSelectRoadmapDomain,
}: Props) {
  const [loadingAction, setLoadingAction] = useState<QuickActionKey | null>(null);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [selectorData, setSelectorData] = useState<RoadmapSelectorData | null>(null);


  const prompts = {
    careers:
      language === 'ar'
        ? 'شنو نولي حسب معدلي واختصاصي؟'
        : 'Quelles carrières me correspondent ?',
    'best-fields':
      language === 'ar'
        ? 'شنو أفضل الاختصاصات المناسبة ليا؟'
        : 'Quelles sont les meilleures filières pour moi ?',
    compare:
      language === 'ar'
        ? 'قارنلي بين أحسن مجالين مناسبين ليا'
        : 'Compare les meilleurs domaines pour mon profil',
  } as const;

  useEffect(() => {
    if (!showRoadmaps) return;
    const fetchData = async () => {
      setLoadingRoadmaps(true);
      try {
        const res = await fetch(`${API_BASE_URL}/chatbot/roadmap-selector`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'roadmap', bacType, score, detectedInterest: interest }),
        });
        if (!res.ok) throw new Error('Failed to load roadmap selector');
        setSelectorData(await res.json());
      } finally {
        setLoadingRoadmaps(false);
      }
    };
    fetchData();
  }, [showRoadmaps, bacType, score, interest]);

  const filtered = useMemo(() => {
    // No textbox filtering in card UI (keeps selector clean).
    return selectorData?.suggestions ?? [];
  }, [selectorData]);

  const recommended = filtered.slice(0, 3);
  const popular = [...filtered].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 4);
  const opportunities = [...filtered]
    .sort((a, b) => demandRank(b.demand) - demandRank(a.demand) || b.relevanceScore - a.relevanceScore)
    .slice(0, 4);

  const trigger = async (k: QuickActionKey) => {
    if (k === 'roadmaps') {
      onToggleRoadmaps(!showRoadmaps);
      return;
    }
    setLoadingAction(k);
    try {
      await onSendPrompt(prompts[k]);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[
          ['roadmaps', '🗺️ Roadmaps'],
          ['careers', `💼 ${language === 'ar' ? 'المهن' : 'Careers'}`],
          ['best-fields', `🎓 ${language === 'ar' ? 'أفضل الاختصاصات' : 'Best Fields'}`],
          ['compare', `⚖️ ${language === 'ar' ? 'مقارنة المجالات' : 'Compare Domains'}`],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => trigger(k as QuickActionKey)}
            className="rounded-xl border border-slate-300 bg-slate-100/80 px-3 py-2 text-xs font-semibold text-slate-800 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-100"
          >
            {loadingAction === k ? '⏳ ...' : label}
          </button>
        ))}
      </div>

      {showRoadmaps && (
        <div className="space-y-3 rounded-2xl border border-slate-300/70 bg-white/70 p-3 animate-[fadeIn_0.3s_ease-out] dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">🃏 Roadmap domains</p>
            <button
              type="button"
              className="text-xs text-indigo-600 dark:text-indigo-300 transition-colors hover:underline"
              onClick={() => onToggleRoadmaps(false)}
            >
              {language === 'ar' ? 'رجوع' : 'Back'}
            </button>
          </div>

          {loadingRoadmaps ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[...new Map([...recommended, ...popular, ...opportunities].map((d) => [d.domain, d])).values()]
                .slice(0, 9)
                .map((domain) => {
                  const bg = domain.color || '#6366f1';
                  return (
                    <button
                      key={domain.domain}
                      type="button"
                      onClick={() => onSelectRoadmapDomain(domain)}
                      className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none"
                      style={{
                        background: `linear-gradient(135deg, ${bg}25 0%, rgba(255,255,255,0) 70%)`,
                        borderColor: `${bg}55`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className="absolute -top-10 -right-10 h-24 w-24 rounded-full blur-2xl"
                          style={{ backgroundColor: `${bg}55` }}
                        />
                      </div>

                      <div className="relative z-10 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xl" aria-hidden="true">{domain.icon}</span>
                          <span
                            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                            style={{ backgroundColor: `${bg}20`, color: bg }}
                          >
                            {Math.round(domain.relevanceScore * 100)}%
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {domain.domain}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className="rounded-full px-2 py-0.5 text-[10px] bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200">
                              {domain.difficulty}
                            </span>
                            <span className="rounded-full px-2 py-0.5 text-[10px] bg-indigo-100/70 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                              {domain.demand}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/60 dark:bg-black/20">➜</span>
                          <span className="line-clamp-1">{language === 'ar' ? 'اختارني' : 'Pick me'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'ar' ? 'اختر مجال واحد لعرض roadmap.' : 'Pick a domain to see a roadmap.'}
          </div>
        </div>
      )}
    </div>
  );
}


