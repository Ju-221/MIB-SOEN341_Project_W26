import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import Card from './Card'
import Aurora from './Background'
import fakeRecipes from './fakeRecipes' // Remove this when real API is available

interface Recipe {
  id: number
  title: string
  description: string
  prepTime: number
  cookTime: number
  estimatedCost: number
  heroImage: string | null
  categories: string[]
}

const fireConfetti = () => {
  const end = Date.now() + 3 * 1000
  const colors = ['#00ff75', '#B19EEF', '#5227FF', '#7cff67', '#ffffff']
  const frame = () => {
    if (Date.now() > end) return
    confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors })
    confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors })
    requestAnimationFrame(frame)
  }
  frame()
}

const Unique: React.FC = () => {
  const [pool, setPool] = useState<Recipe[]>([])
  const [slots, setSlots] = useState<[Recipe | null, Recipe | null]>([null, null])
  const [fadingSlot, setFadingSlot] = useState<0 | 1 | null>(null)
  const [winner, setWinner] = useState<Recipe | null>(null)

  useEffect(() => {
    // loadRecipes() // Uncomment this when real API is available
    const shuffled = [...(fakeRecipes as Recipe[])].sort(() => Math.random() - 0.5)
    setSlots([shuffled[0], shuffled[1]])
    setPool(shuffled.slice(2))
  }, [])

  const handleChoose = (chosenIndex: 0 | 1) => {
    if (fadingSlot !== null) return // block clicks during animation

    const discardIndex = (1 - chosenIndex) as 0 | 1

    if (pool.length === 0) {
      setWinner(slots[chosenIndex]!)
      fireConfetti()
      return
    }

    const poolCopy = [...pool]
    const replaceIdx = Math.floor(Math.random() * poolCopy.length)
    const replacement = poolCopy[replaceIdx]
    const newPool = poolCopy.filter((_, i) => i !== replaceIdx)

    setFadingSlot(discardIndex)

    setTimeout(() => {
      setSlots(prev => {
        const next: [Recipe | null, Recipe | null] = [prev[0], prev[1]]
        next[discardIndex] = replacement
        return next
      })
      setPool(newPool)
      setFadingSlot(null)
    }, 500)
  }

  const aurora = (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Aurora colorStops={['#7cff67', '#B19EEF', '#5227FF']} blend={0.5} amplitude={1.5} speed={0.5} />
    </div>
  )

  if (winner) {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {aurora}
        <div className="winner-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ height: '60vh' }}>
            <Card {...winner} />
          </div>
          <p className="winner-label">
            It looks like you've been craving <strong>{winner.title}</strong>... Time to cook!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {aurora}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: '40px',
          alignItems: 'flex-start',
          paddingTop: '16px',
        }}
      >
        {([0, 1] as const).map(i => (
          <div key={i} className={`card-slot${fadingSlot === i ? ' fading' : ''}`}>
            <div style={{ height: '70vh' }}>
              {slots[i] && <Card {...slots[i]!} />}
            </div>
            <button
              className="choose-btn"
              onClick={() => handleChoose(i)}
              disabled={fadingSlot !== null}
            >
              Choose!
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Unique
