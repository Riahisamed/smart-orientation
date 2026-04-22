export type BacTypeKey = "MATH" | "SVT" | "ECO" | "TECH" | "INFO" | "LETTRES" | "SPORT"

export type ChanceLevel = "ACCEPTED" | "MEDIUM" | "RISKY" | "NOT AVAILABLE"

export type FiliereLike = {
  id: number
  code?: string
  program: string
  institution: string
  formula?: string | null
  bacTypes?: Array<{
    type?: string | null
    capacity?: number | null
    lastScore?: number | string | null
  }> | null
  scores?: Array<{
    bacType?: string | null
    lastScore?: number | string | null
  }> | null
}

const BAC_TYPE_ALIASES: Record<BacTypeKey, string[]> = {
  MATH: ["MATH", "MATHS", "MATHEMATIQUE", "MATHEMATIQUES", "SCIENCESMATHEMATIQUES", "رياضيات", "رياض"],
  SVT: ["SVT", "SCIENCE", "SCIENCES", "SCIENCESEXPERIMENTALES", "SCIENCEEXPERIMENTALE", "SCEXP", "علومتجريبية", "علومتجريبية"],
  ECO: ["ECO", "ECONOMIE", "ECONOMIEGESTION", "ECOGESTION", "اقتصادوتصرف", "اقتصاد"],
  TECH: ["TECH", "TECHNIQUE", "العلومالتقنية", "علومتقنية", "تقنية"],
  INFO: ["INFO", "INFORMATIQUE", "علومالاعلامية", "اعلامية"],
  LETTRES: ["LETTRES", "LITTERAIRE", "LITTERATURE", "اداب", "الاداب", "آداب"],
  SPORT: ["SPORT", "رياضة"]
}

const BAC_TYPE_MAP: Record<string, string> = {
  MATH: "رياضيات",
  LETTRES: "آداب",
  SCIENCE: "علوم تجريبية",
  SVT: "علوم تجريبية",
  ECO: "اقتصاد وتصرف",
  TECH: "علوم تقنية",
  INFO: "علوم الإعلامية",
  SPORT: "رياضة"
}

function normalize(str: unknown) {
  return str
    ?.toString()
    ?.toLowerCase()
    ?.normalize("NFKD")
    ?.replace(/[^\p{L}\p{N}\s]/gu, "")
    ?.replace(/\s+/g, " ")
    ?.trim() ?? ""
}

const FORMULA_TOKEN_ALIASES: Record<string, string> = {
  FR: "F"
}

const TOKEN_LABELS: Record<string, string> = {
  FG: "FG",
  AR: "Arabic",
  ANG: "English",
  M: "Math",
  SP: "Physics",
  PH: "Philosophy",
  HG: "History / Geo",
  F: "French",
  ESP: "Spanish",
  IT: "Italian",
  ALL: "German",
  INFO: "Informatique"
}

const TOKEN_TO_STUDENT_FIELDS: Record<string, string[]> = {
  FG: ["FG"],
  AR: ["arabic"],
  ANG: ["english"],
  M: ["math"],
  SP: ["physics"],
  PH: ["philosophy"],
  HG: ["historyGeo"],
  F: ["french"],
  ESP: ["spanish"],
  IT: ["italian"],
  ALL: ["german"],
  INFO: ["info", "algo"]
}

export const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

const normalizeBacLabel = (value: unknown) => {
  return value
    ?.toString()
    ?.normalize("NFKC")
    ?.replace(/[أإآ]/g, "ا")
    ?.replace(/ى/g, "ي")
    ?.trim()
    ?.toUpperCase()
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "")
    ?.replace(/[\s._\-/]+/g, "")
}

export const normalizeBacType = (value: unknown) => {
  const raw = normalizeBacLabel(value)

  if (!raw) return ""

  for (const [canonical, values] of Object.entries(BAC_TYPE_ALIASES) as [BacTypeKey, string[]][]) {
    if (values.some(v => normalizeBacLabel(v) === raw)) return canonical
  }

  return raw
}

export const parseLastScore = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."))
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

