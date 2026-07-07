import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

interface TourStep {
  route: string
  targetSelector: string
  targetSelectorMobile?: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    targetSelector: '',
    title: 'Welcome to Soole!',
    description: 'Welcome to your Organization Dashboard. Let\'s take a quick multi-page tour to see how the dashboard works and what you can do on each page.',
    position: 'center'
  },
  {
    route: '/',
    targetSelector: '#tour-metrics',
    targetSelectorMobile: '#tour-metrics-mobile',
    title: 'Real-time Metrics (Home)',
    description: 'Monitor daily operations at a glance: active trips, passenger bookings, today\'s revenue, and wallet balance.',
    position: 'bottom'
  },
  {
    route: '/',
    targetSelector: '#tour-alerts',
    title: 'Actionable Alerts (Home)',
    description: 'Pay attention to warning cards (like speed limit violations or pending document reviews) and act on them instantly.',
    position: 'top'
  },
  {
    route: '/',
    targetSelector: '#tour-sidebar',
    title: 'Navigation Menu',
    description: 'Use the sidebar to jump between modules. Let\'s go to the Trips page next to see your scheduled routes!',
    position: 'right'
  },
  {
    route: '/trips',
    targetSelector: '#tour-trips-list',
    title: 'Trips Management',
    description: 'Here you can view all scheduled, active, and completed journeys. Click on any trip card to open the manifest, check-in passengers, or add cash payers.',
    position: 'top'
  },
  {
    route: '/live-map',
    targetSelector: '#tour-map-container',
    title: 'Real-time GPS Tracking',
    description: 'Track your entire active fleet live on the map. View passenger routes, vehicle speeds, and route paths.',
    position: 'left'
  },
  {
    route: '/live-map',
    targetSelector: '#tour-driver-sidebar',
    title: 'Active Drivers List',
    description: 'Filter drivers by status (on trip, idle) and select any driver to center the map on their current position.',
    position: 'right'
  },
  {
    route: '/fleet/vehicles',
    targetSelector: '#tour-vehicles-list',
    title: 'Vehicles Registry',
    description: 'Manage your physical fleet here. Add new vehicles, track seat capacities, and upload documentations like roadworthiness certificates.',
    position: 'top'
  },
  {
    route: '/help',
    targetSelector: '',
    title: 'Help & Resources',
    description: 'Access FAQs, contact WhatsApp support, trigger this website tour again, or review the Terms & Conditions.',
    position: 'center'
  }
]

