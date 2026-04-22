/**
 * Formula Parser Utility
 * Extracts variables from formula strings and provides evaluation
 */

export interface FormulaVariable {
  name: string;
  displayName: string;
}

/**
 * Extract variables from formula string
 * Example: "FG + (M + SP + Info) / 3" -> ["FG", "M", "SP", "Info"]
 */
export function extractVariablesFromFormula(formula: string): FormulaVariable[] {
  if (!formula) return [];

  // Match all uppercase words and numbers in the formula
  const matches = formula.match(/\b[A-Z]+\b/g);
  if (!matches) return [];

  // Remove duplicates while preserving order
  const unique = Array.from(new Set(matches));

  // Map to display names
  const displayNames: Record<string, string> = {
    FG: 'FG (General Average)',
    M: 'Math',
    AR: 'Arabic',
    ANG: 'English',
    SP: 'Sport/Physical',
    INFO: 'Informatics',
    PH: 'Philosophy',
    HG: 'History & Geography',
    TECH: 'Technical',
    ECON: 'Economics',
    GESTION: 'Management',
    FRENCH: 'French',
  };

  return unique.map((name) => ({
    name,
    displayName: displayNames[name] || name,
  }));
}

/**
 * Safely evaluate formula with given values
 * Prevents code injection by only allowing math operations
 */
export function evaluateFormula(
  formula: string,
  values: Record<string, number>,
): number | null {
  try {
    let expression = formula;

    // Replace all variables with their numeric values
    const variables = extractVariablesFromFormula(formula);
    for (const variable of variables) {
      const regex = new RegExp(`\\b${variable.name}\\b`, 'g');
      const value = values[variable.name] ?? 0;
      expression = expression.replace(regex, String(value));
    }

    // Only allow safe math operations
    const allowedPattern = /^[\d\s+\-*/().]+$/;
    if (!allowedPattern.test(expression)) {
      console.error('Formula contains invalid characters:', expression);
      return null;
    }

    // Evaluate using Function constructor (safer than eval)
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expression}`)();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return null;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return null;
  }
}

/**
 * Calculate acceptance probability
 * Based on difference between student score and last year cutoff
 */
export function calculateAcceptanceProbability(
  studentScore: number,
  lastYearScore: number | null | undefined,
): { probability: number; color: string } {
  if (!lastYearScore || lastYearScore === 0) {
    return { probability: 50, color: 'gray' };
  }

  const diff = studentScore - lastYearScore;

  if (diff >= 20) return { probability: 95, color: 'green' };
  if (diff >= 10) return { probability: 80, color: 'green' };
  if (diff >= 0) return { probability: 60, color: 'yellow' };
  if (diff >= -10) return { probability: 35, color: 'orange' };
  if (diff >= -20) return { probability: 15, color: 'red' };
  return { probability: 5, color: 'red' };
}
