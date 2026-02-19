'use client'

import { useEffect, useState } from 'react'

export default function LoadingSkeleton() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 15
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative">
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>

      {/* Minimal Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/20 rounded-full animate-float-gentle"
            style={{
              left: `${20 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Single Elegant Ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-72 h-72">
          <div className="absolute inset-0 border-2 border-transparent border-t-primary/40 border-r-primary/40 rounded-full animate-spin-elegant"></div>
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Presidio Logo with Subtle Glow */}
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-[#00CED1]/20 animate-pulse-soft"></div>
          <div className="relative space-y-2">
            <div className="text-[#00CED1] font-bold text-3xl tracking-widest animate-fade-in">
              PRESIDIO
            </div>
            <div className="text-text-primary font-bold text-4xl animate-fade-in-delay">
              MP Utilisation
            </div>
          </div>
        </div>

        {/* Smooth Animated Bars */}
        <div className="flex justify-center items-end space-x-2 h-16">
          {[30, 50, 40, 65, 45, 55, 35].map((height, i) => (
            <div
              key={i}
              className="w-2 bg-gradient-to-t from-primary/60 to-primary rounded-full animate-bar-pulse"
              style={{
                height: `${height}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Simple Loading Text */}
        <div className="text-text-secondary text-base font-medium animate-pulse-text">
          Loading your data
        </div>

        {/* Sleek Progress Bar */}
        <div className="w-64 mx-auto space-y-2">
          <div className="h-1 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-primary text-xs font-semibold opacity-60">
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-gentle {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.2; 
          }
          50% { 
            transform: translateY(-20px) translateX(10px); 
            opacity: 0.4; 
          }
        }
        @keyframes spin-elegant {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-delay {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes bar-pulse {
          0%, 100% { opacity: 0.5; transform: scaleY(0.9); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-float-gentle {
          animation: float-gentle ease-in-out infinite;
        }
        .animate-spin-elegant {
          animation: spin-elegant 4s linear infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in-delay 0.8s ease-out 0.2s backwards;
        }
        .animate-bar-pulse {
          animation: bar-pulse 2s ease-in-out infinite;
        }
        .animate-pulse-text {
          animation: pulse-text 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
