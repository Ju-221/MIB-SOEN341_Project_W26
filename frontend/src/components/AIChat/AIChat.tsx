import React, { useState, useEffect, useRef } from 'react'
import './AIChat.css'

interface Message {
  role: 'user' | 'model'
  text: string
}

const INITIAL_MESSAGE: Message = {
  role: 'model',
  text: "Hey there! I'm your AI recipe chef. Tell me what ingredients you have, any dietary preferences, or just the kind of dish you're in the mood for — and I'll whip up a brand new recipe just for you!",
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const updatedMessages: Message[] = [...messages, { role: 'user', text }]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!response.ok) throw new Error('Failed to reach AI service')

      const data = await response.json() as { reply: string }
      setMessages(prev => [...prev, { role: 'model', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong. Please try again!' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="aichat-page">
      <div className="aichat-container">
        <div className="aichat-header">
          <span className="aichat-header-icon">✦</span>
          <h2 className="aichat-header-title">AI Recipe Chef</h2>
          <p className="aichat-header-sub">Generate a brand new recipe from scratch</p>
        </div>

        <div className="aichat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`aichat-bubble-row ${msg.role === 'user' ? 'aichat-bubble-row--user' : 'aichat-bubble-row--model'}`}>
              <div className={`aichat-bubble ${msg.role === 'user' ? 'aichat-bubble--user' : 'aichat-bubble--model'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="aichat-bubble-row aichat-bubble-row--model">
              <div className="aichat-bubble aichat-bubble--model aichat-bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="aichat-input-row">
          <textarea
            className="aichat-input"
            placeholder="Describe what you're craving or list your ingredients..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
          />
          <button
            className="aichat-send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChat
