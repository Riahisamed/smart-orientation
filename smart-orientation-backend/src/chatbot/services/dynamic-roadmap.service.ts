import { Injectable, Logger } from '@nestjs/common';
import { DomainMatcherService, Domain } from './domain-matcher.service';
import * as fs from 'fs';
import * as path from 'path';

export interface BacToDomainMapping {
  [bacType: string]: {
    primaryDomains: string[];
    secondaryDomains: string[];
    scoreThresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

export interface PersonalizedDomainSuggestion {
  domain: string;
  field: string;
  relevanceScore: number;
  reason: string;
  icon: string;
  color: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  demand: string;
}

export interface RoadmapSelectorConfig {
  title: string;
  subtitle: string;
  suggestions: PersonalizedDomainSuggestion[];
  maxSuggestions: number;
  showScores: boolean;
  personalized: boolean;
}

export interface SpecificRoadmap {
  domain: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  phases: RoadmapPhase[];
  totalDuration: string;
  prerequisites: string[];
  certifications: string[];
  careerPaths: string[];
}

export interface RoadmapPhase {
  title: string;
  duration: string;
  skills: string[];
  projects: string[];
  resources: string[];
  milestones: string[];
}

interface FieldProgram {
  programs: string[];
  field: string;
  possible_jobs: string[];
  required_skills: {
    technical_skills: string[];
    soft_skills: string[];
    tools_and_technologies: string[];
  };
  demand_in_tunisia: string;
  future_outlook: string;
  unemployment_risk: string;
  recommended: boolean;
  reason: string;
}

interface FieldsData {
  fields: FieldProgram[];
}

@Injectable()
export class DynamicRoadmapService {
  private readonly logger = new Logger(DynamicRoadmapService.name);
  private readonly fieldsData: FieldsData;
  private readonly bacToDomainMapping: BacToDomainMapping;

  constructor(
    private readonly domainMatcher: DomainMatcherService
  ) {
    this.fieldsData = this.loadFieldsData();
    this.bacToDomainMapping = this.initializeBacMapping();
  }

  private loadFieldsData(): FieldsData {
    try {
      const filePath = path.join(process.cwd(), 'data', 'fields.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      this.logger.error('Failed to load fields.json', error);
      return { fields: [] };
    }
  }

  private initializeBacMapping(): BacToDomainMapping {
    return {
      'math': {
        primaryDomains: ['IT', 'Engineering', 'Science'],
        secondaryDomains: ['Business / Management'],
        scoreThresholds: { high: 15, medium: 12, low: 10 }
      },
      'sciences': {
        primaryDomains: ['Medical / Health', 'Science', 'Engineering'],
        secondaryDomains: ['IT'],
        scoreThresholds: { high: 14, medium: 11, low: 9 }
      },
      'technique': {
        primaryDomains: ['Engineering', 'IT', 'Arts & Design'],
        secondaryDomains: ['Business / Management'],
        scoreThresholds: { high: 13, medium: 10, low: 8 }
      },
      'economie': {
        primaryDomains: ['Business / Management', 'Law'],
        secondaryDomains: ['IT'],
        scoreThresholds: { high: 14, medium: 11, low: 9 }
      },
      'informatique': {
        primaryDomains: ['IT', 'Engineering'],
        secondaryDomains: ['Business / Management'],
        scoreThresholds: { high: 15, medium: 12, low: 10 }
      },
      'lettres': {
        primaryDomains: ['Languages', 'Law', 'Social Sciences'],
        secondaryDomains: ['Business / Management', 'Education'],
        scoreThresholds: { high: 13, medium: 10, low: 8 }
      },
      'sport': {
        primaryDomains: ['Sport', 'Medical / Health'],
        secondaryDomains: ['Education'],
        scoreThresholds: { high: 12, medium: 9, low: 7 }
      }
    };
  }

  public generatePersonalizedRoadmapSelector(
    message: string,
    bacType?: string,
    studentScore?: number,
    detectedInterest?: string
  ): RoadmapSelectorConfig {
    const language = this.detectLanguage(message);
    const suggestions = this.generateDomainSuggestions(bacType, studentScore, detectedInterest);
    
    return {
      title: language === 'ar' ? 'اختر مجالك المخصص' : 'Choisissez votre domaine personnalisé',
      subtitle: language === 'ar' 
        ? 'بناءً على Bac type و score و اهتماماتك' 
        : 'Basé sur votre Bac type, score et intérêts',
      suggestions: suggestions.slice(0, 6), // Top 6 suggestions
      maxSuggestions: 6,
      showScores: true,
      personalized: true
    };
  }

  private generateDomainSuggestions(
    bacType?: string,
    score?: number,
    detectedInterest?: string
  ): PersonalizedDomainSuggestion[] {
    const allDomains = this.domainMatcher.getAllDomains();
    const suggestions: PersonalizedDomainSuggestion[] = [];

    for (const domain of allDomains) {
      const relevanceScore = this.calculateDomainRelevance(
        domain,
        bacType,
        score,
        detectedInterest
      );

      if (relevanceScore > 0.3) { // Only include relevant domains
        suggestions.push(this.createDomainSuggestion(domain, relevanceScore));
      }
    }

    // Sort by relevance score
    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateDomainRelevance(
    domain: Domain,
    bacType?: string,
    studentScore?: number,
    detectedInterest?: string
  ): number {
    let relevanceScore = 0;

    // Bac type compatibility (40% weight)
    if (bacType && this.bacToDomainMapping[bacType.toLowerCase()]) {
      const mapping = this.bacToDomainMapping[bacType.toLowerCase()];
      if (mapping.primaryDomains.includes(domain.field)) {
        relevanceScore += 0.4;
      } else if (mapping.secondaryDomains.includes(domain.field)) {
        relevanceScore += 0.2;
      }
    }

    // Score compatibility (20% weight)
    if (studentScore !== undefined && bacType && this.bacToDomainMapping[bacType.toLowerCase()]) {
      const thresholds = this.bacToDomainMapping[bacType.toLowerCase()].scoreThresholds;
      if (studentScore >= thresholds.high) {
        relevanceScore += 0.2;
      } else if (studentScore >= thresholds.medium) {
        relevanceScore += 0.15;
      } else if (studentScore >= thresholds.low) {
        relevanceScore += 0.1;
      }
    }

    // Interest matching (30% weight)
    if (detectedInterest) {
      const interestMatch = this.domainMatcher.matchDomain(detectedInterest);
      if (interestMatch && interestMatch.domain.field === domain.field) {
        relevanceScore += 0.3;
      }
    }

    // Field compatibility (10% weight)
    const fieldCompatibility = this.checkFieldCompatibility(domain.field);
    relevanceScore += fieldCompatibility * 0.1;

    return Math.min(relevanceScore, 1.0);
  }

  private checkFieldCompatibility(domainField: string): number {
    const fieldData = this.fieldsData.fields.find(f => f.field === domainField);
    if (!fieldData) return 0;

    // Check if field has programs and is recommended
    if (fieldData.recommended && fieldData.programs.length > 0) {
      return 1.0;
    } else if (fieldData.programs.length > 0) {
      return 0.7;
    }
    return 0.3;
  }

  private createDomainSuggestion(
    domain: Domain,
    relevanceScore: number
  ): PersonalizedDomainSuggestion {
    const fieldData = this.fieldsData.fields.find(f => f.field === domain.field);
    
    return {
      domain: domain.field,
      field: domain.field,
      relevanceScore,
      reason: this.generateSuggestionReason(domain, relevanceScore),
      icon: this.getDomainIcon(domain.field),
      color: this.getDomainColor(domain.field),
      description: this.getDomainDescription(domain.field),
      difficulty: this.getDomainDifficulty(domain),
      demand: domain.demand_in_tunisia
    };
  }

  private generateSuggestionReason(domain: Domain, score: number): string {
    if (score > 0.8) {
      return `Excellent match! High demand and great future prospects`;
    } else if (score > 0.6) {
      return `Good compatibility with your profile`;
    } else if (score > 0.4) {
      return `Potential option, consider your interests`;
    }
    return `Alternative path if interested`;
  }

  private getDomainIcon(domainField: string): string {
    const icons: { [key: string]: string } = {
      'IT': '💻',
      'Engineering': '⚙️',
      'Medical / Health': '🏥',
      'Business / Management': '💼',
      'Science': '🔬',
      'Languages': '📚',
      'Law': '⚖️',
      'Arts & Design': '🎨',
      'Social Sciences': '🌍',
      'Sport': '⚽'
    };
    return icons[domainField] || '📖';
  }

  private getDomainColor(domainField: string): string {
    const colors: { [key: string]: string } = {
      'IT': '#3B82F6',
      'Engineering': '#EF4444',
      'Medical / Health': '#10B981',
      'Business / Management': '#F59E0B',
      'Science': '#8B5CF6',
      'Languages': '#EC4899',
      'Law': '#6366F1',
      'Arts & Design': '#F97316',
      'Social Sciences': '#14B8A6',
      'Sport': '#84CC16'
    };
    return colors[domainField] || '#6B7280';
  }

  private getDomainDescription(domainField: string): string {
    const descriptions: { [key: string]: string } = {
      'IT': 'Software development, cybersecurity, data science',
      'Engineering': 'Technical design, innovation, problem-solving',
      'Medical / Health': 'Healthcare, medicine, life sciences',
      'Business / Management': 'Finance, marketing, entrepreneurship',
      'Science': 'Research, analysis, discovery',
      'Languages': 'Translation, communication, culture',
      'Law': 'Legal systems, justice, advocacy',
      'Arts & Design': 'Creativity, visual communication',
      'Social Sciences': 'Society, human behavior, research',
      'Sport': 'Athletics, coaching, performance'
    };
    return descriptions[domainField] || 'Professional development and growth';
  }

  private getDomainDifficulty(domain: Domain): 'easy' | 'medium' | 'hard' {
    if (domain.unemployment_risk === 'Low') return 'easy';
    if (domain.unemployment_risk === 'Moderate') return 'medium';
    return 'hard';
  }

  public generateSpecificRoadmap(
    domainField: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): SpecificRoadmap {
    const domain = this.domainMatcher.getDomainByField(domainField);
    if (!domain) {
      throw new Error(`Domain ${domainField} not found`);
    }

    return this.createDomainSpecificRoadmap(domain, level);
  }

  private createDomainSpecificRoadmap(
    domain: Domain,
    level: 'beginner' | 'intermediate' | 'advanced'
  ): SpecificRoadmap {
    // SINGLE SOURCE OF TRUTH: build roadmap ONLY from smart-orientation-backend/data/domains.json
    // Domain JSON format expected:
    // domain.roadmap[level].duration
    // domain.roadmap[level].phases[]
    // domain.roadmap[level].certifications
    // domain.roadmap[level].career_paths (or domain.roadmap[level].projects)

    const roadmapLevel = (domain.roadmap && (domain.roadmap as any)[level]) || (domain.roadmap?.[level]);
    if (!roadmapLevel) {
      // Fallback: minimal generic roadmap built from domain.roadmap if available
      return {
        domain: domain.field,
        level,
        phases: [],
        totalDuration: '',
        prerequisites: ['Basic skills', 'Interest in field'],
        certifications: domain.roadmap?.[level]?.certifications ?? [],
        careerPaths:
          (domain.roadmap?.[level] as any)?.career_paths ??
          (domain.roadmap?.[level] as any)?.projects ??
          [],
      };
    }

    const phases = (roadmapLevel.phases || []).map((p: any) => ({
      title: p.title,
      duration: p.duration,
      skills: p.skills || [],
      projects: p.projects || [],
      resources: p.resources || [],
      milestones: p.milestones || [],
    }));

    // Some JSONs might not provide an overall duration; compute from phases when possible.
    // If roadmapLevel.duration is present, use it.
    const totalDuration: string = roadmapLevel.duration || this.calculateTotalDuration(phases as RoadmapPhase[]);

    return {
      domain: domain.field,
      level,
      phases,
      totalDuration,
      prerequisites: domain.skills || [],
      certifications: roadmapLevel.certifications || domain.roadmap?.[level]?.certifications || [],
      careerPaths:
        roadmapLevel.career_paths ||
        (roadmapLevel as any).career_paths ||
        roadmapLevel.projects ||
        (roadmapLevel as any).projects ||
        (domain.roadmap?.[level] as any)?.projects ||
        [],
    };
  }


  private createITRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    const itSpecializations = {
      'Cybersecurity': {
        phases: [
          {
            title: 'Linux & Networking Fundamentals',
            duration: '2-3 months',
            skills: ['Linux command line', 'TCP/IP', 'Network protocols', 'Firewall basics'],
            projects: ['Setup home lab', 'Configure router', 'Network monitoring'],
            resources: ['CompTIA Network+', 'Linux Academy', 'Wireshark'],
            milestones: ['Build home network lab', 'Configure firewall rules']
          },
          {
            title: 'Security Foundations',
            duration: '3-4 months',
            skills: ['Security principles', 'Vulnerability assessment', 'Penetration testing basics', 'SIEM'],
            projects: ['Vulnerability scan', 'Security audit', 'Incident response plan'],
            resources: ['CompTIA Security+', 'TryHackMe', 'HackTheBox', 'Splunk'],
            milestones: ['Complete Security+ certification', 'First pentest report']
          },
          {
            title: 'Advanced Security',
            duration: '4-6 months',
            skills: ['Advanced pentesting', 'Malware analysis', 'Digital forensics', 'Security architecture'],
            projects: ['Full penetration test', 'Malware analysis', 'Security audit'],
            resources: ['OSCP', 'GIAC certifications', 'SANS training', 'Kali Linux'],
            milestones: ['OSCP certification', 'Security consulting project']
          }
        ],
        certifications: ['CompTIA Security+', 'CEH', 'OSCP', 'CISSP'],
        careerPaths: ['Security Analyst', 'Penetration Tester', 'Security Consultant', 'Security Engineer']
      },
      'Frontend Development': {
        phases: [
          {
            title: 'Web Foundations',
            duration: '2-3 months',
            skills: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Responsive design'],
            projects: ['Portfolio website', 'Landing page', 'Interactive form'],
            resources: ['MDN Web Docs', 'freeCodeCamp', 'CSS-Tricks', 'JavaScript.info'],
            milestones: ['Build responsive portfolio', 'Master JavaScript fundamentals']
          },
          {
            title: 'Modern Frontend',
            duration: '3-4 months',
            skills: ['React', 'TypeScript', 'State management', 'API integration'],
            projects: ['React dashboard', 'E-commerce frontend', 'Progressive Web App'],
            resources: ['React Documentation', 'TypeScript Handbook', 'Frontend Masters'],
            milestones: ['Build full React application', 'TypeScript certification']
          },
          {
            title: 'Advanced Frontend',
            duration: '4-6 months',
            skills: ['Next.js', 'Performance optimization', 'Testing', 'DevOps'],
            projects: ['Enterprise application', 'Component library', 'Performance optimization'],
            resources: ['Next.js docs', 'Web.dev', 'Testing Library', 'Vercel'],
            milestones: ['Deploy production app', 'Open source contribution']
          }
        ],
        certifications: ['React Certification', 'AWS Cloud Practitioner', 'Google Mobile Web Specialist'],
        careerPaths: ['Frontend Developer', 'UI/UX Engineer', 'Full Stack Developer', 'Frontend Architect']
      },
      'AI & Machine Learning': {
        phases: [
          {
            title: 'Python & Math Foundations',
            duration: '3-4 months',
            skills: ['Python', 'Linear algebra', 'Statistics', 'Data analysis'],
            projects: ['Data analysis project', 'Statistical models', 'Python automation'],
            resources: ['Python for Data Analysis', 'Kaggle Learn', 'Coursera ML'],
            milestones: ['Complete Python course', 'First Kaggle competition']
          },
          {
            title: 'Machine Learning',
            duration: '4-6 months',
            skills: ['Scikit-learn', 'TensorFlow', 'Neural networks', 'Model evaluation'],
            projects: ['Classification model', 'Regression analysis', 'Deep learning project'],
            resources: ['Fast.ai', 'TensorFlow docs', 'Machine Learning Mastery'],
            milestones: ['Build ML model', 'Deploy ML service']
          },
          {
            title: 'AI Specialization',
            duration: '6-8 months',
            skills: ['NLP', 'Computer Vision', 'MLOps', 'AI ethics'],
            projects: ['NLP application', 'Computer vision system', 'MLOps pipeline'],
            resources: ['Hugging Face', 'OpenAI docs', 'MLflow', 'AWS SageMaker'],
            milestones: ['Production AI system', 'Research publication']
          }
        ],
        certifications: ['TensorFlow Developer', 'AWS Machine Learning', 'Microsoft Azure AI'],
        careerPaths: ['ML Engineer', 'Data Scientist', 'AI Researcher', 'ML Ops Engineer']
      },
      'Backend Development': {
        phases: [
          {
            title: 'Programming Foundations',
            duration: '2-3 months',
            skills: ['JavaScript/Node.js or Python/Java', 'Git', 'Command line', 'Basic algorithms'],
            projects: ['CLI tools', 'Simple scripts', 'Git workflow practice'],
            resources: ['freeCodeCamp', 'The Odin Project', 'Codecademy'],
            milestones: ['First GitHub repo', 'Solve 50 coding challenges']
          },
          {
            title: 'Server & API Development',
            duration: '3-4 months',
            skills: ['RESTful APIs', 'Database design', 'Authentication/Authorization', 'Middleware'],
            projects: ['CRUD API', 'User authentication system', 'File upload service'],
            resources: ['Node.js docs', 'Express.js', 'MongoDB University', 'PostgreSQL tutorials'],
            milestones: ['Build complete REST API', 'Database schema design']
          },
          {
            title: 'Advanced Backend',
            duration: '4-6 months',
            skills: ['Microservices', 'Message queues', 'Caching', 'Load balancing', 'Docker'],
            projects: ['Scalable API', 'Real-time application', 'Microservices architecture'],
            resources: ['Docker docs', 'Redis University', 'Kafka tutorials', 'System Design Primer'],
            milestones: ['Deploy microservices', 'Handle 10k+ concurrent users']
          }
        ],
        certifications: ['AWS Developer Associate', 'MongoDB Certified Developer', 'Oracle Certified Professional'],
        careerPaths: ['Backend Developer', 'API Developer', 'Systems Engineer', 'DevOps Engineer']
      },
      'Data Science': {
        phases: [
          {
            title: 'Data Foundations',
            duration: '2-3 months',
            skills: ['Python', 'Pandas', 'NumPy', 'Data visualization', 'SQL'],
            projects: ['Data cleaning project', 'Exploratory data analysis', 'Visualization dashboard'],
            resources: ['Kaggle Learn', 'DataCamp', 'Mode Analytics SQL tutorials'],
            milestones: ['Complete 5 Kaggle datasets', 'SQL mastery']
          },
          {
            title: 'Statistical Analysis',
            duration: '3-4 months',
            skills: ['Statistics', 'Hypothesis testing', 'A/B testing', 'Regression analysis'],
            projects: ['Market analysis', 'A/B test analysis', 'Predictive model'],
            resources: ['StatQuest', 'Think Stats', 'Practical Statistics for Data Scientists'],
            milestones: ['Statistical analysis report', 'Business insights presentation']
          },
          {
            title: 'Advanced Data Science',
            duration: '4-6 months',
            skills: ['Machine learning', 'Big data tools', 'Data pipelines', 'Cloud analytics'],
            projects: ['End-to-end ML project', 'Big data processing', 'Automated reporting'],
            resources: ['Coursera Data Science Specialization', 'Databricks', 'Google Data Analytics'],
            milestones: ['Production ML model', 'Data pipeline architecture']
          }
        ],
        certifications: ['Google Data Analytics Certificate', 'IBM Data Science Professional', 'AWS Data Analytics'],
        careerPaths: ['Data Analyst', 'Data Scientist', 'Business Intelligence Analyst', 'Analytics Engineer']
      },
      'Mobile Development': {
        phases: [
          {
            title: 'Mobile Foundations',
            duration: '2-3 months',
            skills: ['Dart/Flutter or React Native', 'Mobile UI principles', 'State management', 'Navigation'],
            projects: ['Todo app', 'Weather app', 'Basic UI components'],
            resources: ['Flutter docs', 'React Native docs', 'Mobile UI Guidelines'],
            milestones: ['First mobile app', 'App store submission']
          },
          {
            title: 'Professional Mobile Dev',
            duration: '3-4 months',
            skills: ['API integration', 'Local storage', 'Push notifications', 'Authentication'],
            projects: ['E-commerce app', 'Social media app', 'Location-based app'],
            resources: ['Firebase docs', 'Supabase', 'Appwrite', 'Mobile Dev communities'],
            milestones: ['Full-featured app', 'Backend integration']
          },
          {
            title: 'Advanced Mobile',
            duration: '4-6 months',
            skills: ['Performance optimization', 'Native modules', 'CI/CD for mobile', 'App architecture'],
            projects: ['High-performance app', 'Offline-first app', 'Complex animations'],
            resources: ['Advanced Flutter', 'Native iOS/Android development', 'Mobile architecture patterns'],
            milestones: ['Published app on stores', '1000+ downloads']
          }
        ],
        certifications: ['Google Associate Android Developer', 'Flutter Certified Developer'],
        careerPaths: ['Mobile Developer', 'iOS Developer', 'Android Developer', 'Cross-platform Developer']
      },
      'DevOps & Cloud': {
        phases: [
          {
            title: 'Infrastructure Foundations',
            duration: '2-3 months',
            skills: ['Linux administration', 'Bash scripting', 'Networking basics', 'Version control'],
            projects: ['Server setup', 'Automated scripts', 'Network configuration'],
            resources: ['Linux Foundation', 'LPIC-1', 'Cisco Networking Basics'],
            milestones: ['Configure web server', 'Automation scripts']
          },
          {
            title: 'Cloud & Containers',
            duration: '3-4 months',
            skills: ['Docker', 'Kubernetes', 'AWS/Azure/GCP basics', 'CI/CD pipelines'],
            projects: ['Containerized applications', 'K8s deployment', 'CI/CD setup'],
            resources: ['Docker docs', 'Kubernetes docs', 'AWS Free Tier', 'GitHub Actions'],
            milestones: ['K8s cluster setup', 'Automated deployments']
          },
          {
            title: 'Advanced DevOps',
            duration: '4-6 months',
            skills: ['Infrastructure as Code', 'Monitoring/Logging', 'Security practices', 'Multi-cloud'],
            projects: ['Terraform infrastructure', 'Monitoring stack', 'Security hardening'],
            resources: ['Terraform docs', 'Prometheus/Grafana', 'DevOps Handbook', 'SRE book'],
            milestones: ['IaC deployment', '99.9% uptime monitoring']
          }
        ],
        certifications: ['AWS Certified Solutions Architect', 'CKA (Kubernetes)', 'HashiCorp Terraform Associate'],
        careerPaths: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Architect', 'Platform Engineer']
      }
    };

    // Detect IT specialization from domain keywords and message context
    let specialization = 'Frontend Development';
    
    const allKeywords = [...domain.aliases, ...domain.keywords].map(k => k.toLowerCase());
    const domainField = domain.field.toLowerCase();
    
    // Check for specific specializations in order of priority
    if (allKeywords.some(k => k.includes('cyber') || k.includes('security') || k.includes('securite') || k.includes('أمن'))) {
      specialization = 'Cybersecurity';
    } else if (allKeywords.some(k => k.includes('backend') || k.includes('server') || k.includes('api') || k.includes('خادم'))) {
      specialization = 'Backend Development';
    } else if (allKeywords.some(k => k.includes('data') || k.includes('big data') || k.includes('analytics') || k.includes('بيانات'))) {
      specialization = 'Data Science';
    } else if (allKeywords.some(k => k.includes('ai') || k.includes('machine') || k.includes('intelligence') || k.includes('ذكاء'))) {
      specialization = 'AI & Machine Learning';
    } else if (allKeywords.some(k => k.includes('mobile') || k.includes('android') || k.includes('ios') || k.includes('موبايل'))) {
      specialization = 'Mobile Development';
    } else if (allKeywords.some(k => k.includes('devops') || k.includes('cloud') || k.includes('docker') || k.includes('كلاود'))) {
      specialization = 'DevOps & Cloud';
    }

    const spec = itSpecializations[specialization as keyof typeof itSpecializations];
    
    return {
      domain: domain.field,
      level,
      phases: spec.phases,
      totalDuration: this.calculateTotalDuration(spec.phases),
      prerequisites: this.getITPrerequisites(specialization),
      certifications: spec.certifications,
      careerPaths: spec.careerPaths
    };
  }

  private createLawRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Legal Foundations',
          duration: '6-12 months',
          skills: ['Legal research', 'Civil law basics', 'Criminal law', 'Legal writing'],
          projects: ['Legal research memos', 'Case briefs', 'Legal analysis papers'],
          resources: ['Black\'s Law Dictionary', 'Legal research databases', 'Law school prep courses'],
          milestones: ['Master legal research', 'Complete legal writing course']
        },
        {
          title: 'Specialized Law Practice',
          duration: '12-24 months',
          skills: ['Specialized law domains', 'Client representation', 'Legal strategy', 'Negotiation'],
          projects: ['Legal cases', 'Contract drafting', 'Legal consultations'],
          resources: ['Bar exam prep', 'Legal practice guides', 'Continuing education'],
          milestones: ['Bar admission', 'First legal case']
        },
        {
          title: 'Legal Expertise',
          duration: '24-48 months',
          skills: ['Legal expertise', 'Partnership track', 'Legal scholarship', 'Leadership'],
          projects: ['Complex litigation', 'Legal publications', 'Firm management'],
          resources: ['Advanced legal certifications', 'Legal journals', 'Professional associations'],
          milestones: ['Partnership or specialization recognition']
        }
      ],
      totalDuration: '3-6 years',
      prerequisites: ['Bachelor\'s degree', 'Strong analytical skills', 'Excellent writing ability'],
      certifications: ['Bar License', 'Specialized Legal Certifications'],
      careerPaths: ['Lawyer', 'Legal Consultant', 'Judge', 'Corporate Counsel', 'Legal Academic']
    };
  }

  private createHealthRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Science Foundations',
          duration: '12-24 months',
          skills: ['Biology', 'Chemistry', 'Anatomy', 'Physiology'],
          projects: ['Lab experiments', 'Research projects', 'Science presentations'],
          resources: ['Anatomy textbooks', 'Lab manuals', 'Medical terminology guides'],
          milestones: ['Complete science prerequisites', 'Medical school admission']
        },
        {
          title: 'Clinical Training',
          duration: '24-48 months',
          skills: ['Clinical practice', 'Patient diagnosis', 'Treatment protocols', 'Medical ethics'],
          projects: ['Clinical rotations', 'Research projects', 'Patient case studies'],
          resources: ['Medical school curriculum', 'Clinical guidelines', 'Medical journals'],
          milestones: ['Complete clinical rotations', 'Medical license']
        },
        {
          title: 'Medical Specialization',
          duration: '36-72 months',
          skills: ['Specialized medical practice', 'Medical research', 'Teaching', 'Healthcare management'],
          projects: ['Medical research', 'Specialized training', 'Healthcare improvement'],
          resources: ['Specialty training programs', 'Medical research facilities', 'Continuing education'],
          milestones: ['Medical specialization', 'Board certification']
        }
      ],
      totalDuration: '6-10 years',
      prerequisites: ['Strong science background', 'Compassion', 'Attention to detail', 'Emotional resilience'],
      certifications: ['Medical License', 'Board Certifications', 'Specialty Certifications'],
      careerPaths: ['Doctor', 'Surgeon', 'Medical Researcher', 'Specialist', 'Healthcare Administrator']
    };
  }

  private createEngineeringRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Engineering Fundamentals',
          duration: '12-24 months',
          skills: ['Mathematics', 'Physics', 'Engineering design', 'CAD software'],
          projects: ['Design projects', 'Lab experiments', 'Engineering analysis'],
          resources: ['Engineering textbooks', 'CAD software tutorials', 'Lab equipment'],
          milestones: ['Complete engineering fundamentals', 'CAD certification']
        },
        {
          title: 'Specialized Engineering',
          duration: '24-36 months',
          skills: ['Advanced engineering', 'Project management', 'Quality control', 'Innovation'],
          projects: ['Engineering projects', 'Product design', 'Process optimization'],
          resources: ['Advanced engineering texts', 'Project management tools', 'Industry standards'],
          milestones: ['Engineering internship', 'Professional certification']
        },
        {
          title: 'Engineering Leadership',
          duration: '36-60 months',
          skills: ['Engineering leadership', 'R&D', 'Innovation management', 'Business acumen'],
          projects: ['Leadership projects', 'R&D initiatives', 'Business development'],
          resources: ['Leadership training', 'Business courses', 'Industry conferences'],
          milestones: ['Professional Engineer License', 'Leadership role']
        }
      ],
      totalDuration: '4-8 years',
      prerequisites: ['Strong math and physics', 'Problem-solving skills', 'Technical aptitude'],
      certifications: ['Engineering License', 'Project Management Professional', 'Specialized Certifications'],
      careerPaths: ['Engineer', 'Project Manager', 'R&D Engineer', 'Engineering Manager', 'Technical Consultant']
    };
  }

  private createBusinessRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Business Foundations',
          duration: '6-12 months',
          skills: ['Business principles', 'Accounting', 'Marketing', 'Economics'],
          projects: ['Business plan', 'Market analysis', 'Financial statements'],
          resources: ['Business textbooks', 'Accounting software', 'Market research tools'],
          milestones: ['Complete business fundamentals', 'Business plan creation']
        },
        {
          title: 'Business Specialization',
          duration: '12-24 months',
          skills: ['Strategic management', 'Financial analysis', 'Business development', 'Leadership'],
          projects: ['Business development', 'Strategic planning', 'Financial analysis'],
          resources: ['MBA materials', 'Business case studies', 'Professional networks'],
          milestones: ['Business specialization', 'Management role']
        },
        {
          title: 'Business Leadership',
          duration: '24-48 months',
          skills: ['Executive leadership', 'Business strategy', 'Entrepreneurship', 'Global business'],
          projects: ['Business leadership', 'Strategic initiatives', 'Entrepreneurial ventures'],
          resources: ['Executive education', 'Business networks', 'Industry conferences'],
          milestones: ['Executive position', 'Business ownership']
        }
      ],
      totalDuration: '3-6 years',
      prerequisites: ['Business acumen', 'Communication skills', 'Analytical thinking'],
      certifications: ['MBA', 'Project Management Professional', 'Business Certifications'],
      careerPaths: ['Business Manager', 'Consultant', 'Entrepreneur', 'Executive', 'Business Analyst']
    };
  }

  private createScienceRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Scientific Foundations',
          duration: '12-24 months',
          skills: ['Scientific method', 'Research techniques', 'Data analysis', 'Laboratory skills'],
          projects: ['Research experiments', 'Data analysis projects', 'Scientific papers'],
          resources: ['Scientific textbooks', 'Lab equipment', 'Research databases'],
          milestones: ['Research methodology mastery', 'First research paper']
        },
        {
          title: 'Advanced Research',
          duration: '24-48 months',
          skills: ['Advanced research', 'Statistical analysis', 'Scientific writing', 'Critical thinking'],
          projects: ['Research thesis', 'Scientific publications', 'Collaborative research'],
          resources: ['Advanced scientific texts', 'Research facilities', 'Scientific journals'],
          milestones: ['Master\'s degree', 'Research publication']
        },
        {
          title: 'Scientific Expertise',
          duration: '48-72 months',
          skills: ['Independent research', 'Grant writing', 'Teaching', 'Scientific leadership'],
          projects: ['PhD research', 'Postdoctoral research', 'Independent projects'],
          resources: ['PhD programs', 'Research grants', 'Academic networks'],
          milestones: ['PhD degree', 'Research leadership']
        }
      ],
      totalDuration: '6-10 years',
      prerequisites: ['Strong science background', 'Research aptitude', 'Critical thinking'],
      certifications: ['Research certifications', 'Academic degrees', 'Specialized training'],
      careerPaths: ['Researcher', 'Scientist', 'Academic', 'Lab Manager', 'Science Consultant']
    };
  }

  private createLanguagesRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Language Foundations',
          duration: '6-12 months',
          skills: ['Language proficiency', 'Translation basics', 'Cultural knowledge', 'Writing skills'],
          projects: ['Translation samples', 'Writing portfolio', 'Cultural presentations'],
          resources: ['Language textbooks', 'Translation software', 'Cultural materials'],
          milestones: ['Language proficiency certification', 'Translation portfolio']
        },
        {
          title: 'Professional Language Skills',
          duration: '12-24 months',
          skills: ['Professional translation', 'Specialized writing', 'Interpretation', 'Content strategy'],
          projects: ['Professional translation', 'Published works', 'Interpretation assignments'],
          resources: ['Professional translation tools', 'Style guides', 'Industry materials'],
          milestones: ['Professional certification', 'Published work']
        },
        {
          title: 'Language Expertise',
          duration: '24-48 months',
          skills: ['Literary translation', 'Technical translation', 'Conference interpretation', 'Teaching'],
          projects: ['Book translations', 'Major conferences', 'Academic work'],
          resources: ['Advanced translation tools', 'Academic networks', 'Professional associations'],
          milestones: ['Expert certification', 'Teaching position', 'Major publications']
        }
      ],
      totalDuration: '3-6 years',
      prerequisites: ['Language aptitude', 'Cultural awareness', 'Writing skills'],
      certifications: ['Translation Certifications', 'Language Proficiency Tests', 'Teaching Qualifications'],
      careerPaths: ['Translator', 'Interpreter', 'Language Teacher', 'Content Creator', 'Cultural Consultant']
    };
  }

  private createArtsRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Art Foundations',
          duration: '6-12 months',
          skills: ['Art principles', 'Digital tools', 'Creative techniques', 'Portfolio development'],
          projects: ['Art portfolio', 'Creative projects', 'Design experiments'],
          resources: ['Art textbooks', 'Creative software', 'Art communities'],
          milestones: ['Portfolio creation', 'Basic skills mastery']
        },
        {
          title: 'Professional Art Skills',
          duration: '12-24 months',
          skills: ['Advanced techniques', 'Professional software', 'Client work', 'Brand development'],
          projects: ['Professional projects', 'Client work', 'Brand development'],
          resources: ['Professional tools', 'Industry networks', 'Creative communities'],
          milestones: ['Professional certification', 'Client portfolio']
        },
        {
          title: 'Artistic Excellence',
          duration: '24-48 months',
          skills: ['Artistic leadership', 'Creative direction', 'Specialized expertise', 'Teaching'],
          projects: ['Major creative works', 'Leadership projects', 'Teaching initiatives'],
          resources: ['Advanced tools', 'Professional networks', 'Teaching opportunities'],
          milestones: ['Artistic recognition', 'Leadership role', 'Teaching position']
        }
      ],
      totalDuration: '3-6 years',
      prerequisites: ['Creative talent', 'Artistic aptitude', 'Technical skills'],
      certifications: ['Art Certifications', 'Software Certifications', 'Professional Qualifications'],
      careerPaths: ['Artist', 'Designer', 'Creative Director', 'Art Teacher', 'Freelancer']
    };
  }

  private createSocialSciencesRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Social Science Foundations',
          duration: '12-24 months',
          skills: ['Social research', 'Data analysis', 'Social theory', 'Research methods'],
          projects: ['Research projects', 'Social analysis', 'Policy papers'],
          resources: ['Social science textbooks', 'Research tools', 'Statistical software'],
          milestones: ['Research methodology mastery', 'First research project']
        },
        {
          title: 'Advanced Social Research',
          duration: '24-48 months',
          skills: ['Advanced research', 'Policy analysis', 'Program evaluation', 'Social intervention'],
          projects: ['Social research', 'Policy analysis', 'Program evaluation'],
          resources: ['Advanced research methods', 'Policy analysis tools', 'Social software'],
          milestones: ['Master\'s degree', 'Policy impact work']
        },
        {
          title: 'Social Science Leadership',
          duration: '48-72 months',
          skills: ['Research leadership', 'Policy development', 'Social innovation', 'Teaching'],
          projects: ['Major research', 'Policy development', 'Social programs'],
          resources: ['PhD programs', 'Policy networks', 'Social organizations'],
          milestones: ['PhD degree', 'Policy leadership', 'Social impact']
        }
      ],
      totalDuration: '6-10 years',
      prerequisites: ['Analytical skills', 'Research aptitude', 'Social awareness'],
      certifications: ['Research Certifications', 'Policy Analysis Certifications', 'Academic Degrees'],
      careerPaths: ['Social Researcher', 'Policy Analyst', 'Social Worker', 'Academic', 'Policy Consultant']
    };
  }

  private createSportRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Sport Foundations',
          duration: '6-12 months',
          skills: ['Sport science', 'Coaching basics', 'Fitness training', 'Nutrition'],
          projects: ['Training programs', 'Coaching sessions', 'Fitness plans'],
          resources: ['Sport science textbooks', 'Coaching manuals', 'Fitness certifications'],
          milestones: ['Coaching certification', 'Training program design']
        },
        {
          title: 'Professional Sport Skills',
          duration: '12-24 months',
          skills: ['Advanced coaching', 'Sport psychology', 'Performance analysis', 'Sport management'],
          projects: ['Coaching practice', 'Performance analysis', 'Sport management'],
          resources: ['Advanced coaching materials', 'Sport psychology resources', 'Management tools'],
          milestones: ['Advanced certification', 'Professional coaching']
        },
        {
          title: 'Sport Excellence',
          duration: '24-48 months',
          skills: ['Elite coaching', 'Sport leadership', 'Specialized expertise', 'Sport entrepreneurship'],
          projects: ['Elite coaching', 'Sport leadership', 'Business development'],
          resources: ['Elite coaching programs', 'Leadership training', 'Business resources'],
          milestones: ['Elite recognition', 'Leadership role', 'Sport business']
        }
      ],
      totalDuration: '3-6 years',
      prerequisites: ['Sport background', 'Coaching aptitude', 'Leadership skills'],
      certifications: ['Coaching Certifications', 'Fitness Certifications', 'Sport Management Qualifications'],
      careerPaths: ['Coach', 'Fitness Trainer', 'Sport Manager', 'Performance Analyst', 'Sport Entrepreneur']
    };
  }

  private createGenericRoadmap(domain: Domain, level: 'beginner' | 'intermediate' | 'advanced'): SpecificRoadmap {
    return {
      domain: domain.field,
      level,
      phases: [
        {
          title: 'Foundations',
          duration: '3-6 months',
          skills: domain.skills.slice(0, 3),
          projects: ['Foundation project', 'Basic portfolio'],
          resources: ['Online courses', 'Industry resources'],
          milestones: ['Complete foundation phase']
        },
        {
          title: 'Development',
          duration: '6-12 months',
          skills: domain.skills.slice(3, 6),
          projects: ['Advanced project', 'Professional work'],
          resources: ['Advanced courses', 'Professional networks'],
          milestones: ['Complete development phase']
        },
        {
          title: 'Excellence',
          duration: '12-24 months',
          skills: domain.skills.slice(6),
          projects: ['Expert project', 'Leadership work'],
          resources: ['Expert resources', 'Leadership opportunities'],
          milestones: ['Achieve expertise level']
        }
      ],
      totalDuration: '2-3 years',
      prerequisites: ['Basic skills', 'Interest in field'],
      certifications: domain.roadmap[level].certifications,
      careerPaths: domain.roadmap[level].projects
    };
  }

  private calculateTotalDuration(phases: RoadmapPhase[]): string {
    const totalMonths = phases.reduce((total, phase) => {
      const monthRange = phase.duration.match(/(\d+)-(\d+)/);
      if (monthRange) {
        return total + parseInt(monthRange[1]);
      }
      const singleMonth = phase.duration.match(/(\d+)/);
      if (singleMonth) {
        return total + parseInt(singleMonth[1]);
      }
      return total;
    }, 0);

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years > 0 && months > 0) {
      return `${years}-${years + 1} years`;
    } else if (years > 0) {
      return `${years} years`;
    } else {
      return `${months} months`;
    }
  }

  private detectLanguage(message: string): 'fr' | 'ar' | 'mixed' {
    const arabicChars = (message.match(/[\u0600-\u06FF]/g) || []).length;
    const frenchChars = (message.match(/[a-zA-Zàâäéèêëïîôöùûüÿç]/g) || []).length;
    const totalChars = message.replace(/\s/g, '').length;

    if (totalChars === 0) return 'fr';

    const arabicRatio = arabicChars / totalChars;
    const frenchRatio = frenchChars / totalChars;

    if (arabicRatio > 0.7) return 'ar';
    if (frenchRatio > 0.7) return 'fr';
    return 'mixed';
  }

  private getITPrerequisites(specialization: string): string[] {
    const prerequisites: { [key: string]: string[] } = {
      'Cybersecurity': ['Computer basics', 'Network fundamentals', 'Linux basics', 'Problem-solving skills'],
      'Frontend Development': ['Computer basics', 'Internet familiarity', 'Creativity', 'Attention to detail'],
      'Backend Development': ['Programming basics', 'Database fundamentals', 'API concepts', 'Server basics'],
      'AI & Machine Learning': ['Strong math background', 'Programming basics', 'Statistics', 'Analytical thinking'],
      'Data Science': ['Programming basics', 'Statistics fundamentals', 'Data analysis concepts', 'SQL basics'],
      'Mobile Development': ['Programming basics', 'Mobile concepts', 'UI/UX basics', 'Platform knowledge'],
      'DevOps & Cloud': ['Linux basics', 'Networking fundamentals', 'Scripting basics', 'System administration']
    };
    return prerequisites[specialization] || ['Computer basics', 'Problem-solving skills'];
  }

  public shouldShowRoadmapSelector(message: string, detectedDomain?: string): boolean {
    // Show selector if:
    // 1. Intent is roadmap/career related but no specific domain detected
    // 2. User asks for general roadmap without specifying domain
    
    const roadmapKeywords = [
      // French
      'roadmap', 'parcours', 'chemin', 'étapes', 'progression', 'comment devenir',
      'comment apprendre', 'formation', 'apprendre', 'débuter', 'commencer',
      // Standard Arabic
      'مسار', 'طريق', 'مراحل', 'تطور', 'كيف أصبح', 'road map', 'learning path',
      'تدريب', 'تعلم', 'تكوين', 'بداية', 'كيف أبدأ', 'ماذا أتعلم',
      // Tunisian Arabic (Darija)
      'شنو نتعلم', 'شنوّا نتعلم', 'شنوة نتعلم', 'كيفاش نبدأ', 'كيفاش نبدا',
      'كيفاش نتعلم', 'كيف نبدأ', 'منين نبدأ', 'منين نبدا', 'كيفاش نولي',
      'شنيا لازم نتعلم', 'شنو لازمني', 'كيفاش نخدم', 'شنو نعمل', 'كيف نتعلم',
      'شنو نولي', 'شنو نخدم', 'شنو نشد', 'كيفاش نشد خدمة',
      'شنو احسن شغل', 'شنو احسن خدمة', 'شنوة نولي', 'شنوّا نخدم',
      // English
      'career', 'carrière', 'path', 'skills', 'skill', 'begin', 'start',
      // General
      'emploi', 'travail', 'métier', 'job', 'وظيفة', 'عمل', 'مهنة',
      'compétences', 'aptitudes', 'مهارات'
    ];

    const normalizedMessage = message.toLowerCase();
    const hasRoadmapKeyword = roadmapKeywords.some(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    );

    // Also check if user is asking for a domain that wasn't clearly detected
    const isAskingForGuidance = !detectedDomain && (
      normalizedMessage.includes('شنو') || 
      normalizedMessage.includes('كيف') ||
      normalizedMessage.includes('منين') ||
      normalizedMessage.includes('comment') ||
      normalizedMessage.includes('quoi') ||
      normalizedMessage.includes('what') ||
      normalizedMessage.includes('how')
    );

    return (hasRoadmapKeyword || isAskingForGuidance) && !detectedDomain;
  }
}
