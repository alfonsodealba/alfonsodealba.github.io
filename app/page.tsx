"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Space_Grotesk } from "next/font/google"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const keywords = ["AI", "Automation", "Agents", "Innovation", "Discipline", "Integrity", "Loyalty"]

// Performance monitoring hook
function usePerformanceMonitor() {
  const [fps, setFps] = useState(60)
  const [performanceLevel, setPerformanceLevel] = useState<"high" | "medium" | "low">("high")
  const [isMonitoring, setIsMonitoring] = useState(false)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const fpsHistory = useRef<number[]>([])
  const animationFrame = useRef<number>()

  const measureFPS = useCallback(() => {
    const now = performance.now()
    frameCount.current++

    if (now - lastTime.current >= 1000) {
      const currentFPS = Math.round((frameCount.current * 1000) / (now - lastTime.current))
      setFps(currentFPS)

      // Keep FPS history for averaging
      fpsHistory.current.push(currentFPS)
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift()
      }

      // Calculate average FPS
      const avgFPS = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length

      // Determine performance level
      if (avgFPS >= 55) {
        setPerformanceLevel("high")
      } else if (avgFPS >= 35) {
        setPerformanceLevel("medium")
      } else {
        setPerformanceLevel("low")
      }

      frameCount.current = 0
      lastTime.current = now
    }

    if (isMonitoring) {
      animationFrame.current = requestAnimationFrame(measureFPS)
    }
  }, [isMonitoring])

  useEffect(() => {
    if (isMonitoring) {
      animationFrame.current = requestAnimationFrame(measureFPS)
    } else {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [isMonitoring, measureFPS])

  const startMonitoring = () => setIsMonitoring(true)
  const stopMonitoring = () => setIsMonitoring(false)

  return {
    fps,
    performanceLevel,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    avgFPS:
      fpsHistory.current.length > 0
        ? Math.round(fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length)
        : 60,
  }
}

// Performance-aware animation hook
function useOptimizedAnimation(enabled = true) {
  const { performanceLevel } = usePerformanceMonitor()
  const [shouldAnimate, setShouldAnimate] = useState(enabled)
  const [animationQuality, setAnimationQuality] = useState(1)

  useEffect(() => {
    // Adjust animation quality based on performance
    switch (performanceLevel) {
      case "high":
        setAnimationQuality(1)
        setShouldAnimate(enabled)
        break
      case "medium":
        setAnimationQuality(0.7)
        setShouldAnimate(enabled)
        break
      case "low":
        setAnimationQuality(0.4)
        setShouldAnimate(enabled && window.innerWidth > 768) // Disable on mobile for low performance
        break
    }
  }, [performanceLevel, enabled])

  return { shouldAnimate, animationQuality, performanceLevel }
}

// Intersection observer with performance optimization
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const { performanceLevel } = usePerformanceMonitor()

  useEffect(() => {
    const threshold = performanceLevel === "low" ? 0.3 : 0.1
    const rootMargin = performanceLevel === "low" ? "0px" : "0px 0px -50px 0px"

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [performanceLevel])

  return [ref, isVisible] as const
}

function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0)
  const { shouldAnimate, animationQuality } = useOptimizedAnimation()
  const ticking = useRef(false)

  useEffect(() => {
    if (!shouldAnimate) return

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setOffset(window.pageYOffset * speed * animationQuality)
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed, shouldAnimate, animationQuality])

  return shouldAnimate ? offset : 0
}

function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { shouldAnimate, animationQuality } = useOptimizedAnimation()
  const ticking = useRef(false)

  useEffect(() => {
    if (!shouldAnimate) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setMousePosition({
            x: ((e.clientX - window.innerWidth / 2) / window.innerWidth) * animationQuality,
            y: ((e.clientY - window.innerHeight / 2) / window.innerHeight) * animationQuality,
          })
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [shouldAnimate, animationQuality])

  return mousePosition
}

