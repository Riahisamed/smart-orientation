'use client';

import { useState, useEffect, useRef } from 'react';

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعد الذكاء الاصطناعي الخاص بك. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    
    // محاكاة رد الذكاء الاصطناعي - يمكن استبداله بواجهة برمجة تطبيقات حقيقية
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'شكراً على رسالتك! هذا رد تجريبي، يمكنك توصيل هذا المكون بخدمة الذكاء الاصطناعي الفعلية لاحقاً.' 
      }]);
    }, 1000);
  };

  return (
    <>
      {/* زر الدردشة العائق */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 
        flex items-center justify-center shadow-lg shadow-blue-500/30
        hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-4 focus:ring-blue-500/30
        dark:from-blue-500 dark:to-indigo-500 dark:shadow-blue-500/20
        ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        aria-label="فتح دردشة الذكاء الاصطناعي"
      >
        <span className="text-2xl">🤖</span>
      </button>

      {/* مودال الدردشة */}
      <div 
        className={`fixed z-50 transition-all duration-300 ease-out
        sm:bottom-6 sm:right-6 sm:w-[350px] sm:h-[500px] sm:rounded-2xl
        bottom-0 right-0 left-0 w-full h-[85vh] sm:max-h-[90vh]
        bg-white dark:bg-slate-900 shadow-2xl
        flex flex-col
        ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        {/* رأس المودال */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span>🤖</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">مساعد الذكاء الاصطناعي</h3>
              <p className="text-xs text-green-500">متصل الآن</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center
            hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="إغلاق"
          >
            <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* منطقة الرسائل */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm
                ${message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow rounded-bl-none'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* مربع الإدخال */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 
              text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500
              placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm"
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700
              flex items-center justify-center transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}