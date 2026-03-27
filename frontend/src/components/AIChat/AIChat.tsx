import React, { useState, useEffect, useRef } from 'react'
import Aurora from '../Unique/Background'
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
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Shared Aurora background — same component as Unique feature */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Aurora colorStops={['#7cff67', '#B19EEF', '#5227FF']} blend={0.5} amplitude={1.5} speed={0.5} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <p className="aichat-title">✦ AI Recipe Chef</p>

      <div className="aichat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`aichat-bubble-row aichat-bubble-row--${msg.role}`}>
            <div className={`aichat-bubble aichat-bubble--${msg.role}`}>
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
          rows={1}
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
