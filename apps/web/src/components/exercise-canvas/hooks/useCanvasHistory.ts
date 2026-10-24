import { useCallback, useRef, useState } from "react"

import type { CanvasElementsSnapshot } from "../canvas-selection"

const MAX_HISTORY = 60

function cloneSnapshot(snapshot: CanvasElementsSnapshot): CanvasElementsSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as CanvasElementsSnapshot
}

export function useCanvasHistory() {
  const pastRef = useRef<CanvasElementsSnapshot[]>([])
  const futureRef = useRef<CanvasElementsSnapshot[]>([])
  const restoringRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  const push = useCallback((snapshot: CanvasElementsSnapshot) => {
    if (restoringRef.current) return
    pastRef.current.push(cloneSnapshot(snapshot))
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift()
    }
    futureRef.current = []
    syncFlags()
  }, [syncFlags])

  const undo = useCallback((current: CanvasElementsSnapshot): CanvasElementsSnapshot | null => {
    const previous = pastRef.current.pop()
    if (!previous) return null
    futureRef.current.push(cloneSnapshot(current))
    syncFlags()
    return previous
  }, [syncFlags])

  const redo = useCallback((current: CanvasElementsSnapshot): CanvasElementsSnapshot | null => {
    const next = futureRef.current.pop()
    if (!next) return null
    pastRef.current.push(cloneSnapshot(current))
    syncFlags()
    return next
  }, [syncFlags])

  const clear = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    syncFlags()
  }, [syncFlags])

  const runWithoutRecording = useCallback((fn: () => void) => {
    restoringRef.current = true
    try {
      fn()
    } finally {
      restoringRef.current = false
    }
  }, [])

  return {
    push,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    runWithoutRecording,
  }
}
