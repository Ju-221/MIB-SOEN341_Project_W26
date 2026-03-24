import React, { useState, useMemo } from 'react'
import confetti from 'canvas-confetti'
import Card from './Card'
import Aurora from './Background'
import fakeRecipes, { type Recipe } from './fakeRecipes' // Remove this when real API is available
import './Unique.css'

type Phase = 'intro' | 'picker' | 'no-results' | 'game'

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
  const [filterMode, setFilterMode] = useState<'all' | 'any'>('all')
  const [pool, setPool] = useState<Recipe[]>([])
  const [slots, setSlots] = useState<[Recipe | null, Recipe | null]>([null, null])
  const [fadingSlot, setFadingSlot] = useState<0 | 1 | null>(null)
  const [winner, setWinner] = useState<Recipe | null>(null)

  const getIngredientName = (ing: Recipe['ingredients'][number]): string =>
    typeof ing === 'string' ? ing : ing.name

  const allIngredients = useMemo(() => {
    const set = new Set<string>()
    fakeRecipes.forEach(r => r.ingredients.forEach(i => set.add(getIngredientName(i))))
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [])

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    )
  }

  const getFiltered = (mode: 'all' | 'any'): Recipe[] => {
    if (selectedIngredients.length === 0) return fakeRecipes
    return fakeRecipes.filter(r => {
      const names = r.ingredients.map(getIngredientName)
      return mode === 'all'
        ? selectedIngredients.every(ing => names.includes(ing))
        : selectedIngredients.some(ing => names.includes(ing))
    })
  }

  const startGame = () => {
    const filtered = getFiltered(filterMode)

    // Common mode: strict handling of 0 or 1 result
    if (filterMode === 'all') {
      if (filtered.length === 0) {
        setPhase('no-results')
        return
      }
      if (filtered.length === 1) {
        setWinner(filtered[0])
        fireConfetti()
        setPhase('game') // winner render is inside game phase check
        return
      }
    }

    // Uncommon mode or common with enough results: fall back if too few
    const pool = (filterMode === 'any' && filtered.length < 4) ? fakeRecipes : filtered
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

          <div className="filter-toggle">
            <button
              className={`toggle-option${filterMode === 'all' ? ' toggle-active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              Common
            </button>
            <button
              className={`toggle-option${filterMode === 'any' ? ' toggle-active' : ''}`}
              onClick={() => setFilterMode('any')}
            >
              Uncommon
            </button>
          </div>
          <p className="filter-toggle-hint">
            {filterMode === 'all'
              ? 'Each recipe shown will include all of your ingredients'
              : 'Each recipe shown will include at least one of your ingredients'}
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

  if (phase === 'no-results') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {aurora}
        <div className="no-results-container">
          <p className="no-results-icon">🍽️</p>
          <h2 className="no-results-title">No recipe found</h2>
          <p className="no-results-body">
            None of our recipes use all of{' '}
            <strong>{selectedIngredients.join(', ')}</strong> together.
          </p>
          <div className="no-results-actions">
            <a href="#home" className="no-results-generate-btn">
              Generate one from scratch with AI →
            </a>
            <button className="no-results-back-btn" onClick={() => setPhase('picker')}>
              ← Change my ingredients
            </button>
          </div>
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
        <a href="#home" className="winner-generate-link">
          Still not satisfied? Generate a recipe from scratch!
        </a>
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
          <div key={i} className="card-slot">
            <div className={`card-wrapper${fadingSlot === i ? ' card-fading' : ''}`} style={{ height: '70vh' }}>
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
