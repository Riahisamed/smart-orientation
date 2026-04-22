'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Label } from '@/lib/components/ui/label';
import {
  extractVariablesFromFormula,
  evaluateFormula,
  calculateAcceptanceProbability,
  FormulaVariable,
} from '@/lib/utils/formulaParser';

interface GuideFiliere {
  code: string;
  program: string;
  institution: string;
  formula: string;
  bacTypes: Array<{
    type: string;
    capacity: number;
    lastScore: number | null;
  }>;
}

export default function TScoreContent() {
  const searchParams = useSearchParams();
  const filiereId = searchParams.get('filiereId');

  // State
  const [filiere, setFiliere] = useState<GuideFiliere | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formula, setFormula] = useState<string>('');
  const [variables, setVariables] = useState<FormulaVariable[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const [probability, setProbability] = useState<{
    percentage: number;
    color: string;
  }>({ percentage: 50, color: 'gray' });
  const [lastYearScore, setLastYearScore] = useState<number | null>(null);

  // Load filiere data from guide.json
  useEffect(() => {
    const loadFiliere = async () => {
      try {
        if (!filiereId) {
          setError('No filiere selected. Please go back and select a program.');
          setLoading(false);
          return;
        }

        // Load guide.json from backend or static
        const response = await fetch('http://localhost:3001/filieres');
        if (!response.ok) throw new Error('Failed to load filieres');

        const filieres: GuideFiliere[] = await response.json();
        const found = filieres.find((f) => f.code === filiereId);

        if (!found) {
          throw new Error(`Filiere ${filiereId} not found`);
        }

        setFiliere(found);
        setFormula(found.formula);

        // Extract variables from formula
        const vars = extractVariablesFromFormula(found.formula);
        setVariables(vars);

        // Initialize input values with empty strings
        const initialValues: Record<string, string> = {};
        vars.forEach((v) => {
          initialValues[v.name] = '';
        });
        setInputValues(initialValues);

        // Get last year score (average of all bac types)
        if (found.bacTypes && found.bacTypes.length > 0) {
          const scores = found.bacTypes
            .map((b) => b.lastScore)
            .filter((s) => s !== null && s !== undefined) as number[];
          if (scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            setLastYearScore(avgScore);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    loadFiliere();
  }, [filiereId]);

  // Handle input change
  const handleInputChange = useCallback(
    (variableName: string, value: string) => {
      setInputValues((prev) => ({
        ...prev,
        [variableName]: value,
      }));
    },
    [],
  );

  // Calculate result
  const handleCalculate = useCallback(() => {
    // Convert input strings to numbers
    const numericValues: Record<string, number> = {};
    let valid = true;

    for (const [key, value] of Object.entries(inputValues)) {
      const num = parseFloat(value);
      if (value === '' || isNaN(num) || num < 0) {
        valid = false;
        break;
      }
      numericValues[key] = num;
    }

    if (!valid) {
      setError('Please fill all fields with valid positive numbers');
      setResult(null);
      return;
    }

    // Evaluate formula
    const calculatedResult = evaluateFormula(formula, numericValues);

    if (calculatedResult === null) {
      setError('Error calculating result. Please check your inputs.');
      setResult(null);
      return;
    }

    setResult(calculatedResult);
    setError(null);

    // Calculate probability
    if (lastYearScore) {
      const { probability: prob, color } = calculateAcceptanceProbability(
        calculatedResult,
        lastYearScore,
      );
      setProbability({ percentage: prob, color });
    }

    // Save to localStorage
    localStorage.setItem(
      `tcalc_${filiereId}`,
      JSON.stringify({
        result: calculatedResult,
        inputs: numericValues,
        timestamp: new Date().toISOString(),
      }),
    );
  }, [formula, inputValues, lastYearScore, filiereId]);

  // Check if all inputs are filled
  const isFormValid = variables.every((v) => inputValues[v.name] && inputValues[v.name] !== '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading filiere data...</div>
      </div>
    );
  }

  if (error && !filiere) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-2 border-red-300 dark:border-red-800">
          <CardContent className="p-6">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📊 T Score Calculator</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Calculate your admission score</p>
        </div>

        {/* Program Info Card */}
        <Card className="border-l-4 border-indigo-500">
          <CardHeader>
            <CardTitle className="text-lg">{filiere?.program}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">{filiere?.institution}</p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Formula:</span>{' '}
                <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                  {formula}
                </code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Input Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Enter Your Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables.map((variable) => (
                <div key={variable.name}>
                  <Label htmlFor={variable.name} className="text-sm font-medium">
                    {variable.displayName}
                  </Label>
                  <Input
                    id={variable.name}
                    type="number"
                    min="0"
                    max="200"
                    step="0.5"
                    placeholder="Enter score"
                    value={inputValues[variable.name]}
                    onChange={(e) => handleInputChange(variable.name, e.target.value)}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleCalculate}
              disabled={!isFormValid}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              🧮 Calculate T Score
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result !== null && (
          <div className="space-y-4">
            {/* T Score Result */}
            <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Your T Score</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {result.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Comparison with Last Year */}
            {lastYearScore && (
              <Card className="border-l-4 border-yellow-500">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Last Year Cutoff</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                        {lastYearScore.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Your Difference</p>
                      <p
                        className={`text-2xl font-bold mt-1 ${
                          result - lastYearScore >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {(result - lastYearScore).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admission Probability */}
            <Card className={`border-l-4 border-${probability.color}-500`}>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Admission Probability
                  </p>
                  <p className={`text-3xl font-bold text-${probability.color}-600 dark:text-${probability.color}-400`}>
                    {probability.percentage}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Based on last year's cutoff score
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Box */}
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-sm text-slate-700 dark:text-slate-300">
            <p>
              💡 <span className="font-semibold">Tip:</span> The admission probability is calculated based
              on the last year's cutoff score for this program. Your actual chances may vary based on
              competition and policy changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
