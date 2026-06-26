import { useState, useEffect } from 'react'
import { Sparkles, Send, MessageSquare, X } from 'lucide-react'

interface AIAssistantProps {
  onOpen?: () => void;
  suggestions?: string[];
}

export function AIAssistant({ suggestions = [] }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant'; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mockResponses: Record<string, string> = {
    'revenue': 'Your total revenue this week is ₦451,000 (gross). After 8% commission, you\'ve earned ₦414,920. Best day: Saturday with ₦95,000.',
    'fuel': 'One vehicle needs attention: KJA 008 MN (Chidi Okafor\'s Hiace) is at 25% fuel. Recommend refueling before the Lagos–Abuja trip.',
    'drivers': 'You have 4 drivers: 3 verified (Akin: 142 trips, Chidi: 98 trips, Funke: 67 trips) and 1 pending (Ibrahim). Best rated: Funke (4.9⭐).',
    'routes': 'Your most profitable routes: Lagos–Abuja (₦154K gross), Lagos–Ibadan (₦60K gross). Average occupancy: 76%.',
    'verification': 'Pending items: KJA 008 MN rear photo, ABJ 445 EF insurance & rear photo. Approve within 7 days to keep vehicles active.',
    'occupancy': 'Average trip occupancy this week: 76%. Highest: Ibadan–Lagos run (18/30 seats). Lagos–Abuja runs fully booked.',
    'payout': 'Your next payout is due 1 July (₦47,300 pending). Previous payouts: 24 Jun (₦38,000 ✓), 17 Jun (₦52,400 ✓).',
  };

  const findMatchingResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();
    for (const [key, response] of Object.entries(mockResponses)) {
      if (query.includes(key)) return response;
    }
    return 'I can help you with fleet management, revenue tracking, driver info, route analytics, document verification, occupancy stats, and payout details. What would you like to know?';
  };

  const handleSendMessage = () => {
    if (!query.trim()) return;

    const userMessage = { type: 'user' as const, text: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    setTimeout(() => {
      const response = findMatchingResponse(query);
      setMessages(prev => [...prev, { type: 'assistant', text: response }]);
      setIsLoading(false);
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setTimeout(() => {
      const userMessage = { type: 'user' as const, text: suggestion };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      setTimeout(() => {
        const response = findMatchingResponse(suggestion);
        setMessages(prev => [...prev, { type: 'assistant', text: response }]);
        setIsLoading(false);
      }, 800);
    }, 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 w-14 h-14 bg-[#A7C957] hover:bg-[#A7C957]/90 rounded-full flex items-center justify-center shadow-float text-primary-500 z-40 transition-all hover:scale-110"
        aria-label="AI Assistant"
      >
        <Sparkles className="w-6 h-6 fill-current" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 lg:bottom-8 lg:right-8 lg:w-96 lg:h-[600px] lg:top-auto lg:inset-auto bg-black/50 lg:bg-transparent z-50 flex items-end lg:items-stretch">
      <div className="w-full lg:rounded-2xl bg-white lg:shadow-float flex flex-col h-full lg:h-auto">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-400 px-4 py-4 flex items-center justify-between rounded-t-2xl lg:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm font-display">AI Assistant</p>
              <p className="text-primary-100 text-xs">Ask about your fleet</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-primary-75 min-h-0 flex flex-col justify-between">
          {messages.length === 0 ? (
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-neutral-600 text-sm mb-4 font-medium">Suggested questions:</p>
                <div className="space-y-2">
                  {suggestions.slice(0, 4).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-3 bg-white hover:bg-primary-50 rounded-xl text-sm text-neutral-700 hover:text-primary-500 transition-colors border border-primary-100 hover:border-primary-300"
                    >
                      <MessageSquare className="w-4 h-4 inline mr-2 text-[#A7C957]" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.type === 'user' ? 'bg-primary-500 text-white rounded-br-none' : 'bg-white text-neutral-700 rounded-bl-none border border-primary-100'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border-t border-primary-100 p-3 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2.5 bg-primary-75 border border-primary-100 rounded-xl text-sm focus:outline-none focus:border-accent-300 focus:ring-1 focus:ring-accent-300"
            />
            <button
              onClick={handleSendMessage}
              disabled={!query.trim() || isLoading}
              className="w-10 h-10 bg-[#A7C957] hover:bg-[#A7C957]/90 disabled:opacity-50 rounded-xl flex items-center justify-center text-primary-500 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
