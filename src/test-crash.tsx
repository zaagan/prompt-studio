// Simple crash test component - add this temporarily to test crash handling
import React from 'react'

export function TestCrash() {
  const [shouldCrash, setShouldCrash] = React.useState(false)

  if (shouldCrash) {
    throw new Error('This is a test crash!')
  }

  return (
    <div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
      <h3>Crash Test Component</h3>
      <button 
        onClick={() => setShouldCrash(true)}
        style={{ padding: '10px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Click to Crash App
      </button>
    </div>
  )
}