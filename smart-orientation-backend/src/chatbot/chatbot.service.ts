import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import jobsData from '../../lib/data/jobs.json'
import { OllamaConfigService } from '../common/services/ollama-config.service'

type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

type StudentData = {
  name?: string
  bacType?: string
  bacAverage?: number
  FG?: number
  selectedFiliere?: string
}

type DomainData = {
  domain: string
  keywords: string[]
  jobs: Array<{
    title: string
    skills: string[]
    unemployment_rate?: number
  }>
}

function detectLanguage(message: string): 'fr' | 'ar' {
  if (/[\u0600-\u06FF]/.test(message)) {
    return 'ar'
  }
  return 'fr'
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name)
  private jobsData: DomainData[] = []

  constructor(private readonly ollamaConfig: OllamaConfigService) {
    this.loadJobsData()
  }

  private loadJobsData(): void {
    try {
      const jobsPath = path.join(__dirname, '../../lib/data/jobs.json')
      const fileContent = fs.readFileSync(jobsPath, 'utf-8')
      this.jobsData = JSON.parse(fileContent)
      this.logger.log(`Loaded ${this.jobsData.length} domains from jobs.json`)
    } catch (error) {
      this.logger.error('Failed to load jobs.json', error)
      this.jobsData = []
    }
  }
 async processMessage(message: string, studentData?: StudentData): Promise<string> {
  const userMessage = message?.trim()
if (!userMessage) return 'Message non valide'

const lang = detectLanguage(userMessage) // 🔥 هنا

try {
    console.log('🔥 CHATBOT HIT:', message)

    const userMessage = message?.trim()
    if (!userMessage) return 'Message non valide'

    const lang = detectLanguage(userMessage)
    const msg = userMessage.toLowerCase()

    const domain = this.jobsData.find(d =>
      d.keywords.some(k => msg.includes(k))
    )

    // 🧠 context من jobs.json
const ragContext = this.buildRagContext(domain)

// ✍️ prompt
const prompt = this.buildFullPrompt(userMessage, lang, ragContext)

// 🤖 call Ollama
const response = await axios.post(
  'http://localhost:11434/api/generate',
  {
    model: 'mistral',
    prompt,
    stream: false,
    options: {
  num_predict: 40,
  temperature: 0.2
},
  },
  { timeout: 30000 }
)

const data = response.data

if (data.response) {
  return data.response.trim()
}

    return lang === 'fr'
      ? 'Précise ton domaine (informatique, gestion...)'
      : 'حدد المجال أكثر (إعلامية، تصرف...)'

  } catch (error) {
    console.error('❌ CHATBOT ERROR:', error)

    return this.getFallbackResponse(studentData, lang)
  }
}
  


  private findDomain(message: string): DomainData | undefined {
    const msg = message.toLowerCase()
    return this.jobsData.find((domain) =>
      domain.keywords.some((keyword) => msg.includes(keyword.toLowerCase())),
    )
  }

  private getJobFromMessage(message: string) {
    const msg = message.toLowerCase()

    const domain =this.jobsData.find((d) =>
      d.keywords.some((kw: string) => msg.includes(kw)),
    )

    if (!domain) return null

    return domain.jobs[0]
  }

 private buildRagContext(domain?: DomainData): string {
  if (!domain) return 'No data'

  const jobs = domain.jobs
    .slice(0, 2)
    .map((job) => `- ${job.title}`)
    .join('\n')

  return `Domain: ${domain.domain}\nJobs:\n${jobs || '- No job available'}`
}

  private buildFullPrompt(
    userMessage: string,
    lang: 'fr' | 'ar',
    ragContext: string,
  ): string {
    const languageInstruction =
      lang === 'fr'
        ? 'Réponds uniquement en français standard.'
        : 'أجب فقط بالعربية الفصحى.'

    return `You are a strict orientation assistant.
Use ONLY the provided data.
DO NOT invent anything.
Answer VERY briefly (max 2 lines).
Choose ONE job only.
Give ONE short advice.
Ignore unrelated domains.
${languageInstruction}

DATA:
${ragContext}

USER:
${userMessage}`

  }

  private getFallbackResponse(studentData?: StudentData, lang?: 'fr' | 'ar'): string {
    const filiere = studentData?.selectedFiliere ?? 'la filiere selectionnee'
    const detectedLang = lang || 'ar'

    if (detectedLang === 'fr') {
      return `Service IA temporairement indisponible.
Pour ${filiere}, continue avec les fondamentaux et reessaie dans quelques instants.`
    }

    return `خدمة الذكاء الاصطناعي غير متاحة مؤقتاً.
بالنسبة إلى ${filiere}، واصل الأساسيات وأعد المحاولة بعد قليل.`
  }
}
