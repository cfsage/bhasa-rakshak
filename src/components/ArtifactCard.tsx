'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import Image from 'next/image'

interface ArtifactCardProps {
  title: string
  language: string
  imageUrl: string
  audioUrl: string
  description: string
  onPlay: () => void
  isPlaying: boolean
  highlighted?: boolean
  badgeText?: string
}

export default function ArtifactCard({
  title,
  language,
  imageUrl,
  audioUrl,
  description,
  onPlay,
  isPlaying,
  highlighted = false,
  badgeText,
}: ArtifactCardProps) {
  const [isLocalPlaying, setIsLocalPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!isPlaying && isLocalPlaying) {
      setTimeout(() => setIsLocalPlaying(false), 0)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [isPlaying, isLocalPlaying])

  const resolveAudioUrl = async (url: string) => {
    const map: Record<string, string> = {
      '/Audio/newari_story.wav': '/Audio/Newari_voice.mp4',
      '/Audio/tamang_story.wav': '/Audio/tamang_Audio.mp4',
      '/Audio/tharu_story.wav': '/Audio/Tharu_voice.mp4',
    }
    return map[url] || url
  }

  const handlePlayPause = async () => {
    if (isLocalPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsLocalPlaying(false)
    } else {
      onPlay()
      const resolved = await resolveAudioUrl(audioUrl)
      if (!audioRef.current) {
        audioRef.current = new Audio(resolved)
      } else {
        if (audioRef.current.src !== resolved) {
          audioRef.current.src = resolved
        }
      }
      audioRef.current.play()
        .then(() => {
          setIsLocalPlaying(true)
        })
        .catch(error => {
          console.error('Error playing audio:', error)
        })
    }
  }

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${highlighted ? 'ring-2 ring-amber-500' : ''}`}>
      <div className="relative bg-slate-700 h-48 w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-amber-400">{title}</h3>
          <div className="flex items-center gap-2">
            {badgeText ? (
              <span className="text-xs text-amber-200 bg-amber-700/40 border border-amber-600 px-2 py-1 rounded">{badgeText}</span>
            ) : null}
            <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">
              {language}
            </span>
          </div>
        </div>
        
        <p className="text-slate-300 mb-4 text-sm leading-relaxed">
          {description}
        </p>
        
        <button
          aria-label={isLocalPlaying ? 'Pause audio' : 'Play audio'}
          onClick={handlePlayPause}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isLocalPlaying
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-amber-400'
          }`}
        >
          {isLocalPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isLocalPlaying ? 'Pause Audio' : 'Play Audio'}
        </button>
      </div>
    </div>
  )
}