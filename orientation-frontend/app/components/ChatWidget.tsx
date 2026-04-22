'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Select } from '@/lib/components/ui/select';
import { Label } from '@/lib/components/ui/label';
import { ChatMessage, BacType, ProgramClassification } from '@/lib/types/ai';

const BAC_TYPES: BacType[] = ['MATH', 'SVT', 'ECO', 'TECH', 'INFO', 'LETTRES', 'SPORT'];

interface MessageWithPrograms extends ChatMessage {
  programs?: ProgramClassification;
}

interface ChatWidgetProps {
  onClose?: () => void;
  hideHeader?: boolean;
}

export default function ChatWidget({ onClose, hideHeader = false }: ChatWidgetProps) {
  const [messages, setMessages] = useState<MessageWithPrograms[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [score, setScore] = useState<string>('');
  const [bac, setBac] = useState<BacType>('MATH');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages) as MessageWithPrograms[];
        const normalized = parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(normalized);
        setChatStarted(true);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !score || isLoading) return;

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0) {
      alert('Please enter a valid score');
      return;
    }

    setChatStarted(true);

    const userMessage: MessageWithPrograms = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending message:', inputMessage);

      const res = await fetch('http://localhost:3001/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
        }),
      });

      const data = await res.json();
      console.log('Response:', data);

      if (res.ok && data.reply) {
        const assistantMessage: MessageWithPrograms = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: MessageWithPrograms = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get response'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Network error:', error);
      const errorMessage: MessageWithPrograms = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
    setChatStarted(false);
  };

  const renderProgramCategory = (
    title: string,
    programs: any[],
    icon: string,
    color: string,
  ) => {
    if (!programs || programs.length === 0) return null;

    return (
      <div key={title} className={`mt-4 p-3 rounded-lg border-l-4 ${color}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold">{title}</h4>
          <span className="text-xs bg-gray-300 dark:bg-gray-700 rounded-full px-2 py-1">
            {programs.length}
          </span>
        </div>
        <ul className="space-y-1 text-sm">
          {programs.map((prog: any, idx: number) => (
            <li key={idx} className="pl-4 border-l border-gray-300 dark:border-gray-600">
              <div className="font-medium">{prog.program}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {prog.institution} • Score: {prog.lastScore || 'N/A'}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const suggestedQuestions = {
    fr: ['Quels programmes me convient le mieux?', 'Quels sont mes meilleures chances?', 'Que dois-je améliorer?'],
    ar: ['ما هي أفضل برامج لي؟', 'ما هي فرصي الحقيقية؟', 'ماذا يجب أن أفعل الآن؟'],
  };

  const containerClasses = hideHeader
    ? 'h-full bg-white dark:bg-gray-900 p-3'
    : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4';

  const wrapperClasses = hideHeader ? 'h-full flex flex-col gap-4' : 'max-w-4xl mx-auto space-y-4';

  const messageWrapperClasses = hideHeader
    ? 'flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'
    : 'space-y-4 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700';

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        {!hideHeader ? (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">🎓 AI Orientation Assistant</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Get intelligent recommendations for your university path
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back</Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <span>🤖</span>
              <span>AI Assistant</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              X
            </button>
          </div>
        )}

        {!chatStarted && (
          <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Start Your Orientation Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Tell us about yourself to get personalized recommendations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="score" className="font-semibold">
                    Your Score
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="200"
                    step="0.5"
                    placeholder="e.g., 150.5"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="bac" className="font-semibold">
                    Bac Type
                  </Label>
                  <Select value={bac} onChange={(e) => setBac(e.target.value as BacType)}>
                    {BAC_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language" className="font-semibold">
                    Language
                  </Label>
                  <Select value={language} onChange={(e) => setLanguage(e.target.value as 'fr' | 'ar')}>
                    <option value="fr">Français 🇫🇷</option>
                    <option value="ar">العربية 🇹🇳</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {chatStarted && (
          <div className="flex gap-2 items-end bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Score: {score} • Bac: {bac} • {language === 'ar' ? '🇹🇳' : '🇫🇷'}
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat}>
              Clear Chat
            </Button>
          </div>
        )}

        <div className={messageWrapperClasses}>
          {!chatStarted ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                💬 No messages yet. Fill in your details and ask a question to get started!
              </p>
              <div className="space-y-2">
                {suggestedQuestions[language].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputMessage(q);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="block w-full text-left p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition text-sm text-gray-700 dark:text-gray-300"
                  >
                    📌 {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                    {msg.programs && msg.role === 'assistant' && (
                      <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-4">
                        {renderProgramCategory(
                          language === 'ar' ? '🟢 البرامج الآمنة' : '🟢 Safe Programs',
                          msg.programs.safe,
                          '✅',
                          'border-green-400 bg-green-50 dark:bg-green-900/20',
                        )}
                        {renderProgramCategory(
                          language === 'ar' ? '🟡 البرامج الممكنة' : '🟡 Possible Programs',
                          msg.programs.possible,
                          '⚠️',
                          'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
                        )}
                        {renderProgramCategory(
                          language === 'ar' ? '🔴 البرامج الصعبة' : '🔴 Difficult Programs',
                          msg.programs.hard,
                          '❌',
                          'border-red-400 bg-red-50 dark:bg-red-900/20',
                        )}
                      </div>
                    )}

                    <div className="text-xs mt-2 opacity-70">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
          {!chatStarted && score && (
            <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
              ✅ Ready to start! Ask me anything about your university path.
            </div>
          )}
          {chatStarted && !score && (
            <div className="text-xs text-red-600 dark:text-red-400">
              ⚠️ Please fill in your score above before sending a message
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'اسأل أي سؤال عن مسارك الجامعي...'
                  : 'Ask any question about your university path...'
              }
              disabled={isLoading || !score}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || !score}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? '⏳' : '📤'} {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Be specific about what you want to know - career paths, program difficulty, or admission chances.
          </p>
        </form>
      </div>
    </div>
  );
}
