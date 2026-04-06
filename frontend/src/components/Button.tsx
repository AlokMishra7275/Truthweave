'use client'

import React from 'react'

type ButtonVariant = 'soft' | 'primary' | 'neutral'
type ButtonSize = 'sm' | 'md'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClass: Record<ButtonVariant, string> = {
  soft: 'bg-slate-600/40 text-slate-100 border border-slate-500/50 hover:brightness-110',
  primary: 'bg-blue-500/40 text-blue-50 border border-blue-400/40 hover:brightness-110',
  neutral: 'bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
}

export default function Button({
  variant = 'neutral',
  size = 'sm',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-full transition-all duration-200 ease-out hover:scale-[1.03] disabled:opacity-60 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
