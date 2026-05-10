"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface StudentData {
  name?: string
  bacType?: string
  bacAverage?: number
  FG?: number
  interests?: string[]
  selectedFiliere?: string
}

interface ChatbotProps {
  studentData?: StudentData
  isOpen?: boolean
  onClose?: () => void
}

export default function Chatbot({ studentData, isOpen: externalIsOpen, onClose }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [t, setT] = useState<Record<string, string> | null>(null)
  const [hasWelcomed, setHasWelcomed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const actualIsOpen = externalIsOpen !== undefined ? externalIsOpen : isOpen

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const lang = (studentData as any)?.language || 'ar'
    fetch(`${API_BASE_URL}/chatbot/i18n/${lang}`)
      .then((r) => r.json())
      .then((json) => setT(json))
      .catch(() => setT(null))
  }, [studentData])

  // Auto-welcome when chatbot opens and student data is available
  useEffect(() => {
    if (actualIsOpen && !hasWelcomed && studentData) {
      setHasWelcomed(true)
      setTimeout(() => {
        const welcomeMsg = generateWelcomeMessage(studentData)
        addMessage("assistant", welcomeMsg)
      }, 500)
    }
  }, [actualIsOpen, hasWelcomed, studentData])

  const generateWelcomeMessage = (data: StudentData) => {
    const avg = data.bacAverage || 0
    const fg = data.FG || 0
    const bacType = data.bacType || "غير محدد"

    const greet = t?.greeting_default || 'صديقي،'
    let msg = `👋 ${greet} ${data.name || ""}\n\n`
    msg += `🤖 أنا المساعد الذكي تاع التوجيه الجامعي، وهاذي المعطيات اللي عندي عليك:\n\n`
    msg += `📊 **معدلك في الباكا**: ${avg}\n`
    msg += `🎯 **معدلك في المناظرة (FG)**: ${fg}\n`
    msg += `📝 **نوع الباكا**: ${bacType}\n\n`

    if (data.selectedFiliere) {
      msg += `🔥 **شفت إليك اخترت ${data.selectedFiliere}**، خليني نفسرلك وضعيتك...\n\n`
      msg += generateFiliereAnalysis(data)
    } else {
      msg += `${t?.welcome_intro || '💡 قلّي شنّا اللي تحب تدرس ولا شنّا السؤال اللي عندك، وانا نعاونك!'}\n\n`
      msg += `مثلا تقدر تسألني على:\n`
      msg += `• شنّا أحسن شعبة ليك حسب معدلك؟\n`
      msg += `• شنّا الـ skills اللي لازمك؟\n`
      msg += `• شنّا مستقبل كل شعبة؟\n`
      msg += `• roadmap كيفاش توصل للهدف تاعك؟`
    }

    return msg
  }

  const generateFiliereAnalysis = (data: StudentData) => {
    const filiere = data.selectedFiliere?.toLowerCase() || ""
    const avg = data.bacAverage || 0

    let analysis = ""

    // 1️⃣ تحليل الاختيار
    analysis += `1️⃣ **تحليل الاختيار** 🔍\n\n`

    if (filiere.includes("info") || filiere.includes("اعلامية") || filiere.includes("انفورماتيك")) {
      analysis += `اخترت **الإعلامية/Informatique** 🖥️\n\n`
      if (avg >= 14) {
        analysis += `🟢 معدلك **EXCELLENT** - راك في وضعيّة مريحة برشا\n`
      } else if (avg >= 12) {
        analysis += `🟡 معدلك **MEDIUM** - فيه شوية risque أما ممكن تنجح\n`
      } else {
        analysis += `🔴 معدلك **RISQUE** - لازمك تخدم برشا باش توصل\n`
      }
    } else if (filiere.includes("med") || filiere.includes("طب")) {
      analysis += `اخترت **الطب/Médecine** ⚕️\n\n`
      if (avg >= 16) {
        analysis += `🟢 معدلك **EXCELLENT** - راهو هدف واقعي\n`
      } else if (avg >= 14) {
        analysis += `🟡 معدلك **MEDIUM** - يحتاج تركيز كبير\n`
      } else {
        analysis += `🔴 معدلك **RISQUE** - الطريق طويل لكن مش مستحيل\n`
      }
    } else if (filiere.includes("ing") || filiere.includes("هندسة") || filiere.includes("ingenieur")) {
      analysis += `اخترت **الهندسة/Ingénierie** ⚙️\n\n`
      if (avg >= 14) {
        analysis += `🟢 معدلك **EXCELLENT** - وضعيّة جيدة\n`
      } else if (avg >= 12) {
        analysis += `🟡 معدلك **MEDIUM** - تنجم توصلها بالتحضير\n`
      } else {
        analysis += `🔴 معدلك **RISQUE** - تحتاج مجهود إضافي\n`
      }
    } else {
      analysis += `اخترت **${data.selectedFiliere}**\n\n`
      if (avg >= 14) {
        analysis += `🟢 معدلك **EXCELLENT** - وضعيّة مريحة\n`
      } else if (avg >= 11) {
        analysis += `🟡 معدلك **MEDIUM** - فيه تحدي لكن ممكن\n`
      } else {
        analysis += `🔴 معدلك **RISQUE** - يحتاج مراجعة الخيارات\n`
      }
    }

    // 2️⃣ نصائح + skills
    analysis += `\n2️⃣ **نصائح + Skills اللي لازمك** 📚\n\n`

    if (filiere.includes("info") || filiere.includes("اعلامية") || filiere.includes("انفورماتيك")) {
      analysis += `لازمك تقوي:\n`
      analysis += `• **Algorithmique** - أساس البرمجة\n`
      analysis += `• **Logique** - التفكير المنطقي\n`
      analysis += `• **Programmation** - التطبيق العملي\n\n`
      analysis += `ننصحك تبدأ بـ:\n`
      analysis += `🐍 **Python** - سهل و قوي\n`
      analysis += `🧠 **Problem Solving** - حل التمارين\n`
    } else if (filiere.includes("med") || filiere.includes("طب")) {
      analysis += `لازمك تقوي:\n`
      analysis += `• **العلوم الطبيعية** - الأساس\n`
      analysis += `• **الفيزياء والكيمياء** - مهمين برشا\n`
      analysis += `• **اللغات** - للبحث العلمي\n\n`
      analysis += `ننصحك بـ:\n`
      analysis += `📖 **المراجعة المنتظمة**\n`
      analysis += `🏥 **التطوع في مستشفيات**\n`
    } else if (filiere.includes("ing") || filiere.includes("هندسة") || filiere.includes("ingenieur")) {
      analysis += `لازمك تقوي:\n`
      analysis += `• **الرياضيات** - العمود الفقري\n`
      analysis += `• **الفيزياء** - التطبيق العملي\n`
      analysis += `• **التفكير التحليلي**\n\n`
      analysis += `ننصحك بـ:\n`
      analysis += `🔧 **المشاريع العملية**\n`
      analysis += `📐 **حل تمارين صعيبة**\n`
    } else {
      analysis += `لازمك تركز على:\n`
      analysis += `• المواد الأساسية تاع شُعبتك\n`
      analysis += `• المراجعة المستمرة\n`
      analysis += `• الفهم العميق مش الحفظ\n`
    }

    // 3️⃣ مستقبل المجال
    analysis += `\n3️⃣ **مستقبل المجال** 🚀\n\n`

    if (filiere.includes("info") || filiere.includes("اعلامية") || filiere.includes("انفورماتيك")) {
      analysis += `الإعلامية في تونس و العالم:\n`
      analysis += `✅ **الطلب كبير برشا** - كل الشركات تحتاج\n`
      analysis += `✅ **تنجم تخدم local ولا remote** - من أي مكان\n`
      analysis += `✅ **Salaire باهي** بعد سنوات الخبرة\n`
      analysis += `✅ **Startup** - تنجم تفتح مشروعك\n`
    } else if (filiere.includes("med") || filiere.includes("طب")) {
      analysis += `الطب في تونس:\n`
      analysis += `✅ **الاحترام المجتمعي** عالي\n`
      analysis += `✅ **الأمان الوظيفي** مضمون\n`
      analysis += `✅ **الدخل جيد** خاصة في القطاع الخاص\n`
      analysis += `⚠️ **الدراسة طويلة** - 7+ سنوات\n`
    } else if (filiere.includes("ing") || filiere.includes("هندسة") || filiere.includes("ingenieur")) {
      analysis += `الهندسة في تونس:\n`
      analysis += `✅ **الطلب موجود** في الصناعات\n`
      analysis += `✅ **تنجم تخدم في الخارج**\n`
      analysis += `✅ **التطور المهني** سريع\n`
      analysis += `✅ **رواتب جيدة** مع الخبرة\n`
    } else {
      analysis += `هذا المجال:\n`
      analysis += `✅ فيه فرص في السوق التونسي\n`
      analysis += `✅ يحتاج تطوير مستمر\n`
      analysis += `✅ المستقبل للمتميزين\n`
    }

    // 4️⃣ ROADMAP
    analysis += `\n4️⃣ **ROADMAP - من 0 حتى PRO** 🔥\n\n`

    if (filiere.includes("info") || filiere.includes("اعلامية") || filiere.includes("انفورماتيك")) {
      analysis += `👉 **Step 1: Basics (3-6 أشهر)**\n`
      analysis += `   • تعلم Python أو Java\n`
      analysis += `   • فهم الخوارزميات الأساسية\n\n`
      analysis += `👉 **Step 2: Algorithm (3 أشهر)**\n`
      analysis += `   • هياكل البيانات\n`
      analysis += `   • حل مسائل على Codewars\n\n`
      analysis += `👉 **Step 3: Projects (6 أشهر)**\n`
      analysis += `   • اعمل مشاريع شخصية\n`
      analysis += `   • GitHub portfolio\n\n`
      analysis += `👉 **Step 4: Internship (3-6 أشهر)**\n`
      analysis += `   • Stage في شركة\n`
      analysis += `   • خبرة عملية\n\n`
      analysis += `👉 **Step 5: Job 🎯**\n`
      analysis += `   • CDI أو freelance\n`
      analysis += `   • salaire: 2000-5000DT\n`
    } else {
      analysis += `👉 **الطريق العام:**\n`
      analysis += `1. **التركيز في الدراسة** - المعدل مهم\n`
      analysis += `2. **التدريب العملي** - stages\n`
      analysis += `3. **التخصص** - اختار niche\n`
      analysis += `4. **الشبكة المهنية** - networking\n`
      analysis += `5. **العمل** - ابدأ و تطوّر\n`
    }

    analysis += `\n\n💬 **اسألني أي حاجة!** أنا هنا باش نعاونك.`

    return analysis
  }

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }])
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput("")
    addMessage("user", userMsg)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      
      const response = await fetch(`${API_BASE_URL}/chatbot/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg,
          studentData: studentData,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.response && data.response.trim()) {
          addMessage("assistant", data.response)
        } else {
          addMessage("assistant", "عذرا، الخدمة ما رجعتش جواب. تأكد من تشغيل خدمة الذكاء الاصطناعي.")
        }
      } else {
        const errorData = await response.json()
        addMessage("assistant", `❌ خطأ: ${errorData.error || "مشكلة في الاتصال بالخادم"}`)
      }
    } catch (error) {
      addMessage("assistant", "❌ مشكلة في الاتصال. تأكد من:\n1. الخادم (NestJS) يشتغل على 3001\n2. Ollama يشتغل على 11434\n3. Firebase متصل")
    } finally {
      setIsLoading(false)
    }
  }

  const generateLocalAIResponse = (userMsg: string, data: StudentData): string => {
    const msg = userMsg.toLowerCase()
    const avg = data?.bacAverage || 0
    const fg = data?.FG || 0

    if (msg.includes("هلا") || msg.includes("مرحبا") || msg.includes("السلام") || msg.includes("bonjour") || msg.includes("slt")) {
      return `👋 أهلا بيك! أنا المساعد الذكي تاع التوجيه.\n\nقلّي شنّا اللي تحب تعرف؟ نحاول نجاوبك على أي سؤال على:\n• الشعب و التوجيه\n• المعدلات و التوقعات\n• roadmap و النصائح\n• المستقبل المهني`
    }

    if (msg.includes("نبدى منين") || msg.includes("منين نبدأ") || msg.includes("par où commencer") || msg.includes("commencer")) {
      return `🎯 **باش تبدا، تبع الخطوات هاذي:**\n\n` +
        `1️⃣ **عرف على نفسك:** شنّا اللي تحب؟ شنّا نقاطك القوية؟\n\n` +
        `2️⃣ **حسب معدلاتك:** شوف معدلك في الباكا و FG\n` +
        `   • معدلك الحالي: ${avg}\n` +
        `   • FG: ${fg}\n\n` +
        `3️⃣ **استكشف الشعب:** شوف الشعب اللي متاحة ليك حسب معدلك\n\n` +
        `4️⃣ **اختر و خطط:** اختار شعبة و اعمل roadmap\n\n` +
        `💡 **نصيحة:** ما تخافش من السؤال، و دايمًا خذ وقتك في القرار!`
    }

    if (msg.includes("صعيبة") || msg.includes("صعب") || msg.includes("difficile") || msg.includes("facile")) {
      return `📊 **السؤال على الصعوبة يعتمد على عدة حاجات:**\n\n` +
        `🔸 **معدلك:** كلما كان المعدل أعلى، كلما كان أسهل\n` +
        `🔸 **شغفك:** اللي تحبه يصير أسهل\n` +
        `🔸 **التحضير:** التحضير الجيد ينقص الصعوبة\n\n` +
        `💡 **الحقيقة:** أي شعبة فيها تحدي، أما اللي يحب ينجح يلقى الطريق.\n\n` +
        `معدلك الحالي (${avg}) يعطيك فرص، و المهم هو الإرادة و العمل المستمر! 💪`
    }

    if (msg.includes("نبدل") || msg.includes("تغيير") || msg.includes("changer") || msg.includes("réorientation")) {
      return `🔄 **أه، تفكر في التغيير؟ هذا طبيعي!**\n\n` +
        `✅ **التغيير ممكن** في عدة مراحل:\n` +
        `• بعد السنة الأولى\n` +
        `• بعد السنة الثانية\n` +
        `• حتى بعد التخرج (formation continue)\n\n` +
        `⚠️ **حاجات لازم تعرفهم:**\n` +
        `• بعض الشعب فيها إمكانية إعادة التوجيه\n` +
        `• قد تحتاج تعيد سنة\n` +
        `• المهم هو ما تضيعش الوقت\n\n` +
        `💡 **نصيحتي:** جرب تفهم الميادين اللي مهتم بيهم قبل ما تقرر!`
    }

    if (msg.includes("اعلامية") || msg.includes("informatique") || msg.includes("info")) {
      return `🖥️ **الإعلامية/Informatique**\n\n` +
        `📌 **شنّا هي؟**\n` +
        `دراسة البرمجة، الخوارزميات، قواعد البيانات، و تطوير التطبيقات.\n\n` +
        `📌 **المعدل المطلوب:**\n` +
        `• معدل ممتاز: 14+ (وضع مريح)\n` +
        `• معدل متوسط: 12-14 (ممكن بتحضير)\n` +
        `• معدل أقل من 12: يحتاج مجهود إضافي\n\n` +
        `📌 **المستقبل المهني:**\n` +
        `• Développeur (Web, Mobile, Desktop)\n` +
        `• Data Scientist\n` +
        `• DevOps Engineer\n` +
        `• Chef de projet\n` +
        `• Freelance / Entrepreneur\n\n` +
        `💡 **Salaire débutant:** 1500-2500DT\n` +
        `💡 **Salaire expérimenté:** 3000-6000DT+`
    }

    if (msg.includes("طب") || msg.includes("medecine") || msg.includes("médecine")) {
      return `⚕️ **الطب/Médecine**\n\n` +
        `📌 **شنّا هي؟**\n` +
        `دراسة العلوم الطبية، التشريح، الأمراض، و علاج المرضى.\n\n` +
        `📌 **المعدل المطلوب:**\n` +
        `• معدل ممتاز: 16+ (طريق واضح)\n` +
        `• معدل جيد: 14-16 (يحتاج تركيز)\n` +
        `• أقل من 14: تحدي كبير\n\n` +
        `📌 **المسار:**\n` +
        `• 7 سنوات دراسة (PCEM + DCEM + Internat)\n` +
        `• تخصص (3-5 سنوات إضافية)\n\n` +
        `📌 **المستقبل:**\n` +
        `• Médecin généraliste\n` +
        `• Médecin spécialiste\n` +
        `• Chercheur\n` +
        `• Secteur privé\n\n` +
        `💡 **ملاحظة:** الطريق طويل لكن المجزي كبير!`
    }

    if (msg.includes("هندسة") || msg.includes("ingénieur") || msg.includes("ingenieur") || msg.includes("engineering")) {
      return `⚙️ **الهندسة/Ingénierie**\n\n` +
        `📌 **شنّا هي؟**\n` +
        `تطبيق العلوم الرياضية و الفيزيائية لتصميم و بناء الحلول.\n\n` +
        `📌 **التخصصات:**\n` +
        `• Génie Industriel\n` +
        `• Génie Électrique\n` +
        `• Génie Civil\n` +
        `• Génie Mécanique\n` +
        `• و غيرهم...\n\n` +
        `📌 **المعدل المطلوب:**\n` +
        `• 14+ : وضع جيد\n` +
        `• 12-14 : ممكن\n` +
        `• أقل من 12 : تحدي\n\n` +
        `📌 **المستقبل المهني:**\n` +
        `• Ingénieur d'études\n` +
        `• Ingénieur de production\n` +
        `• Chef de projet\n` +
        `• Consultant\n\n` +
        `💡 **Salaire:** 2000-4000DT débutant`
    }

    if (msg.includes("راتب") || msg.includes("salaire") || msg.includes("فلوس") || msg.includes("argent")) {
      return `💰 **الرواتب في تونس حسب المجالات:**\n\n` +
        `🖥️ **الإعلامية:**\n` +
        `• Débutant: 1500-2500DT\n` +
        `• Confirmé: 3000-5000DT\n` +
        `• Senior/Lead: 5000-8000DT+\n\n` +
        `⚙️ **الهندسة:**\n` +
        `• Débutant: 1800-2800DT\n` +
        `• Confirmé: 3500-5500DT\n` +
        `• Senior: 6000DT+\n\n` +
        `⚕️ **الطب:**\n` +
        `• Interne: 1500-2000DT\n` +
        `• Médecin: 3000-8000DT\n` +
        `• Spécialiste privé: 10000DT+\n\n` +
        `💡 **ملاحظة:** الرواتب تختلف حسب الخبرة، الشركة، و المهارات!`
    }

    if (msg.includes("مهارة") || msg.includes("compétence") || msg.includes("skill") || msg.includes("skills")) {
      return `📚 **الـ Skills المهمة حسب المجال:**\n\n` +
        `🖥️ **الإعلامية:**\n` +
        `• Programming (Python, Java, JS)\n` +
        `• Algorithmique\n` +
        `• Bases de données\n` +
        `• Git & GitHub\n` +
        `• Soft skills (communication)\n\n` +
        `⚙️ **الهندسة:**\n` +
        `• Mathématiques appliquées\n` +
        `• Physique\n` +
        `• CAO/DAO\n` +
        `• Gestion de projet\n\n` +
        `🌟 **Skills عامة مهمة:**\n` +
        `• العمل الجماعي\n` +
        `• حل المشاكل\n` +
        `• التعلم المستمر\n` +
        `• اللغات (Français, English)`
    }

    if (msg.includes("شكرا") || msg.includes("merci") || msg.includes("يسلمو")) {
      return `🙏 **العفو!**\n\n` +
        `دايما موجود باش نجاوبك على أي سؤال.\n\n` +
        `💡 **تذكر:** النجاح يجي بالصبر و العمل المستمر.\n\n` +
        `ربي يوفقك في مسارك! 🌟`
    }

    return `🤔 **سؤال مثير للاهتمام!**\n\n` +
      `أنا هنا باش نعاونك في:\n` +
      `• التوجيه الجامعي\n` +
      `• اختيار الشعب\n` +
      `• فهم المعدلات\n` +
      `• النصائح و roadmap\n` +
      `• المستقبل المهني\n\n` +
      `جرب تسألني على حاجة محددة، مثلا:\n` +
      `• "نبدى منين؟"\n` +
      `• "الإعلامية صعيبة؟"\n` +
      `• "شنّا مستقبل الهندسة؟"\n` +
      `• "نجم نبدل شُعبتي؟"\n\n` +
      `💬 قلّي شنّا اللي تحب تعرف بالضبط؟`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessageContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return <div key={index} className="ml-4 flex items-start"><span className="mr-2">•</span><span dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} /></div>
      }
      if (/^\d+[.)]/.test(line)) {
        return <div key={index} className="ml-4"><span dangerouslySetInnerHTML={{ __html: formattedLine }} /></div>
      }
      if (/^[🎯💡📌👉🔥🌟💰📚🔄🤔🙏💬🐍🧠📖🏥🔧📐✅⚠️👋🤖📊🖥️⚙️⚕️]/.test(line) && line.includes("**")) {
        return <div key={index} className="font-bold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      }
      if (line.trim() === "") {
        return <br key={index} />
      }
      return <div key={index} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
    })
  }

  if (!actualIsOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
      >
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <span className="font-bold hidden md:inline">المساعد الذكي</span>
        </div>
        {!hasWelcomed && studentData && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[600px] bg-[#1e293b] rounded-2xl shadow-2xl flex flex-col z-50 border border-[#334155]">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">المساعد الذكي</h3>
            <p className="text-xs text-white/80">AI Orientation Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMessages([])
              setHasWelcomed(false)
            }}
            className="text-white/70 hover:text-white transition-colors"
            title="إعادة المحادثة"
          >
            <Sparkles size={16} />
          </button>
          <button
            onClick={() => {
              if (onClose) onClose()
              else setIsOpen(false)
            }}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            <Bot size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t?.empty_intro || '👋 أهلا بيك! أنا المساعد الذكي تاع التوجيه'}</p>
            <p className="text-sm mt-2">{t?.welcome_intro || 'قلّي شنّا اللي تحب تعرف؟'}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-[fadeIn_0.3s_ease-out]`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-[#334155] text-gray-100 rounded-bl-md"
              }`}
            >
              <div className="flex items-start gap-2">
                {msg.role === "assistant" && (
                  <Bot size={16} className="mt-1 flex-shrink-0 opacity-70" />
                )}
                <div className="text-sm leading-relaxed break-words">
                  {formatMessageContent(msg.content)}
                </div>
                {msg.role === "user" && (
                  <User size={16} className="mt-1 flex-shrink-0 opacity-70" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-[#334155] p-3 rounded-2xl rounded-bl-md flex items-center gap-2">
              <Loader2 size={18} className="animate-spin text-blue-400" />
              <span className="text-sm text-gray-300">{t?.loading_text || 'جاري الكتابة...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#334155]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t?.input_placeholder || 'اكتب رسالتك...'}
            className="flex-1 bg-[#0f172a] text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            dir="auto"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
