'use client';

import { useState } from 'react';
import { Card, CardContent } from '../../lib/components/ui/card';
import { Input } from '../../lib/components/ui/input';
import { Select } from '../../lib/components/ui/select';
import { fetchAISuggestions } from '../../lib/api/ai-client';
import type { AIResponse, BacType } from '../../lib/types/ai';
import { useTranslations } from '@/lib/i18n/context';

export default function AISuggestionsPage() {
  const t = useTranslations()
  const [score, setScore] = useState('');
  const [bac, setBac] = useState<BacType>('MATH');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    if (!score || isNaN(Number(score))) {
      setError(t("errors.required"));
      return;
    }

    if (!bac) {
      setError(t("errors.required"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchAISuggestions({
        score: Number(score),
        bac,
        language,
      });

      setResult(data);

      if (!data.success) {
        setError(data.error || t("errors.generic"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t("aiSuggestions.title")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t("chat.aiAssistantDesc")}
          </p>
        </div>

        {/* Input Card */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90 mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t("chat.yourScore")}
                </label>
                <Input
                  type="number"
                  placeholder={t("chat.yourScore")}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t("chat.bacTypeLabel")}
                </label>
                <Select
                  value={bac}
                  onChange={(e) => setBac(e.target.value as BacType)}
                  className="rounded-xl"
                >
                  <option value="MATH">Math</option>
                  <option value="SVT">SVT</option>
                  <option value="ECO">Economics</option>
                  <option value="TECH">Technical</option>
                  <option value="INFO">Informatics</option>
                  <option value="LETTRES">Literature</option>
                  <option value="SPORT">Sport</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("chat.languageLabel")}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="language"
                    value="fr"
                    checked={language === 'fr'}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'ar')}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">French</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="language"
                    value="ar"
                    checked={language === 'ar'}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'ar')}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Arabic</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGetSuggestions}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
            >
              {isLoading ? t("common.loading") : t("common.submit")}
            </button>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 mb-6">
            <CardContent className="p-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && result.success && (
          <div className="space-y-6">
            {/* AI Response */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  {t("aiSuggestions.title")}
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {result.response}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Accessible Programs */}
            {result.accessible && result.accessible.length > 0 && (
              <Card className="rounded-2xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3">
                    ✓ {t("orientation.availablePrograms")} ({result.accessible.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.accessible.map((program) => (
                      <div
                        key={program.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <p className="font-medium text-slate-900 dark:text-slate-100">{program.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {t("orientation.lastYearScore")}: {program.lastYearScore}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Difficult Programs */}
            {result.difficult && result.difficult.length > 0 && (
              <Card className="rounded-2xl border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-3">
                    ⚠ {t("orientationTest.noResultsYet")} ({result.difficult.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.difficult.map((program) => (
                      <div
                        key={program.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-orange-200 dark:border-orange-800"
                      >
                        <p className="font-medium text-slate-900 dark:text-slate-100">{program.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {t("orientation.lastYearScore")}: {program.lastYearScore}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}