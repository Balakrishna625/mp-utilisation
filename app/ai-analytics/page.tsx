'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Zap, TrendingUp, Users, BarChart3, Trash2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAnalyticsPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize messages on client side only to avoid hydration errors
  useEffect(() => {
    setMounted(true)
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI Analytics assistant. I can help you analyze employee utilization data, project metrics, and generate insights. What would you like to know?',
        timestamp: new Date()
      }
    ])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response (will be replaced with Bedrock integration)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a placeholder response. Bedrock integration will be added soon to provide real AI-powered analytics based on your data.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI Analytics assistant. I can help you analyze employee utilization data, project metrics, and generate insights. What would you like to know?',
        timestamp: new Date()
      }
    ])
  }

  const suggestedQuestions = [
    { icon: TrendingUp, text: 'What are the utilization trends this quarter?' },
    { icon: Users, text: 'Which employees have the highest utilization?' },
    { icon: BarChart3, text: 'Show me project distribution by region' },
    { icon: Zap, text: 'Identify resources with low utilization' }
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-text-secondary">Loading AI Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-surface-light bg-surface px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent via-primary to-secondary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">AI Analytics</h1>
              <p className="text-text-secondary">Powered by AWS Bedrock</p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-light hover:bg-surface-lighter text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {messages.length === 1 && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="grid grid-cols-2 gap-4 mt-8">
                {suggestedQuestions.map((question, idx) => {
                  const Icon = question.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => setInput(question.text)}
                      className="p-4 bg-surface border border-surface-light rounded-xl hover:border-primary/50 hover:shadow-lg transition-all text-left group"
                    >
                      <Icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-text-primary text-sm font-medium">{question.text}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${message.role === 'user' ? 'w-auto' : 'w-full'}`}>
                <div className="flex items-start space-x-3">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div
                      className={`px-6 py-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-surface-light text-text-primary'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      {mounted && (
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-200' : 'text-text-muted'
                        }`} suppressHydrationWarning>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">U</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-3xl w-full">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="px-6 py-4 rounded-2xl bg-surface border border-surface-light">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-surface-light bg-surface px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your data... (Press Enter to send, Shift+Enter for new line)"
                rows={3}
                className="w-full px-6 py-4 pr-14 bg-surface-light border border-surface-light rounded-2xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`absolute right-3 bottom-3 p-3 rounded-xl transition-all ${
                  input.trim() && !isTyping
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30'
                    : 'bg-surface-lighter text-text-muted cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted text-xs mt-3 text-center">
              AI Analytics is powered by AWS Bedrock. Integration coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
