"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataGenerator } from "./data-generator-faker"
import { Wand2 } from "lucide-react"

interface InputWithGeneratorProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'ref'> {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onGenerate?: (value: string) => void
}

export function InputWithGenerator({ 
  value, 
  onChange, 
  onGenerate, 
  className = "",
  ...props 
}: InputWithGeneratorProps) {
  const handleGenerate = (generatedValue: string) => {
    if (onGenerate) {
      onGenerate(generatedValue)
    } else if (onChange) {
      // Fallback: create a synthetic event
      const syntheticEvent = {
        target: { value: generatedValue },
        currentTarget: { value: generatedValue }
      } as React.ChangeEvent<HTMLInputElement>
      onChange(syntheticEvent)
    }
  }

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={onChange}
        className={`pr-10 ${className}`}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2">
        <DataGenerator onGenerate={handleGenerate}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Generate data"
          >
            <Wand2 className="h-3.5 w-3.5" />
          </Button>
        </DataGenerator>
      </div>
    </div>
  )
}