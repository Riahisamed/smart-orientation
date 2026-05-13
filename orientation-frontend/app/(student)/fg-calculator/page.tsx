"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "@/lib/components/ui/card"
import { Input } from "@/lib/components/ui/input"
import { Button } from "@/lib/components/ui/button"
import { Label } from "@/lib/components/ui/label"
import { API_BASE_URL } from "@/lib/api/config"

const bacSubjects:any = {

math:["MG","Math","Physics","SVT","French","English"],
svt:["MG","Math","Physics","SVT","French","English"],
eco:["MG","Economy","Gestion","Math","HistoryGeo","French","English"],
lettres:["MG","Arabic","Philosophy","HistoryGeo","French","English"],
tech:["MG","Tech","Math","Physics","French","English"],
info:["MG","Math","Algo","Physics","STI","French","English"],
sport:["MG","BioSport","Sport","EP","Physics","Philosophy","French","English"]

}

export default function FGCalculator(){

const [bacType,setBacType] = useState("math")
const [mode,setMode] = useState("principale")
const [values,setValues] = useState<any>({})
const [fg,setFG] = useState<number | null>(null)

const router = useRouter()

const subjects = bacSubjects[bacType]

//////////////////////////////////////////////////
// 🔥 HANDLE INPUT
//////////////////////////////////////////////////

const handleChange = (subject:string,value:number)=>{

setValues({
...values,
[subject]:value
})

}

//////////////////////////////////////////////////
// 🔥 CALCULATE
//////////////////////////////////////////////////

const calculate = async () => {

  const token = localStorage.getItem("token")

  const formattedBacType = bacType.toUpperCase()

//////////////////////////////////////////////////
// 🔥 BUILD BODY DYNAMIC
//////////////////////////////////////////////////

const body:any = {
  bacType: formattedBacType,
  bacAverage: values["MG"] ?? 0
}

// mapping
const map:any = {
  Math:"math",
  Physics:"physics",
  SVT:"svt",
  French:"french",
  English:"english",
  Economy:"economy",
  Gestion:"gestion",
  HistoryGeo:"historyGeo",
  Arabic:"arabic",
  Philosophy:"philosophy",
  Tech:"tech",
  Algo:"algo",
  STI:"sti",
  BioSport:"bioSport",
  Sport:"spSport",
  EP:"physEd"
}

// 🔥 loop subjects
subjects.forEach((s:string)=>{

const key = map[s]

if(!key) return

if(mode === "controle"){

  body[key+"Main"] = values[s] ?? 0
  body[key+"Control"] = values[s+"_control"] ?? 0

}else{

  body[key] = values[s] ?? 0

}

})

//////////////////////////////////////////////////
// 🔥 CALL API FG
//////////////////////////////////////////////////

const endpoint = mode === "controle"
? `${API_BASE_URL}/student/calculate-fg-controle`
: `${API_BASE_URL}/student/calculate-fg`

const fgRes = await fetch(endpoint,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(body)
  })

  const fgData = await fgRes.json()

  setFG(fgData.FG)

//////////////////////////////////////////////////
// 🔥 CREATE STUDENT
//////////////////////////////////////////////////

await fetch(`${API_BASE_URL}/student/update`,{
  method:"PUT",
  headers:{
    "Content-Type":"application/json",
    Authorization:`Bearer ${token}`
  },
  body:JSON.stringify({
    ...body,
    FG: fgData.FG
  })
})

  localStorage.setItem("FG", fgData.FG)

}

//////////////////////////////////////////////////
// UI
//////////////////////////////////////////////////

 return(

 <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

   <div className="mx-auto max-w-3xl space-y-6">
   
     <Button 
       variant="outline" 
       className="mb-4 rounded-xl"
       onClick={()=>router.push("/dashboard")}
     >
       ← Back to Dashboard
     </Button>

     <div className="space-y-3">
       <p className="text-sm uppercase tracking-[0.3em] text-blue-600">FG Calculator</p>
       <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Calculate your final FG score</h1>
       <p className="text-sm text-slate-500 dark:text-slate-400">Enter your bac inputs and get your FG score instantly.</p>
     </div>

     <Card className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-300/20 dark:border-slate-800 dark:bg-slate-900/95">
       <CardContent className="p-6 space-y-6">
         
         <div className="space-y-2">
           <Label>Bac Type</Label>
           <select
             value={bacType}
             onChange={(e)=>setBacType(e.target.value)}
             className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
           >
             <option value="math">Math</option>
             <option value="svt">SVT</option>
             <option value="eco">Eco</option>
             <option value="lettres">Lettres</option>
             <option value="tech">Tech</option>
             <option value="info">Info</option>
             <option value="sport">Sport</option>
           </select>
         </div>

         <div className="flex gap-3">
           <Button
             variant={mode === "principale" ? "default" : "outline"}
             className="flex-1 rounded-xl"
             onClick={()=>setMode("principale")}
           >
             Principale
           </Button>

           <Button
             variant={mode === "controle" ? "default" : "outline"}
             className="flex-1 rounded-xl"
             onClick={()=>setMode("controle")}
           >
             Controle
           </Button>
         </div>

         <div className="space-y-4">
           {subjects.map((s:any,i:number)=>(

             <div key={i} className="space-y-2">

               <Label>{s}</Label>

               <Input
                 className="rounded-xl"
                 placeholder={s+" principale"}
                 type="number"
                 onChange={(e)=>handleChange(s,Number(e.target.value))}
               />

               {mode==="controle" && (
                 <Input
                   className="rounded-xl mt-2"
                   placeholder={s+" controle"}
                   type="number"
                   onChange={(e)=>handleChange(s+"_control",Number(e.target.value))}
                 />
               )}

             </div>

           ))}
         </div>

         <Button
           onClick={calculate}
           className="w-full rounded-2xl py-3 mt-4"
         >
           Calculate FG
         </Button>

         {fg !== null && (

           <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/50">

             <p className="text-sm text-blue-600 dark:text-blue-400">FG Score</p>

             <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mt-2">
               {fg.toFixed(2)}
             </p>

           </div>

         )}

       </CardContent>
     </Card>

   </div>

 </div>

 )

}