function useHapticFeedback() {
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkSupport = () => {
      const mobile = window.innerWidth < 768 || "ontouchstart" in window
      setIsMobile(mobile)
      setIsSupported(mobile && "vibrate" in navigator)
    }

    checkSupport()
    window.addEventListener("resize", checkSupport)

    // Check user preference from localStorage
    const savedPreference = localStorage.getItem("haptic-feedback")
    if (savedPreference !== null) {
      setIsEnabled(savedPreference === "true")
    }

    return () => window.removeEventListener("resize", checkSupport)
  }, [])

  const vibrate = (pattern: number | number[]) => {
    if (isSupported && isEnabled && isMobile) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.log("Vibration failed:", error)
      }
    }
  }

  const toggleHaptics = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    localStorage.setItem("haptic-feedback", newState.toString())

    // Give feedback when toggling
    if (newState) {
      vibrate(15) // Short confirmation vibration
    }
  }

  return {
    vibrate,
    isSupported,
    isEnabled,
    toggleHaptics,
    // Predefined vibration patterns
    patterns: {
      touch: 12, // Very subtle touch feedback
      release: 8, // Even more subtle release
      longPress: [15, 50, 10], // Pattern for long press
      error: [20, 100, 20], // Error feedback
      success: [10, 50, 15, 50, 10], // Success pattern
      gentle: 6, // Ultra-subtle feedback
    },
  }
}

function useTouchPosition() {
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(false)
  const [smoothedPosition, setSmoothedPosition] = useState({ x: 0, y: 0 })
  const { vibrate, patterns } = useHapticFeedback()
  const { shouldAnimate, animationQuality } = useOptimizedAnimation()
  const lastVibrateTime = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    if (!shouldAnimate) return

    const handleTouchStart = (e: TouchEvent) => {
      setIsActive(true)

      // Subtle vibration on touch start (throttled to prevent spam)
      const now = Date.now()
      if (now - lastVibrateTime.current > 100) {
        vibrate(patterns.touch)
        lastVibrateTime.current = now
      }

      const touch = e.touches[0]
      if (touch) {
        const newPosition = {
          x: Math.max(
            -0.8,
            Math.min(0.8, ((touch.clientX - window.innerWidth / 2) / window.innerWidth) * animationQuality),
          ),
          y: Math.max(
            -0.8,
            Math.min(0.8, ((touch.clientY - window.innerHeight / 2) / window.innerHeight) * animationQuality),
          ),
        }
        setTouchPosition(newPosition)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive || !shouldAnimate) return

      if (!ticking.current) {
        requestAnimationFrame(() => {
          const touch = e.touches[0]
          if (touch) {
            const newPosition = {
              x: Math.max(
                -0.8,
                Math.min(0.8, ((touch.clientX - window.innerWidth / 2) / window.innerWidth) * animationQuality),
              ),
              y: Math.max(
                -0.8,
                Math.min(0.8, ((touch.clientY - window.innerHeight / 2) / window.innerHeight) * animationQuality),
              ),
            }
            setTouchPosition(newPosition)

            // Very gentle vibration for significant movement changes (throttled heavily)
            const now = Date.now()
            if (now - lastVibrateTime.current > 300) {
              const distance = Math.sqrt(newPosition.x ** 2 + newPosition.y ** 2)
              if (distance > 0.6) {
                vibrate(patterns.gentle)
                lastVibrateTime.current = now
              }
            }
          }
          ticking.current = false
        })
        ticking.current = true
      }
    }

    const handleTouchEnd = () => {
      setIsActive(false)

      // Subtle release vibration
      vibrate(patterns.release)

      // Gradually return to center with easing
      const interval = setInterval(() => {
        setTouchPosition((prev) => {
          const newX = prev.x * 0.92
          const newY = prev.y * 0.92

          if (Math.abs(newX) < 0.01 && Math.abs(newY) < 0.01) {
            clearInterval(interval)
            return { x: 0, y: 0 }
          }

          return { x: newX, y: newY }
        })
      }, 16) // 60fps
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isActive, vibrate, patterns, shouldAnimate, animationQuality])

  // Smooth the position changes with performance awareness
  useEffect(() => {
    if (!shouldAnimate) return

    const smoothingRate = animationQuality > 0.7 ? 16 : 32 // Reduce smoothing frequency on lower performance
    const smoothing = setInterval(() => {
      setSmoothedPosition((prev) => ({
        x: prev.x + (touchPosition.x - prev.x) * 0.1,
        y: prev.y + (touchPosition.y - prev.y) * 0.1,
      }))
    }, smoothingRate)

    return () => clearInterval(smoothing)
  }, [touchPosition, shouldAnimate, animationQuality])

  return { position: smoothedPosition, isActive }
}

