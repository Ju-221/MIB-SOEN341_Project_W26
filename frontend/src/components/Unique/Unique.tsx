import React, { useState, useMemo } from 'react'
import confetti from 'canvas-confetti'
import Card from './Card'
import Aurora from './Background'
import fakeRecipes from './fakeRecipes' // Remove this when real API is available
import './Unique.css'

interface Recipe {
  id: number
  title: string
  description: string
  prepTime: number
  cookTime: number
  estimatedCost: number
  heroImage: string | null
  categories: string[]
  ingredients: string[]
}

type Phase = 'intro' | 'picker' | 'game'

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
  const [phase, setPhase] = useState<Phase>('intro')
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [pool, setPool] = useState<Recipe[]>([])
  const [slots, setSlots] = useState<[Recipe | null, Recipe | null]>([null, null])
  const [fadingSlot, setFadingSlot] = useState<0 | 1 | null>(null)
  const [winner, setWinner] = useState<Recipe | null>(null)

  const allIngredients = useMemo(() => {
    const set = new Set<string>()
    ;(fakeRecipes as Recipe[]).forEach(r => r.ingredients.forEach(i => set.add(i)))
    return [...set].sort()
  }, [])

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    )
  }

  const startGame = () => {
    let pool: Recipe[]
    if (selectedIngredients.length === 0) {
      pool = fakeRecipes as Recipe[]
    } else {
      // Keep only recipes that contain ALL selected ingredients
      const filtered = (fakeRecipes as Recipe[]).filter(r =>
        selectedIngredients.every(ing => r.ingredients.includes(ing))
      )
      // Fall back to all recipes if the selection is too narrow
      pool = filtered.length >= 4 ? filtered : (fakeRecipes as Recipe[])
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    setSlots([shuffled[0], shuffled[1]])
    setPool(shuffled.slice(2))
    setPhase('game')
  }

  const handleChoose = (chosenIndex: 0 | 1) => {
    if (fadingSlot !== null) return

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

  if (phase === 'intro') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {aurora}
        <div className="intro-overlay" onClick={() => setPhase('picker')}>
          <p className="intro-text">
            Can't decide what to eat? Play our new game to discover what you've been craving!
          </p>
          <span className="intro-hint">click anywhere to continue</span>
        </div>
      </div>
    )
  }

  if (phase === 'picker') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {aurora}
        <div className="picker-wrapper">
          <p className="picker-dialogue">
            Before, let's define the ingredients you have in your hands
          </p>
          <p className="picker-tip">
            psssst.... the less ingredients you pick, the more options you will have!
          </p>
          <div className="ingredients-grid">
            {allIngredients.map(ing => (
              <button
                key={ing}
                className={`ingredient-chip${selectedIngredients.includes(ing) ? ' selected' : ''}`}
                onClick={() => toggleIngredient(ing)}
              >
                {ing}
              </button>
            ))}
          </div>
          <button className="picker-start-btn" onClick={startGame}>
            Let's play!
          </button>
        </div>
      </div>
    )
  }

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
