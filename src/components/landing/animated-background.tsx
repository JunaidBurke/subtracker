'use client'

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Subtle warm radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201, 169, 110, 0.04), transparent)',
        }}
      />
      {/* Bottom subtle glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 120%, rgba(201, 169, 110, 0.02), transparent)',
        }}
      />
    </div>
  )
}