function useDeviceOrientation() {
  const [orientation, setOrientation] = useState({ x: 0, y: 0, z: 0 })
  const [isSupported, setIsSupported] = useState(false)
  const [smoothedOrientation, setSmoothedOrientation] = useState({ x: 0, y: 0, z: 0 })
  const { vibrate, patterns } = useHapticFeedback()
  const { shouldAnimate, animationQuality } = useOptimizedAnimation()
  const permissionGranted = useRef(false)
  const ticking = useRef(false)

  useEffect(() => {
    if (!shouldAnimate) return

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          if (e.beta !== null && e.gamma !== null && e.alpha !== null) {
            // More conservative ranges and smoother scaling
            const gamma = Math.max(-20, Math.min(20, e.gamma)) / 20 // Left/right tilt
            const beta = Math.max(-20, Math.min(20, e.beta - 45)) / 20 // Forward/back tilt

            setOrientation({
              x: gamma * 0.6 * animationQuality, // Reduced sensitivity with performance scaling
              y: beta * 0.4 * animationQuality, // Even more reduced for Y-axis
              z: (e.alpha / 360) * 0.2 * animationQuality, // Minimal compass influence
            })
          }
          ticking.current = false
        })
        ticking.current = true
      }
    }

    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== "undefined" && "requestPermission" in DeviceOrientationEvent) {
        try {
          // @ts-ignore - iOS 13+ permission request
          const permission = await DeviceOrientationEvent.requestPermission()
          if (permission === "granted") {
            setIsSupported(true)
            permissionGranted.current = true
            // Gentle success vibration when permission granted
            vibrate(patterns.success)
            window.addEventListener("deviceorientation", handleOrientation, { passive: true })
          }
        } catch (error) {
          console.log("Device orientation not supported")
          vibrate(patterns.error)
        }
      } else if (typeof DeviceOrientationEvent !== "undefined") {
        // Android and other devices
        setIsSupported(true)
        permissionGranted.current = true
        vibrate(patterns.gentle) // Gentle feedback when orientation starts
        window.addEventListener("deviceorientation", handleOrientation, { passive: true })
      }
    }

    // Auto-request permission on first touch (for iOS)
    const handleFirstTouch = () => {
      requestPermission()
      window.removeEventListener("touchstart", handleFirstTouch)
    }

    window.addEventListener("touchstart", handleFirstTouch, { once: true })

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation)
      window.removeEventListener("touchstart", handleFirstTouch)
    }
  }, [vibrate, patterns, shouldAnimate, animationQuality])

  // Smooth orientation changes with performance awareness
  useEffect(() => {
    if (!shouldAnimate) return

    const smoothingRate = animationQuality > 0.7 ? 32 : 64 // Reduce frequency on lower performance
    const smoothing = setInterval(() => {
      setSmoothedOrientation((prev) => ({
        x: prev.x + (orientation.x - prev.x) * 0.08, // Slower smoothing for orientation
        y: prev.y + (orientation.y - prev.y) * 0.08,
        z: prev.z + (orientation.z - prev.z) * 0.05,
      }))
    }, smoothingRate)

    return () => clearInterval(smoothing)
  }, [orientation, shouldAnimate, animationQuality])

  return { orientation: smoothedOrientation, isSupported }
}

function useInteractionPosition() {
  const mousePosition = useMousePosition()
  const { position: touchPosition, isActive: touchActive } = useTouchPosition()
  const { orientation, isSupported: orientationSupported } = useDeviceOrientation()
  const [isMobile, setIsMobile] = useState(false)
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setScreenSize({ width, height })
      setIsMobile(width < 768 || "ontouchstart" in window)
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  // Scale sensitivity based on screen size
  const getScreenSizeMultiplier = () => {
    if (screenSize.width < 400) return 0.7 // Small phones
    if (screenSize.width < 768) return 0.85 // Regular phones
    return 1 // Tablets and larger
  }

  const sizeMultiplier = getScreenSizeMultiplier()

  // Combine different input methods based on device and interaction state
  if (isMobile) {
    if (touchActive) {
      // Use touch position when actively touching (scaled by screen size)
      return {
        x: touchPosition.x * sizeMultiplier,
        y: touchPosition.y * sizeMultiplier,
      }
    } else if (orientationSupported) {
      // Use device orientation when not touching (very subtle)
      return {
        x: orientation.x * 0.15 * sizeMultiplier,
        y: orientation.y * 0.1 * sizeMultiplier,
      }
    }
    return { x: 0, y: 0 }
  }

  // Desktop: use mouse position (unchanged)
  return mousePosition
}