export const getBacMatch = (filiere: FiliereLike | null | undefined, studentBacType: string) => {
  if (!filiere || !studentBacType) return null

  const normalizedStudentBacType = normalizeBacType(studentBacType)
  const mappedType = BAC_TYPE_MAP[normalizedStudentBacType]
    ?? BAC_TYPE_MAP[studentBacType?.toUpperCase?.() ?? ""]

  const needles = [mappedType, studentBacType, normalizedStudentBacType]
    .map(value => normalize(value))
    .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)

  const matchesStudentBacType = (candidateType: unknown) => {
    const candidateVariants = [candidateType, normalizeBacType(candidateType)]
      .map(value => normalize(value))
      .filter(Boolean)

    if (candidateVariants.length === 0 || needles.length === 0) return false

    return candidateVariants.some(candidate =>
      needles.some(needle => candidate.includes(needle) || needle.includes(candidate))
    )
  }

  const matches = Array.isArray(filiere.bacTypes)
    ? filiere.bacTypes.find(b => matchesStudentBacType(b?.type))
    : null

  if (matches) {
    return {
      source: "bacTypes" as const,
      type: matches.type ?? studentBacType,
      lastScore: parseLastScore(matches.lastScore)
    }
  }

  const scoreMatch = Array.isArray(filiere.scores)
    ? filiere.scores.find(s => matchesStudentBacType(s?.bacType))
    : null

  if (scoreMatch) {
    return {
      source: "scores" as const,
      type: scoreMatch.bacType ?? studentBacType,
      lastScore: parseLastScore(scoreMatch.lastScore)
    }
  }

  return null
}

export const getLastScoreForBacType = (filiere: FiliereLike | null | undefined, studentBacType: string): number | null => {
  const match = getBacMatch(filiere, studentBacType)
  return match?.lastScore ?? null
}

const canonicalFormulaToken = (token: string) => {
  const upper = token.toUpperCase()
  return FORMULA_TOKEN_ALIASES[upper] ?? upper
}

export const extractFormulaVariables = (formula: string): string[] => {
  if (!formula) return []

  const matches = formula.toUpperCase().match(/[A-Z]+/g) ?? []
  const seen = new Set<string>()
  const variables: string[] = []

  for (const token of matches) {
    const canonical = canonicalFormulaToken(token)
    if (seen.has(canonical)) continue
    seen.add(canonical)
    variables.push(canonical)
  }

  return variables
}

export const getVariableLabel = (token: string) => TOKEN_LABELS[token] ?? token

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

export const buildInitialFormulaInputs = (formula: string, student: Record<string, unknown> | null | undefined) => {
  const vars = extractFormulaVariables(formula)
  const next: Record<string, number> = {}

  const getStudentValue = (field: string) => {
    if (!student || typeof student !== "object") return undefined
    return (student as Record<string, unknown>)[field]
  }

  for (const variable of vars) {
    const candidateFields = TOKEN_TO_STUDENT_FIELDS[variable] ?? []
    const value = candidateFields
      .map(field => toNumber(getStudentValue(field)))
      .find(v => Number.isFinite(v))

    next[variable] = value ?? 0
  }

  return next
}

export const evaluateDynamicFormula = (formula: string, rawInputs: Record<string, number>) => {
  if (!formula) return null

  // 2AR -> 2*AR
  let expr = formula
    .toUpperCase()
    .replace(/(\d)\s*([A-Z])/g, "$1*$2")
    .replace(/([A-Z])\s*\(/g, "$1*(")
    .replace(/\)\s*([A-Z0-9])/g, ")*$1")

  expr = expr.replace(/[A-Z]+/g, (token) => {
    const canonical = canonicalFormulaToken(token)
    const value = rawInputs[canonical] ?? 0
    return Number.isFinite(value) ? value.toString() : "0"
  })

  if (!/^[\d+\-*/().\s]+$/.test(expr)) return null

  try {
    const result = Function(`"use strict"; return (${expr});`)()
    return typeof result === "number" && Number.isFinite(result) ? result : null
  } catch {
    return null
  }
}

export const getChanceLevel = (tScore: number | null, lastScore: number | null): ChanceLevel => {
  if (lastScore == null) return "NOT AVAILABLE"
  if (tScore == null) return "RISKY"
  if (tScore >= lastScore) return "ACCEPTED"
  if (tScore >= lastScore - 10) return "MEDIUM"
  return "RISKY"
}

export const formatScore = (score: number | null) => {
  return typeof score === "number" && Number.isFinite(score)
    ? score.toFixed(2)
    : "-"
}
