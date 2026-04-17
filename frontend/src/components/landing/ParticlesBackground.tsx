'use client'

import { useCallback, useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

const options: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'grab' },
      onClick: { enable: true, mode: 'push' },
    },
    modes: {
      grab: { distance: 160, links: { opacity: 0.4 } },
      push: { quantity: 3 },
    },
  },
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ['#7c3aed', '#a855f7', '#ec4899', '#6366f1'] },
    links: {
      enable: true,
      distance: 130,
      color: '#7c3aed',
      opacity: 0.15,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: 'none',
      random: true,
      outModes: { default: 'bounce' },
    },
    shape: { type: 'circle' },
    opacity: { value: { min: 0.2, max: 0.6 } },
    size: { value: { min: 1, max: 3 } },
  },
  detectRetina: true,
}

export function ParticlesBackground() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  const particlesLoaded = useCallback(async () => {}, [])

  if (!ready) return null

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={options}
      className="absolute inset-0 w-full h-full"
    />
  )
}