function ParallaxElement({
  children,
  speed = 0.5,
  interactionSpeed = 0.1,
  size = "medium",
  className = "",
}: {
  children: React.ReactNode
  speed?: number
  interactionSpeed?: number
  size?: "small" | "medium" | "large"
  className?: string
}) {
  const scrollOffset = useParallax(speed)
  const interactionPosition = useInteractionPosition()
  const { shouldAnimate, animationQuality, performanceLevel } = useOptimizedAnimation()
  const elementRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(true)

  // Intersection observer for performance culling
  useEffect(() => {
    if (performanceLevel === "low" && elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting)
        },
        { rootMargin: "100px" },
      )

      observer.observe(elementRef.current)
      return () => observer.disconnect()
    }
  }, [performanceLevel])

  // Adjust sensitivity based on element size
  const getSizeMultiplier = () => {
    switch (size) {
      case "small":
        return 1.2 // Small elements can move more
      case "large":
        return 0.6 // Large elements should move less
      default:
        return 1 // Medium elements
    }
  }

  const sizeMultiplier = getSizeMultiplier()
  const adjustedInteractionSpeed = interactionSpeed * sizeMultiplier * animationQuality

  // Limit movement range based on element size and performance
  const maxMovement = (size === "large" ? 30 : size === "small" ? 60 : 45) * animationQuality

  // Skip animation if not in view and performance is low
  const shouldRender = performanceLevel !== "low" || isInView

  if (!shouldAnimate || !shouldRender) {
    return (
      <div ref={elementRef} className={`absolute pointer-events-none ${className}`}>
        {children}
      </div>
    )
  }

  const transitionDuration = performanceLevel === "low" ? "1000ms" : "700ms"

  return (
    <div
      ref={elementRef}
      className={`absolute pointer-events-none ${className}`}
      style={{
        transform: `translate3d(${Math.max(-maxMovement, Math.min(maxMovement, interactionPosition.x * adjustedInteractionSpeed * 40))}px, ${scrollOffset + Math.max(-maxMovement, Math.min(maxMovement, interactionPosition.y * adjustedInteractionSpeed * 25))}px, 0)`,
        transition: `transform ${transitionDuration} ease-out`,
        willChange: performanceLevel === "high" ? "transform" : "auto",
      }}
    >
      {children}
    </div>
  )
}

function PerformanceMonitor() {
  const { fps, performanceLevel, isMonitoring, startMonitoring, stopMonitoring, avgFPS } = usePerformanceMonitor()
  const [showMonitor, setShowMonitor] = useState(false)

  useEffect(() => {
    // Auto-start monitoring in development
    if (process.env.NODE_ENV === "development") {
      startMonitoring()
      setShowMonitor(true)
    }
  }, [startMonitoring])

  if (!showMonitor) {
    return (
      <button
        onClick={() => {
          setShowMonitor(true)
          startMonitoring()
        }}
        className="fixed bottom-6 right-6 z-50 bg-black/80 backdrop-blur-sm border border-purple-700/50 rounded-full p-2 text-white/60 hover:text-cyan-400 transition-colors text-xs"
        title="Show performance monitor"
      >
        📊
      </button>
    )
  }

  const getPerformanceColor = () => {
    switch (performanceLevel) {
      case "high":
        return "text-green-400"
      case "medium":
        return "text-yellow-400"
      case "low":
        return "text-red-400"
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-black/90 backdrop-blur-sm border border-purple-700/50 rounded-lg p-3 text-xs text-white/80 min-w-[120px]">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Performance</span>
        <button
          onClick={() => {
            setShowMonitor(false)
            stopMonitoring()
          }}
          className="text-white/40 hover:text-white/80"
        >
          ×
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getPerformanceColor()}>{fps}</span>
        </div>
        <div className="flex justify-between">
          <span>Avg:</span>
          <span className={getPerformanceColor()}>{avgFPS}</span>
        </div>
        <div className="flex justify-between">
          <span>Level:</span>
          <span className={getPerformanceColor()}>{performanceLevel}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-purple-700/30">
        <div className="flex justify-between text-xs">
          <span>Monitor:</span>
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`${isMonitoring ? "text-green-400" : "text-red-400"} hover:text-cyan-400`}
          >
            {isMonitoring ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </div>
  )
}

