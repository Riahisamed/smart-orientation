export type OrientationQuestion = {
  id: string;
  label: string;
  category: string;
  domains: string[];
  skills: string[];
};

export const ORIENTATION_QUESTIONS: OrientationQuestion[] = [
  {
    id: 'logic_problem_solving',
    label:
      'J aime resoudre des problemes logiques, mathematiques ou techniques.',
    category: 'analysis',
    domains: ['informatique', 'data', 'engineering'],
    skills: ['Logique', 'Analyse', 'Resolution de problemes'],
  },
  {
    id: 'software_creation',
    label: 'J aime creer des applications, sites web ou solutions numeriques.',
    category: 'creation',
    domains: ['informatique', 'software', 'web'],
    skills: ['Programmation', 'Creativite technique'],
  },
  {
    id: 'health_care',
    label:
      'J aime aider les personnes et comprendre le fonctionnement du corps humain.',
    category: 'social',
    domains: ['medical', 'paramedical', 'biologie'],
    skills: ['Empathie', 'Precision', 'Ecoute'],
  },
  {
    id: 'laboratory_science',
    label: 'J aime les experiences, les analyses et le travail de laboratoire.',
    category: 'science',
    domains: ['biologie', 'science', 'laboratoire'],
    skills: ['Methode scientifique', 'Observation'],
  },
  {
    id: 'business_management',
    label: 'J aime organiser, gerer une equipe, vendre ou lancer un projet.',
    category: 'business',
    domains: ['business', 'management', 'entrepreneuriat'],
    skills: ['Leadership', 'Gestion', 'Communication'],
  },
  {
    id: 'finance_numbers',
    label:
      'J aime analyser les chiffres, budgets, risques et decisions financieres.',
    category: 'business',
    domains: ['finance', 'comptabilite', 'economie'],
    skills: ['Analyse financiere', 'Rigueur'],
  },
  {
    id: 'communication_language',
    label:
      'J aime les langues, la redaction, les presentations et la communication.',
    category: 'communication',
    domains: ['communication', 'traduction', 'journalisme'],
    skills: ['Langues', 'Redaction', 'Expression orale'],
  },
  {
    id: 'law_society',
    label:
      'J aime comprendre les regles, defendre des idees et analyser les problemes sociaux.',
    category: 'humanities',
    domains: ['droit', 'sciences sociales', 'administration'],
    skills: ['Argumentation', 'Analyse critique'],
  },
  {
    id: 'sport_coaching',
    label: 'J aime le sport, la performance, le coaching et la sante physique.',
    category: 'sport',
    domains: ['sport', 'coaching', 'nutrition sportive'],
    skills: ['Discipline', 'Coaching', 'Motivation'],
  },
  {
    id: 'design_product',
    label:
      'J aime imaginer des produits, ameliorer des experiences et creer visuellement.',
    category: 'creative',
    domains: ['design', 'ux', 'marketing'],
    skills: ['Creativite', 'Sens utilisateur'],
  },
];