export function TourGuide() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-open for first-time users - independent of the manual-trigger
    // listener below, which used to be registered only in the `else`
    // branch of this same check (an early `return` in the `if` skipped
    // past it entirely), leaving "Start Website Tour" completely dead
    // for exactly the first-time users it targets, until they'd already
    // seen the auto-popped tour once.
    const hasCompleted = localStorage.getItem('soole_tour_completed')
    let timer: ReturnType<typeof setTimeout> | undefined
    if (!hasCompleted) {
      timer = setTimeout(() => setIsOpen(true), 1000)
    }

    // Support manual trigger from custom event
    const handleStartTour = () => {
      // Go back to home page first if starting from somewhere else
      if (location.pathname !== '/') {
        navigate('/')
      }
      setCurrentStep(0)
      setIsOpen(true)
    }
    window.addEventListener('start-soole-tour', handleStartTour)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('start-soole-tour', handleStartTour)
    }
  }, [location.pathname, navigate])

  // Calculate target element position
  useEffect(() => {
    if (!isOpen) return

    const step = TOUR_STEPS[currentStep]
    if (!step.targetSelector) {
      setCoords(null)
      setCardPosition(null)
      return
    }

    const checkElement = (retries = 0) => {
      // Ensure we are on the correct route first
      if (location.pathname !== step.route) {
        return // Let navigation complete, useEffect will rerun on location change
      }

      const isMobile = window.innerWidth < 1024
      const selector = (isMobile && step.targetSelectorMobile) || step.targetSelector
      const element = document.querySelector(selector)

      if (element) {
        // Scroll element into view smoothly if not visible
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
        
        // Wait a small bit for scroll to settle, then measure
        setTimeout(() => {
          const rect = element.getBoundingClientRect()
          const scrollY = window.scrollY
          const scrollX = window.scrollX

          const elementCoords = {
            top: rect.top + scrollY,
            left: rect.left + scrollX,
            width: rect.width,
            height: rect.height
          }
          setCoords(elementCoords)

          // Now compute card position based on step.position
          if (cardRef.current) {
            const cardRect = cardRef.current.getBoundingClientRect()
            let cTop = 0
            let cLeft = 0
            const gap = 16

            switch (step.position) {
              case 'top':
                cTop = elementCoords.top - cardRect.height - gap
                cLeft = elementCoords.left + (elementCoords.width - cardRect.width) / 2
                break;
              case 'bottom':
                cTop = elementCoords.top + elementCoords.height + gap
                cLeft = elementCoords.left + (elementCoords.width - cardRect.width) / 2
                break;
              case 'left':
                cTop = elementCoords.top + (elementCoords.height - cardRect.height) / 2
                cLeft = elementCoords.left - cardRect.width - gap
                break;
              case 'right':
                cTop = elementCoords.top + (elementCoords.height - cardRect.height) / 2
                cLeft = elementCoords.left + elementCoords.width + gap
                break;
            }

            // Boundary constraints to keep tooltip card inside viewport
            cLeft = Math.max(16, Math.min(cLeft, window.innerWidth - cardRect.width - 16))
            cTop = Math.max(16, Math.min(cTop, document.documentElement.scrollHeight - cardRect.height - 16))

            setCardPosition({ top: cTop, left: cLeft })
          }
        }, 150)
      } else if (retries < 10) {
        // Retry finding element (gives page time to transition and render components)
        setTimeout(() => checkElement(retries + 1), 100)
      } else {
        // Fallback to center if element never rendered
        setCoords(null)
        setCardPosition(null)
      }
    }

    checkElement()
    // Named handler reused for both add and remove - passing a fresh
    // arrow function to each call (as before) makes removeEventListener
    // silently no-op, since it can never match what was actually
    // registered, leaking a stale-closure listener pair on every
    // re-run of this effect (each tour step and page navigation).
    const handleReposition = () => checkElement()
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition)
    }
  }, [isOpen, currentStep, location.pathname])

  if (!isOpen) return null

  const activeStep = TOUR_STEPS[currentStep]
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      handleClose()
    } else {
      const nextStep = TOUR_STEPS[currentStep + 1]
      if (nextStep.route && location.pathname !== nextStep.route) {
        navigate(nextStep.route)
      }
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = TOUR_STEPS[currentStep - 1]
      if (prevStep.route && location.pathname !== prevStep.route) {
        navigate(prevStep.route)
      }
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('soole_tour_completed', 'true')
  }

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden pointer-events-none">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-all duration-300 pointer-events-auto"
        onClick={handleClose}
      />

      {/* Target Highlight Ring */}
      {coords && (
        <div 
          className="absolute border-[3px] border-accent-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] animate-[pulse_2s_infinite] transition-all duration-300"
          style={{
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12
          }}
        />
      )}

      {/* Tour Step Card */}
      <div
        ref={cardRef}
        className={clsx(
          "absolute pointer-events-auto w-[90vw] max-w-[380px] bg-primary-500/90 border border-primary-400 rounded-card p-5 text-white shadow-float backdrop-blur-md transition-all duration-300 flex flex-col gap-4",
          !cardPosition && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={cardPosition ? { top: cardPosition.top, left: cardPosition.left } : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-400/20 flex items-center justify-center text-accent-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-accent-100">{activeStep.title}</h3>
          </div>
          <button 
            onClick={handleClose} 
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-primary-100 leading-relaxed font-medium">
          {activeStep.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
          {/* Progress dots */}
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <span 
                key={i} 
                className={clsx(
                  "w-1.5 h-1.5 rounded-full transition-all duration-150",
                  i === currentStep ? "bg-accent-400 w-3" : "bg-white/30"
                )}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3 py-1.5 rounded-xl bg-accent-400 text-primary-500 text-xs font-bold hover:bg-accent-300 transition-colors flex items-center gap-1 shadow-sm"
            >
              {isLastStep ? 'Finish' : 'Next'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
