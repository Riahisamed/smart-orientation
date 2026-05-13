"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/lib/components/ui/card"
import { Input } from "@/lib/components/ui/input"
import { Button } from "@/lib/components/ui/button"
import { Label } from "@/lib/components/ui/label"
import { Select } from "@/lib/components/ui/select"
import { API_BASE_URL } from "@/lib/api/config"

function TCalculatorContent(){
  const [userScore, setUserScore] = useState<number | null>(null)
  const [acceptanceProbability, setAcceptanceProbability] = useState<number | null>(null)
  const [probabilityColor, setProbabilityColor] = useState<string>("gray")
  const [student, setStudent] = useState<any>(null)

  const searchParams = useSearchParams()
  const filiereId = searchParams.get("filiereId")

  const [formula,setFormula] = useState("")
  const [filiere,setFiliere] = useState<any>(null)

  const [values,setValues] = useState<any>({
    FG:0
  })

  const [T,setT] = useState<number | null>(null)

  const [aiRecommendation, setAiRecommendation] = useState<string>("")
  const [aiLoading, setAiLoading] = useState<boolean>(false)

  //////////////////////////////////////////////////
  // 🔥 extract subjects from formula
  //////////////////////////////////////////////////
  const getSubjectsFromFormula = (formula: string) => {
    if (!formula) return []

    // Extract variables using improved regex
    const matches = formula.match(/\b[A-Za-z]+\b/g) || []

    // Force uppercase normalization
    const variables = [...new Set(matches.map(v => v.toUpperCase()))]

    // Map variables to normalized subject keys using the exact formula variable names
    const variableToKey: Record<string, string> = {
      FG: 'FG',
      M: 'M',
      ANG: 'ANG',
      AR: 'AR',
      HG: 'HG',
      PH: 'PH',
      F: 'F',
      ESP: 'ESP',
      IT: 'IT',
      ALL: 'ALL',
      SP: 'SP',
      INFO: 'INFO',
      TECH: 'TECH',
      ECON: 'ECON',
      GESTION: 'GESTION',
      SVT: 'SVT',
      TE: 'TE',
      INF: 'INFO',
      SPT: 'SP',
      FR: 'F',
    }

    // Return array of {variable, key}, exclude FG since it's separate
    const result = variables.filter(v => v !== 'FG').map(v => ({ variable: v, key: variableToKey[v] })).filter(item => item.key)

    return result
  }
  //////////////////////////////////////////////////
  // 🔥 fetch filiere
  //////////////////////////////////////////////////
  useEffect(()=>{
    // جلب بيانات الطالب ونوع الباك
    const token = localStorage.getItem("token")
    fetch(`${API_BASE_URL}/student/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setStudent(data)
    })

    if(!filiereId) return

    fetch(`${API_BASE_URL}/filiere/${filiereId}`)
    .then(res => res.json())
    .then(data => {
      setFiliere(data)
      setFormula(data.formula)
    })

  },[filiereId])

  useEffect(() => {
    const saved = localStorage.getItem("aiRecommendation")
    if (saved) {
      setAiRecommendation(saved)
    }
  }, [])

  //////////////////////////////////////////////////
  // 🔥 calculate T
  //////////////////////////////////////////////////
  const calculate = () => {
    const fg = Number(values.FG ?? 0)
    const m = Number(values.M ?? 0)
    const sp = Number(values.SP ?? 0)
    const info = Number(values.INFO ?? 0)

    const calculatedT = calculateT()
    if (calculatedT === null) return

    setT(calculatedT)
    calculateProbability(calculatedT)
  }

  const calculateT = () => {
    if (!filiere || !formula) return null

    const normalizedFormula = formula
      .replace(/\s+/g, '')
      .replace(/inf\b/gi, 'INFO')
      .replace(/info\b/gi, 'INFO')
      .toUpperCase()

    const coefficientFormula = normalizedFormula
      .replace(/(\d)(?=[A-Z(])/g, '$1*')
      .replace(/([A-Z)])(?=\()/g, '$1*')

    const expression = coefficientFormula.replace(/\b([A-Z]+)\b/g, (match) => {
      if (match === 'MAX' || match === 'MIN') {
        return match.toLowerCase()
      }
      const value = Number(values[match] ?? 0)
      return String(value)
    })

    try {
      const result = Function(`"use strict"; return (${expression})`)()
      if (typeof result !== 'number' || Number.isNaN(result)) return null

      let score = result
      if (values.sameGov) {
        score = score * 1.07
      }

      return Number(score.toFixed(2))
    } catch (error) {
      console.error('Failed to evaluate formula:', formula, error)
      return null
    }
  }

  const getLastScoreValue = () => {
    if (!filiere || !student || !student.bacType) return null
    
    // ✅ البحث في جدول النقاط بناءً على نوع باك الطالب
    const userBacType = student.bacType.trim().toUpperCase()
    
    const score = filiere.scores?.find((s: any) => {
      if (!s.bacType) return false
      return s.bacType.trim().toUpperCase() === userBacType
    })
    
    return score?.lastScore ?? null
  }

  const calculateProbability = (tScore: number | null = T) => {
    if (!filiere || tScore === null) return

    const lastScore = getLastScoreValue()
    if (lastScore === null) return

    let probability = 10
    let color = "red"

    if (tScore >= lastScore + 10) {
      probability = 90
      color = "green"
    } else if (tScore >= lastScore) {
      probability = 70
      color = "yellow"
    } else if (tScore >= lastScore - 5) {
      probability = 40
      color = "orange"
    }

    setAcceptanceProbability(probability)
    setProbabilityColor(color)

    // ✅ Save comparison data to localStorage for Dashboard
    localStorage.setItem("comparisonData", JSON.stringify({
      tScore,
      lastScore,
      probability,
      filiereName: filiere.program
    }))
  }

  const askAI = async () => {
    if (!T || !filiere || !student) return

    setAiLoading(true)

    try {
      const res = await fetch("/api/ai-orientation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tScore: T,
          lastYearScore: getLastScoreValue(),
          probability: acceptanceProbability,
          filiereName: filiere.program,
          bacType: student.bacType
        })
      })

      const data = await res.json()

      if (data.result) {
        setAiRecommendation(data.result)
        localStorage.setItem("aiRecommendation", data.result)
      } else {
        setAiRecommendation("Error: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      setAiRecommendation("Error: Failed to connect to AI service")
    } finally {
      setAiLoading(false)
    }
  }

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////
   return(

   <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900">
     <div className="mx-auto max-w-4xl px-4 py-10">
       <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">T Score Calculator</h1>

       {!filiere ? (
         <p className="text-slate-600 dark:text-slate-400">Loading...</p>
       ) : (
         <>
           <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl transition-all duration-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 mb-6">
             <CardContent className="p-6 space-y-6">
               {/* 🎯 اسم الفاك */}
               <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                 {filiere.program}
               </p>

               {/* 🎯 الفورميل */}
               <div>
                 <Label className="text-sm text-slate-500 dark:text-slate-400">Formula</Label>
                 <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mt-1">{formula}</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                 {/* FG */}
                 <div className="space-y-2">
                   <Label>FG</Label>
                   <Input
                     className="rounded-xl"
                     placeholder="FG"
                     type="number"
                     value={values.FG}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues(prev => ({...prev, FG: Number(e.target.value)}))}
                   />
                 </div>

                 {/* dynamic subjects */}
                 {getSubjectsFromFormula(formula).map((item: any, i: number) => (
                   <div key={i} className="space-y-2">
                     <Label>{item.variable}</Label>
                     <Input
                       className="rounded-xl"
                       placeholder={item.variable}
                       type="number"
                       value={values[item.key] ?? 0}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues(prev => ({
                         ...prev,
                         [item.key]: Number(e.target.value)
                       }))}
                     />
                   </div>
                 ))}

               </div>

               <div className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   className="h-4 w-4 rounded border-slate-300 text-slate-900 dark:border-slate-600 dark:bg-slate-900"
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues({
                     ...values,
                     sameGov: e.target.checked
                   })}
                 />
                 <Label className="text-slate-700 dark:text-slate-300">نفس الولاية (+7%)</Label>
               </div>

               <Button
                 onClick={calculate}
                 className="w-full rounded-lg bg-blue-500 py-3 text-white transition hover:bg-blue-600 mt-4"
               >
                 Calculate T Score
               </Button>

               {/* RESULT */}
               {typeof T === "number" && (
                 <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/50">
                   <p className="text-sm text-blue-600 dark:text-blue-400">Your T Score</p>
                   <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                     {T.toFixed(2)}
                   </p>
                 </div>
               )}
             </CardContent>
           </Card>

           {/* Comparison Section */}
           <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl transition-all duration-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95">
             <CardContent className="p-6">
               <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Comparison</h2>

               {T !== null && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl transition-all duration-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95">
                     <CardContent className="p-4 text-center">
                       <h3 className="text-sm text-slate-500 dark:text-slate-400">Your Calculated T Score</h3>
                       <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{T.toFixed(2)}</p>
                     </CardContent>
                   </Card>

                <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl transition-all duration-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm text-slate-500 dark:text-slate-400">Filiere Last Year Score</h3>
                    <p className={`text-xl font-bold ${probabilityColor}-600 dark:${probabilityColor}-400 mt-1`}>
                      {getLastScoreValue() !== null ? getLastScoreValue().toFixed(2) : "N/A"}
                    </p>
                  </CardContent>
                </Card>

                   <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl transition-all duration-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95">
                     <CardContent className="p-4 text-center">
                       <h3 className="text-sm text-slate-500 dark:text-slate-400">Acceptance Probability</h3>
                       <p className={`text-xl font-bold ${probabilityColor}-600 dark:${probabilityColor}-400 mt-1`}>
                         {acceptanceProbability !== null ? `${acceptanceProbability}%` : "-"}
                       </p>
                     </CardContent>
                   </Card>
                 </div>
               )}
             </CardContent>
           </Card>

           {/* AI Recommendation Section */}
           <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl transition-all duration-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95">
             <CardContent className="p-6">
               <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">AI Recommendation</h2>

               <Button
                 onClick={askAI}
                 disabled={aiLoading || !T}
                 className="h-11 w-full rounded-xl mb-4"
               >
                 {aiLoading ? "Loading..." : "Ask AI"}
               </Button>

               {aiRecommendation && (
                 <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
                   <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-line">
                     {aiRecommendation}
                   </p>
                 </div>
               )}
             </CardContent>
           </Card>
         </>
       )}
     </div>
   </div>
   )
}

export default function TCalculator(){
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TCalculatorContent />
    </Suspense>
  )
}
