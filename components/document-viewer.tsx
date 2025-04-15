"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { type ProcessedChange, getDocumentStateAtIndex } from "@/utils/document-processor"
import { Play, Pause, SkipForward, SkipBack, FastForward, Rewind, Copy, Scissors, Type, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DocumentViewerProps {
  changes: ProcessedChange[]
}

// Assign consistent colors to users based on their ID
const getUserColorClass = (userId: string) => {
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorIndex = (hash % 5) + 1
  return `contributor-color-${colorIndex}`
}

export function DocumentViewer({ changes }: DocumentViewerProps) {
  // Core state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)

  // Document content state
  const [displayContent, setDisplayContent] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [timestamp, setTimestamp] = useState(0)

  // Animation state
  const [animationInProgress, setAnimationInProgress] = useState(false)
  const [highlightRange, setHighlightRange] = useState<{
    start: number
    end: number
    type: "insert" | "delete" | null
    userId: string
  } | null>(null)
  const [cursorVisible, setCursorVisible] = useState(true)

  // Refs for timers and state tracking
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cursorBlinkTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingRef = useRef(isPlaying)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const currentIndexRef = useRef(currentIndex)
  const displayContentRef = useRef(displayContent)
  const cursorPositionRef = useRef(cursorPosition)
  const processChangeRunningRef = useRef(false)
  const playbackSpeedRef = useRef(playbackSpeed)

  // Current change and user
  const currentChange = changes[currentIndex] || null
  const currentUser = currentChange?.user || { name: "", photo_url: "", id: "" }

  // Update refs when state changes
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    displayContentRef.current = displayContent
  }, [displayContent])

  useEffect(() => {
    cursorPositionRef.current = cursorPosition
  }, [cursorPosition])

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed
  }, [playbackSpeed])

  // Initialize content on first render
  useEffect(() => {
    if (changes.length > 0) {
      const initialState = getDocumentStateAtIndex(changes, 0)
      setDisplayContent(initialState.content)
      setCursorPosition(initialState.cursorPosition)
      setTimestamp(initialState.timestamp)
    }
  }, [changes])

  // Cursor blinking effect
  useEffect(() => {
    cursorBlinkTimerRef.current = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 530)

    return () => {
      if (cursorBlinkTimerRef.current) {
        clearInterval(cursorBlinkTimerRef.current)
      }
    }
  }, [])

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current)
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current)
      if (cursorBlinkTimerRef.current) clearInterval(cursorBlinkTimerRef.current)
    }
  }, [])

  // Auto-scroll to cursor position
  useEffect(() => {
    if (!textContainerRef.current) return

    const cursorElement = textContainerRef.current.querySelector(".cursor")
    if (!cursorElement) return

    const containerRect = textContainerRef.current.getBoundingClientRect()
    const cursorRect = cursorElement.getBoundingClientRect()

    const isCursorOutOfView = cursorRect.top < containerRect.top || cursorRect.bottom > containerRect.bottom

    if (isCursorOutOfView) {
      cursorElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      })
    }
  }, [displayContent, cursorPosition])

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
      playbackTimerRef.current = null
    }

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
  }, [])

  // Advance to the next change if playing
  const advanceToNextIfPlaying = useCallback(() => {
    if (!isPlayingRef.current) return

    // Clear any existing playback timer
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
    }

    // Set a timer to advance to the next change
    playbackTimerRef.current = setTimeout(() => {
      if (!isPlayingRef.current) return

      const nextIndex = currentIndexRef.current + 1
      if (nextIndex >= changes.length) {
        setIsPlaying(false)
        return
      }

      setCurrentIndex(nextIndex)
    }, 500 / playbackSpeedRef.current)
  }, [changes.length])

  // Process a change at the given index
  const processChange = useCallback(
    (index: number) => {
      if (index < 0 || index >= changes.length) return
      if (processChangeRunningRef.current) return

      // Set flag to prevent recursive calls
      processChangeRunningRef.current = true

      // Clear any existing timers
      clearAllTimers()

      // Mark animation as in progress
      setAnimationInProgress(true)

      // Clear any existing highlights
      setHighlightRange(null)

      const change = changes[index]

      // Get the state before this change
      const prevState =
        index > 0
          ? getDocumentStateAtIndex(changes, index - 1)
          : { content: "", timestamp: 0, changeIndex: -1, cursorPosition: 0 }

      // Get the final state after this change
      const finalState = getDocumentStateAtIndex(changes, index)

      // Set the timestamp immediately
      setTimestamp(finalState.timestamp)

      if (change.type === "insert") {
        // Handle insertion
        const isLargeInsertion = change.text && change.text.length > 10

        if (isLargeInsertion) {
          // For large insertions, show highlight then final state
          const insertPosition =
            change.position >= 0 ? Math.min(change.position, prevState.content.length) : prevState.content.length

          // Set initial content - important to use prevState, not finalState
          setDisplayContent(prevState.content)
          setCursorPosition(insertPosition)

          // Show highlight
          setHighlightRange({
            start: insertPosition,
            end: insertPosition + change.length,
            type: "insert",
            userId: change.user.id,
          })

          // After a delay, show the final state
          animationTimerRef.current = setTimeout(() => {
            // Update to final state - this is where the actual insertion happens
            setDisplayContent(finalState.content)
            setCursorPosition(finalState.cursorPosition)

            // Keep highlight for a bit longer
            animationTimerRef.current = setTimeout(() => {
              setHighlightRange(null)

              // Mark animation as complete after a pause
              animationTimerRef.current = setTimeout(() => {
                setAnimationInProgress(false)
                processChangeRunningRef.current = false
                advanceToNextIfPlaying()
              }, 1000 / playbackSpeedRef.current)
            }, 2000 / playbackSpeedRef.current)
          }, 500 / playbackSpeedRef.current)
        } else {
          // For small insertions, animate character by character
          const insertPosition =
            change.position >= 0 ? Math.min(change.position, prevState.content.length) : prevState.content.length

          // Set initial content - important to use prevState, not finalState
          setDisplayContent(prevState.content)
          setCursorPosition(insertPosition)

          // Animate the insertion
          let charIndex = 0
          const text = change.text || ""

          const animateNextChar = () => {
            if (charIndex >= text.length) {
              // Animation complete
              setAnimationInProgress(false)
              processChangeRunningRef.current = false
              advanceToNextIfPlaying()
              return
            }

            // Insert the next character
            const currentContent = displayContentRef.current
            const currentCursorPos = cursorPositionRef.current

            const newContent =
              currentContent.substring(0, currentCursorPos) +
              text.charAt(charIndex) +
              currentContent.substring(currentCursorPos)

            setDisplayContent(newContent)
            setCursorPosition(currentCursorPos + 1)
            charIndex++

            // Schedule next character
            const typingSpeed = change.isCopyPaste ? 10 : 30
            animationTimerRef.current = setTimeout(animateNextChar, typingSpeed / playbackSpeedRef.current)
          }

          // Start the animation
          animateNextChar()
        }
      } else if (change.type === "delete") {
        // Handle deletion
        const isLargeDeletion = change.length > 10

        if (isLargeDeletion) {
          // For large deletions, show highlight then final state
          const deletePosition = Math.min(change.position, prevState.content.length)
          const deleteEnd = Math.min(deletePosition + change.length, prevState.content.length)

          // Set initial content - important to use prevState, not finalState
          setDisplayContent(prevState.content)
          setCursorPosition(deletePosition)

          // Show highlight
          setHighlightRange({
            start: deletePosition,
            end: deleteEnd,
            type: "delete",
            userId: change.user.id,
          })

          // After a delay, show the final state
          animationTimerRef.current = setTimeout(() => {
            // Update to final state - this is where the actual deletion happens
            setDisplayContent(finalState.content)
            setCursorPosition(finalState.cursorPosition)

            // Clear highlight
            setHighlightRange(null)

            // Mark animation as complete after a pause
            animationTimerRef.current = setTimeout(() => {
              setAnimationInProgress(false)
              processChangeRunningRef.current = false
              advanceToNextIfPlaying()
            }, 1000 / playbackSpeedRef.current)
          }, 1500 / playbackSpeedRef.current)
        } else {
          // For small deletions, animate character by character
          const deletePosition = Math.min(change.position, prevState.content.length)
          const deleteEnd = Math.min(deletePosition + change.length, prevState.content.length)

          // Set initial content - important to use prevState, not finalState
          setDisplayContent(prevState.content)
          setCursorPosition(deletePosition)

          // Show highlight for what will be deleted
          setHighlightRange({
            start: deletePosition,
            end: deleteEnd,
            type: "delete",
            userId: change.user.id,
          })

          // Animate the deletion
          let charsDeleted = 0
          const totalToDelete = deleteEnd - deletePosition

          const animateNextDeletion = () => {
            if (charsDeleted >= totalToDelete) {
              // Animation complete
              setHighlightRange(null)
              setAnimationInProgress(false)
              processChangeRunningRef.current = false
              advanceToNextIfPlaying()
              return
            }

            // Delete the next character
            const currentContent = displayContentRef.current
            const deletePos = cursorPositionRef.current

            const newContent = currentContent.substring(0, deletePos) + currentContent.substring(deletePos + 1)

            setDisplayContent(newContent)
            charsDeleted++

            // Update highlight range
            setHighlightRange({
              start: deletePos,
              end: deleteEnd - charsDeleted,
              type: "delete",
              userId: change.user.id,
            })

            // Schedule next deletion
            animationTimerRef.current = setTimeout(animateNextDeletion, 50 / playbackSpeedRef.current)
          }

          // Start the animation after a short delay
          animationTimerRef.current = setTimeout(animateNextDeletion, 500 / playbackSpeedRef.current)
        }
      } else {
        // For other change types, just show the final state
        setDisplayContent(finalState.content)
        setCursorPosition(finalState.cursorPosition)

        // Mark animation as complete after a short delay
        animationTimerRef.current = setTimeout(() => {
          setAnimationInProgress(false)
          processChangeRunningRef.current = false
          advanceToNextIfPlaying()
        }, 500 / playbackSpeedRef.current)
      }
    },
    [changes, clearAllTimers, advanceToNextIfPlaying],
  )

  // Process change when currentIndex changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < changes.length) {
      processChange(currentIndex)
    }
  }, [currentIndex, processChange, changes.length])

  // Watch for play state changes
  useEffect(() => {
    // If we just started playing and no animation is in progress,
    // we need to advance to the next change
    if (isPlaying && !animationInProgress) {
      advanceToNextIfPlaying()
    }
  }, [isPlaying, animationInProgress, advanceToNextIfPlaying])

  // Render document content with animations
  const renderContent = () => {
    if (!displayContent && !highlightRange) {
      return (
        <span className={`cursor ${cursorVisible ? "visible" : "invisible"}`} style={{ backgroundColor: "#8F48D8" }}>
          |
        </span>
      )
    }

    if (!highlightRange) {
      // Normal display with cursor
      return (
        <>
          {displayContent.substring(0, cursorPosition)}
          <span className={`cursor ${cursorVisible ? "visible" : "invisible"}`} style={{ backgroundColor: "#8F48D8" }}>
            |
          </span>
          {displayContent.substring(cursorPosition)}
        </>
      )
    }

    // Display with highlighted section
    const { start, end, type, userId } = highlightRange
    const beforeHighlight = displayContent.substring(0, start)
    const highlighted = displayContent.substring(start, end)
    const afterHighlight = displayContent.substring(end)

    const userColorClass = getUserColorClass(userId)
    const highlightClass =
      type === "insert" ? `highlight-insertion ${userColorClass}` : `highlight-deletion ${userColorClass}`

    return (
      <>
        {beforeHighlight}
        <span className={highlightClass}>{highlighted}</span>
        <span className={`cursor ${cursorVisible ? "visible" : "invisible"}`} style={{ backgroundColor: "#8F48D8" }}>
          |
        </span>
        {afterHighlight}
      </>
    )
  }

  // Determine change type info for display
  const getChangeTypeInfo = () => {
    if (!currentChange) return { icon: null, label: "", color: "" }

    if (currentChange.type === "insert") {
      if (currentChange.isMassInsertion) {
        return {
          icon: <FileText className="h-4 w-4" />,
          label: "Mass Insertion",
          color: "bg-emerald-100 text-emerald-800",
        }
      } else if (currentChange.isCopyPaste) {
        return {
          icon: <Copy className="h-4 w-4" />,
          label: "Copy-Paste",
          color: "bg-blue-100 text-blue-800",
        }
      } else {
        return {
          icon: <Type className="h-4 w-4" />,
          label: "Typing",
          color: "bg-purple-100 text-purple-800",
        }
      }
    } else {
      return {
        icon: <Scissors className="h-4 w-4" />,
        label: "Deletion",
        color: "bg-red-100 text-red-800",
      }
    }
  }

  const changeTypeInfo = getChangeTypeInfo()

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // Playback controls
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleSliderChange = useCallback((value: number[]) => {
    // Stop playback when manually changing position
    setIsPlaying(false)
    setCurrentIndex(value[0])
  }, [])

  const handleSkipForward = useCallback(() => {
    // Stop playback when manually changing position
    setIsPlaying(false)
    setCurrentIndex((prev) => Math.min(prev + 1, changes.length - 1))
  }, [changes.length])

  const handleSkipBack = useCallback(() => {
    // Stop playback when manually changing position
    setIsPlaying(false)
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleJumpToStart = useCallback(() => {
    // Stop playback when manually changing position
    setIsPlaying(false)
    setCurrentIndex(0)
  }, [])

  const handleJumpToEnd = useCallback(() => {
    // Stop playback when manually changing position
    setIsPlaying(false)
    setCurrentIndex(changes.length - 1)
  }, [changes.length])

  return (
    <div className="flex flex-col gap-4 w-full">
      <Card className="shadow-sm card-hover-effect">
        <CardContent className="p-4">
          <div
            ref={textContainerRef}
            className="bg-white border rounded-md p-4 h-[500px] overflow-auto font-mono text-sm whitespace-pre-wrap relative leading-relaxed"
          >
            {renderContent()}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
              <Avatar className="h-10 w-10 border-2 border-[#8F48D8]/20">
                <AvatarImage src={currentUser.photo_url} />
                <AvatarFallback className="bg-[#8F48D8]/10 text-[#8F48D8]">
                  {currentUser.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{formatTimestamp(timestamp)}</p>
              </div>

              {changeTypeInfo.icon && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={`ml-2 ${changeTypeInfo.color}`}>
                        <span className="flex items-center gap-1">
                          {changeTypeInfo.icon}
                          {changeTypeInfo.label}
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {currentChange?.type === "insert"
                        ? `Inserting ${currentChange.length} characters`
                        : `Deleting ${currentChange?.length} characters`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <div className="ml-auto">
                <p className="text-sm font-medium">Change</p>
                <p className="text-2xl font-bold">
                  {currentIndex + 1} <span className="text-sm text-muted-foreground">of {changes.length}</span>
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Speed</p>
                <Select
                  value={playbackSpeed.toString()}
                  onValueChange={(value) => setPlaybackSpeed(Number.parseFloat(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                    <SelectItem value="8">8x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-16">
                {Math.floor((currentIndex / changes.length) * 100)}%
              </span>
              <Slider
                value={[currentIndex]}
                max={changes.length - 1}
                step={1}
                onValueChange={handleSliderChange}
                className="flex-1"
              />
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" size="icon" onClick={handleJumpToStart} className="hover:bg-[#8F48D8]/5">
                <Rewind className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleSkipBack} className="hover:bg-[#8F48D8]/5">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                onClick={handlePlayPause}
                className="w-24 bg-gradient-to-r from-[#8F48D8] to-[#7A3CBD] hover:opacity-90 shadow-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Play
                  </>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleSkipForward} className="hover:bg-[#8F48D8]/5">
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleJumpToEnd} className="hover:bg-[#8F48D8]/5">
                <FastForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