function BackgroundElements() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs with optimized sensitivity */}
      <ParallaxElement speed={0.2} interactionSpeed={0.08} size="large" className="top-20 left-10 w-96 h-96 opacity-12">
        <div className="w-full h-full bg-gradient-to-br from-purple-700 to-teal-500 rounded-full blur-3xl" />
      </ParallaxElement>

      <ParallaxElement
        speed={0.3}
        interactionSpeed={0.12}
        size="large"
        className="top-1/3 right-20 w-64 h-64 opacity-18"
      >
        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-purple-800 rounded-full blur-2xl" />
      </ParallaxElement>

      <ParallaxElement
        speed={0.15}
        interactionSpeed={0.06}
        size="large"
        className="bottom-1/4 left-1/4 w-80 h-80 opacity-10"
      >
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-teal-600 rounded-full blur-3xl" />
      </ParallaxElement>

      <ParallaxElement
        speed={0.25}
        interactionSpeed={0.08}
        size="large"
        className="top-2/3 right-1/3 w-72 h-72 opacity-8"
      >
        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-purple-900 rounded-full blur-3xl" />
      </ParallaxElement>

      {/* Geometric Shapes with medium sensitivity */}
      <ParallaxElement speed={0.4} interactionSpeed={0.15} size="medium" className="top-1/2 left-20">
        <div className="w-32 h-32 border border-purple-600/25 rotate-45 rounded-lg" />
      </ParallaxElement>

      <ParallaxElement speed={0.25} interactionSpeed={0.12} size="medium" className="top-3/4 right-32">
        <div className="w-24 h-24 border border-teal-400/25 rounded-full" />
      </ParallaxElement>

      <ParallaxElement speed={0.35} interactionSpeed={0.18} size="small" className="top-1/4 right-1/4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600/15 to-teal-500/15 rotate-12 rounded-md" />
      </ParallaxElement>

      <ParallaxElement speed={0.3} interactionSpeed={0.14} size="medium" className="bottom-1/3 left-1/3">
        <div className="w-20 h-20 border border-purple-500/20 rotate-45 rounded-xl" />
      </ParallaxElement>

      {/* Floating Lines with subtle movement */}
      <ParallaxElement speed={0.2} interactionSpeed={0.06} size="small" className="top-40 left-1/3">
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-purple-600/35 to-transparent" />
      </ParallaxElement>

      <ParallaxElement speed={0.3} interactionSpeed={0.08} size="small" className="top-2/3 right-1/3">
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-teal-400/35 to-transparent" />
      </ParallaxElement>

      {/* Grid Pattern with minimal movement */}
      <ParallaxElement
        speed={0.1}
        interactionSpeed={0.02}
        size="large"
        className="top-0 left-0 w-full h-full opacity-6"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(126, 34, 206, 0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(126, 34, 206, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </ParallaxElement>

      {/* Floating Dots with higher sensitivity */}
      <ParallaxElement speed={0.45} interactionSpeed={0.25} size="small" className="top-1/3 left-1/2">
        <div className="w-2 h-2 bg-teal-400/50 rounded-full" />
      </ParallaxElement>

      <ParallaxElement speed={0.25} interactionSpeed={0.2} size="small" className="top-3/5 left-3/4">
        <div className="w-1 h-1 bg-purple-600/60 rounded-full" />
      </ParallaxElement>

      <ParallaxElement speed={0.35} interactionSpeed={0.22} size="small" className="bottom-1/3 left-1/5">
        <div className="w-3 h-3 bg-teal-300/40 rounded-full" />
      </ParallaxElement>

      <ParallaxElement speed={0.4} interactionSpeed={0.24} size="small" className="top-1/5 right-1/5">
        <div className="w-2 h-2 bg-purple-500/45 rounded-full" />
      </ParallaxElement>
    </div>
  )
}

