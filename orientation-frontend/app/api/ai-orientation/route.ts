import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tScore, lastYearScore, probability, filiereName, bacType } = body

    // Build smart prompt
    const prompt = `You are a university orientation assistant in Tunisia.

Student:
* Bac: ${bacType}
* T Score: ${tScore}
* Last Year Score: ${lastYearScore}
* Probability: ${probability}%

Filiere: ${filiereName}

Instructions:
* If probability > 70% → say it's a good chance
* If 40-70% → say it's possible but risky
* If < 40% → say it's difficult and suggest alternatives
* Suggest similar programs if needed
* Be realistic (no fake encouragement)
* Answer in Arabic or French only
* Do NOT use Tunisian dialect

Provide orientation advice:`

    // Connect to Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: prompt,
        stream: false,
      }),
    })

    if (!ollamaResponse.ok) {
      throw new Error('Ollama API not available')
    }

    const ollamaData = await ollamaResponse.json()

    return NextResponse.json({
      result: ollamaData.response,
    })
  } catch (error) {
    console.error('AI Orientation API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI recommendation' },
      { status: 500 }
    )
  }
}