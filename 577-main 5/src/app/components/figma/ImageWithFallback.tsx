import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props
  const normalizedSrc = typeof src === 'string' ? src.trim() : ''

  return didError || !normalizedSrc ? (
    <div
      className={`inline-block text-center align-middle ${className ?? ''}`}
      style={{
        ...style,
        background:
          'linear-gradient(135deg, rgba(194, 178, 128, 0.18), rgba(46, 26, 26, 0.08))',
      }}
    >
      <div className="flex flex-col items-center justify-center w-full h-full gap-2 p-4">
        <img
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          {...rest}
          data-original-url={normalizedSrc}
          style={{ width: '44px', height: '44px', opacity: 0.5 }}
        />
        <span style={{ fontSize: '12px', color: '#6B6B6B' }}>Image coming soon</span>
      </div>
    </div>
  ) : (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  )
}
