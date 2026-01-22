"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Upload, Zap, MousePointer } from 'lucide-react'

interface ImportMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectImport: (type: 'curl' | 'swagger' | 'postman' | 'bruno' | 'soap' | 'playwright') => void
}

export function ImportMenu({ isOpen, onClose, onSelectImport }: ImportMenuProps) {
  const importOptions = [
    { id: 'postman' as const, icon: Upload, label: 'Postman Collection', description: 'Import from Postman' },
    { id: 'swagger' as const, icon: FileText, label: 'Swagger/OpenAPI', description: 'Import API spec' },
    { id: 'curl' as const, icon: Zap, label: 'cURL Command', description: 'Convert cURL to test' },
    { id: 'bruno' as const, icon: FileText, label: 'Bruno Collection', description: 'Import Bruno tests' },
    { id: 'soap' as const, icon: FileText, label: 'SOAP/WSDL', description: 'Import SOAP services' },
    { id: 'playwright' as const, icon: MousePointer, label: 'Playwright Tests', description: 'Import UI tests' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Test Suites</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {importOptions.map((option) => {
            const Icon = option.icon
            return (
              <Button
                key={option.id}
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                onClick={() => {
                  onSelectImport(option.id)
                  onClose()
                }}
              >
                <Icon className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <p className="font-semibold text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

