"use client"

import { usePathname, useRouter } from "next/navigation"

export default function Sidebar(){

const router = useRouter()
const pathname = usePathname()

if (pathname === "/login" || pathname === "/register") {
  return null
}
return(

<div style={{
width:"80px",
background:"#020617",
height:"100vh",
display:"flex",
flexDirection:"column",
alignItems:"center",
paddingTop:"30px",
gap:"30px"
}}>

<button onClick={()=>router.push("/dashboard")}>
🏠 </button>

<button onClick={()=>router.push("/fg-calculator")}>
🧮 </button>

<button onClick={()=>router.push("/t-calculator")}>
📊 </button>

<button onClick={()=>router.push("/orientation")}>
🧭 </button>

</div>

)

}