function HapticToggle() {
  const { isSupported, isEnabled, toggleHaptics } = useHapticFeedback()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || "ontouchstart" in window)
  }, [])

  if (!isMobile || !isSupported) return null

  return (
    <button
      onClick={toggleHaptics}
      className="fixed top-20 right-6 z-40 bg-black/80 backdrop-blur-sm border border-purple-700/50 rounded-full p-3 text-white/80 hover:text-cyan-400 transition-colors"
      title={`Haptic feedback ${isEnabled ? "enabled" : "disabled"}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isEnabled ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18.5c3.5 0 6.5-2.5 6.5-6s-3-6.5-6.5-6.5S5.5 9 5.5 12.5s3 6 6.5 6z M8 12h8 M12 8v8"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18.5c3.5 0 6.5-2.5 6.5-6s-3-6.5-6.5-6.5S5.5 9 5.5 12.5s3 6 6.5 6z M8 12h8"
          />
        )}
      </svg>
    </button>
  )
}

function TouchIndicator() {
  const { position, isActive } = useTouchPosition()
  const { orientation, isSupported } = useDeviceOrientation()
  const [showHint, setShowHint] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (isActive || isSupported) {
      const timer = setTimeout(() => setShowHint(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [isActive, isSupported])

  if (!isMobile || !showHint) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-black/80 backdrop-blur-sm border border-purple-700/50 rounded-full px-4 py-2 text-sm text-white/80 animate-pulse">
        {isSupported ? "Touch, tilt, or feel the vibrations" : "Touch and drag to interact"}
      </div>
    </div>
  )
}

function AnimatedSection({
  children,
  animation = "fade-in-up",
}: {
  children: React.ReactNode
  animation?: string
}) {
  const [ref, isVisible] = useScrollAnimation()
  const { shouldAnimate, performanceLevel } = useOptimizedAnimation()

  const animationDuration = performanceLevel === "low" ? "1000ms" : "700ms"

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${
        shouldAnimate && isVisible ? `animate-${animation}` : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDuration: animationDuration }}
    >
      {children}
    </div>
  )
}

function TimelineItem({
  children,
  delay = "0ms",
}: {
  children: React.ReactNode
  delay?: string
}) {
  const [ref, isVisible] = useScrollAnimation()
  const { shouldAnimate, performanceLevel } = useOptimizedAnimation()

  const animationDuration = performanceLevel === "low" ? "1000ms" : "700ms"

  return (
    <li
      ref={ref}
      className={`transition-all ease-out ${
        shouldAnimate && isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      }`}
      style={{
        transitionDuration: animationDuration,
        transitionDelay: shouldAnimate && isVisible ? delay : "0ms",
      }}
    >
      {children}
    </li>
  )
}

function SignalCard({
  children,
  delay = "0ms",
}: {
  children: React.ReactNode
  delay?: string
}) {
  const [ref, isVisible] = useScrollAnimation()
  const { shouldAnimate, performanceLevel } = useOptimizedAnimation()

  const animationDuration = performanceLevel === "low" ? "1000ms" : "700ms"

  return (
    <div
      ref={ref}
      className={`border border-purple-700 p-4 rounded-xl hover:border-cyan-400 transition-all ease-out ${
        shouldAnimate && isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
      }`}
      style={{
        transitionDuration: animationDuration,
        transitionDelay: shouldAnimate && isVisible ? delay : "0ms",
      }}
    >
      {children}
    </div>
  )
}

function HeroParallax() {
  const scrollOffset1 = useParallax(0.3)
  const scrollOffset2 = useParallax(0.5)
  const scrollOffset3 = useParallax(0.2)
  const interactionPosition = useInteractionPosition()
  const { shouldAnimate, performanceLevel } = useOptimizedAnimation()

  if (!shouldAnimate) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 w-[600px] h-[600px] -translate-x-1/2 opacity-8">
          <div className="w-full h-full bg-gradient-to-br from-purple-700 via-teal-500 to-purple-800 rounded-full blur-3xl" />
        </div>
      </div>
    )
  }

  const transitionDuration = performanceLevel === "low" ? "1500ms" : "1000ms"

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large background orb with reduced sensitivity */}
      <div
        className="absolute top-1/4 left-1/2 w-[600px] h-[600px] -translate-x-1/2 opacity-8 transition-transform ease-out"
        style={{
          transform: `translate(-50%, ${scrollOffset1 + Math.max(-15, Math.min(15, interactionPosition.y * 12))}px) translateX(${Math.max(-20, Math.min(20, interactionPosition.x * 18))}px)`,
          transitionDuration,
          willChange: performanceLevel === "high" ? "transform" : "auto",
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-purple-700 via-teal-500 to-purple-800 rounded-full blur-3xl" />
      </div>

      {/* Floating geometric shapes with bounded movement */}
      <div
        className="absolute top-1/3 right-20 w-40 h-40 border border-teal-400/15 rotate-45 rounded-2xl transition-transform ease-out"
        style={{
          transform: `translateY(${scrollOffset2 + Math.max(-20, Math.min(20, interactionPosition.y * 15))}px) translateX(${Math.max(-25, Math.min(25, interactionPosition.x * 20))}px) rotate(45deg)`,
          transitionDuration,
          willChange: performanceLevel === "high" ? "transform" : "auto",
        }}
      />

      <div
        className="absolute bottom-1/3 left-20 w-32 h-32 border border-purple-600/20 rounded-full transition-transform ease-out"
        style={{
          transform: `translateY(${scrollOffset3 + Math.max(-12, Math.min(12, interactionPosition.y * 10))}px) translateX(${Math.max(-18, Math.min(18, interactionPosition.x * 15))}px)`,
          transitionDuration,
          willChange: performanceLevel === "high" ? "transform" : "auto",
        }}
      />

      {/* Animated lines with subtle movement */}
      <div
        className="absolute top-1/2 left-10 w-px h-40 bg-gradient-to-b from-transparent via-purple-600/25 to-transparent transition-transform ease-out"
        style={{
          transform: `translateY(${scrollOffset1 + Math.max(-15, Math.min(15, interactionPosition.y * 12))}px) translateX(${Math.max(-10, Math.min(10, interactionPosition.x * 8))}px)`,
          transitionDuration,
        }}
      />

      <div
        className="absolute top-2/3 right-10 w-32 h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent transition-transform ease-out"
        style={{
          transform: `translateY(${scrollOffset2 + Math.max(-20, Math.min(20, interactionPosition.y * 18))}px) translateX(${Math.max(-15, Math.min(15, interactionPosition.x * 12))}px)`,
          transitionDuration,
        }}
      />
    </div>
  )
}

export default function Home() {
  const [currentKeyword, setCurrentKeyword] = useState(0)
  const { performanceLevel } = usePerformanceMonitor()

  useEffect(() => {
    // Adjust keyword rotation speed based on performance
    const interval = performanceLevel === "low" ? 2500 : 2000

    const timer = setInterval(() => {
      setCurrentKeyword((prev) => (prev + 1) % keywords.length)
    }, interval)

    return () => clearInterval(timer)
  }, [performanceLevel])

  return (
    <div
      className={`${spaceGrotesk.className} bg-black text-white selection:bg-purple-500 selection:text-white relative`}
    >
      <BackgroundElements />
      <HapticToggle />

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-8 relative">
        <HeroParallax />
        <div className="animate-fade-in-up relative z-10">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold leading-tight">ALFONSO DE ALBA</h1>
          <p className="mt-4 text-lg sm:text-2xl max-w-xl">
            <span className="font-semibold">Building an unseen ally that keeps cash-flow on autopilot.</span>
          </p>
          {/* Rotating keywords */}
          <div className="mt-6 text-sm sm:text-lg flex justify-center gap-3 uppercase tracking-wider">
            <span className="text-cyan-400 transition-opacity duration-300">{keywords[currentKeyword]}</span>
          </div>
        </div>
      </section>

      {/* ORIGIN */}
      <section id="origin" className="py-16 px-6 max-w-3xl mx-auto relative z-10">
        <AnimatedSection animation="fade-in-left">
          <h2 className="text-purple-400 text-xl mb-4">Origin</h2>
          <div className="text-lg leading-relaxed space-y-4">
            <p>
              I spent years in courtrooms—litigating, winning tough cases, and helping clients through high-stakes
              battles. But I also fought a system that moved slowly, where progress depended more on a judge's calendar
              than on my own effort.
            </p>
            <p>
              I always thought I'd build a career as a lawyer. I enjoyed litigation, I enjoyed winning, and I had a
              clear path in mind. Then the pandemic hit—and with it, a forced pause that made me look in a different
              direction.
            </p>
            <p>
              For the first time, I glimpsed the world of entrepreneurship. Not because law let me down, but because I
              discovered something I had never considered: that I could build solutions, not just defend them. That I
              could help thousands, not just one client at a time.
            </p>
            <p>
              What I found in technology was freedom, speed, and a scale the legal system simply can't offer. And while
              I never stopped respecting the law, I chose a new role: building tools that solve problems I used to argue
              about.
            </p>
            <p>
              <strong>Today, I don't wait for decisions. I build them, test them, and launch them.</strong>
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* STORYLINE */}
      <section id="story" className="py-16 px-6 max-w-4xl mx-auto relative z-10">
        <AnimatedSection animation="fade-in-up">
          <h2 className="text-purple-400 text-xl mb-8">Storyline</h2>
        </AnimatedSection>
        <ul className="border-l-2 border-purple-700 pl-6 space-y-8">
          <TimelineItem delay="0ms">
            <span className="text-cyan-400 font-semibold">2020</span>
            <p className="ml-2">Courts closed → First time I felt stuck—and watched others move faster.</p>
          </TimelineItem>
          <TimelineItem delay="100ms">
            <span className="text-cyan-400 font-semibold">2021</span>
            <p className="ml-2">Deep dive into tech → obsessed with speed, automation, and scale.</p>
          </TimelineItem>
          <TimelineItem delay="200ms">
            <span className="text-cyan-400 font-semibold">2023</span>
            <div className="ml-2 space-y-2">
              <p>Launched Quickbyll → validated demand but failed to monetize.</p>
              <p className="text-sm text-gray-300 italic">Lesson: growth without a revenue model doesn't scale.</p>
            </div>
          </TimelineItem>
          <TimelineItem delay="300ms">
            <span className="text-cyan-400 font-semibold">2024</span>
            <div className="ml-2 space-y-2">
              <p>Started Lexibot as Mexico's first virtual lawyer.</p>
              <p>Pivoted to rent collection in 19 days → first paid client in 2 weeks.</p>
            </div>
          </TimelineItem>
          <TimelineItem delay="400ms">
            <span className="text-cyan-400 font-semibold">2024</span>
            <p className="ml-2">
              Selected for <strong>Torrenegra Accelerate</strong> (10 startups, LATAM).
            </p>
          </TimelineItem>
          <TimelineItem delay="500ms">
            <span className="text-cyan-400 font-semibold">2024–25</span>
            <div className="ml-2 space-y-2">
              <p>Pivoted again → from rent collection to universal payment agent.</p>
              <p>
                Processed over $100K in transactions — helping businesses stay on autopilot.{" "}
                <strong>And growing.</strong>
              </p>
            </div>
          </TimelineItem>
        </ul>
      </section>

      {/* WHAT I'M BUILDING NOW */}
      <section id="building" className="py-16 px-6 max-w-3xl mx-auto relative z-10">
        <AnimatedSection animation="fade-in-right">
          <h2 className="text-purple-400 text-xl mb-4">What I'm Building Now</h2>
          <p className="text-lg leading-relaxed space-y-4">
            <span className="block">
              <strong>Lexibot</strong> is evolving into a universal payment platform that helps businesses—whether they
              run on recurring or non-recurring income—automate their financial operations through a channel they
              already use: WhatsApp.
            </span>
            <span className="block">
              At the center of it all is <strong>Lexi</strong>, an always-on assistant that works like your invisible
              secretary—reminding clients to pay, logging payments (digital or cash), sending receipts, and answering
              questions like "How much did we collect this week?" in plain, human language. No dashboards to learn. No
              new app to install. Just your cash-flow, handled.
            </span>
          </p>
        </AnimatedSection>
      </section>

      {/* SIGNALS */}
      {/* PROOF OF WORK */}
      <section id="signals" className="py-20 px-6 max-w-5xl mx-auto relative z-10">
        <AnimatedSection animation="fade-in-up">
          <div className="text-center mb-12">
            <h2 className="text-purple-400 text-xl mb-2">Proof of Work</h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto"></div>
          </div>
        </AnimatedSection>
        <div className="grid gap-8 md:grid-cols-3">
          <SignalCard delay="0ms">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600/20 to-cyan-400/20 rounded-2xl flex items-center justify-center border border-purple-600/30">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="text-cyan-400 font-semibold text-lg mb-2">Speed</h3>
                <p className="text-xl font-bold text-white mb-1">MVP launched in just 19 days</p>
                <p className="text-sm text-gray-400">From prototype to production in under 3 weeks.</p>
              </div>
            </div>
          </SignalCard>
          <SignalCard delay="100ms">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-600/20 to-purple-400/20 rounded-2xl flex items-center justify-center border border-teal-600/30">
                <span className="text-2xl">💸</span>
              </div>
              <div>
                <h3 className="text-cyan-400 font-semibold text-lg mb-2">Volume</h3>
                <p className="text-xl font-bold text-white mb-1">USD $100,000+ processed to date</p>
                <p className="text-sm text-gray-400">And growing—real payments, real usage.</p>
              </div>
            </div>
          </SignalCard>
          <SignalCard delay="200ms">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-cyan-600/30">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-cyan-400 font-semibold text-lg mb-2">Selection</h3>
                <p className="text-xl font-bold text-white mb-1">1 of 10 startups in Torrenegra Accelerate</p>
                <p className="text-sm text-gray-400">Chosen from hundreds across Latin America.</p>
              </div>
            </div>
          </SignalCard>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 px-6 text-center relative z-10">
        <AnimatedSection animation="fade-in-up">
          <h2 className="text-purple-400 text-xl mb-4">Let's Connect</h2>
          <div className="space-y-4 text-lg">
            <div>
              <a
                href="https://lexibot.com.mx/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 border border-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black transition"
              >
                Lexibot
              </a>
            </div>
            <div>
              <a
                href="https://www.linkedin.com/in/alfonsodealba/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 border border-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black transition"
              >
                LinkedIn
              </a>
            </div>
            <a
              href="mailto:alfonso@lexibot.com.mx"
              className="block text-cyan-400 underline hover:text-cyan-300 transition"
            >
              alfonso@lexibot.com.mx
            </a>
          </div>
        </AnimatedSection>
      </section>
    </div>
  )
}
