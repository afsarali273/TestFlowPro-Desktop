"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Save, X, Key, Info } from "lucide-react"
import { getDefaultTokenPath } from "@/lib/config/token-path-client"

interface TokenPathConfigModalProps {
  onSave: (path: string) => void
  onCancel: () => void
  currentPath?: string
}

export function TokenPathConfigModal({ onSave, onCancel, currentPath = "" }: TokenPathConfigModalProps) {
  const [path, setPath] = useState(currentPath)
  const [useDefault, setUseDefault] = useState(!currentPath)


  const handleSave = () => {
    if (useDefault) {
      onSave('') // Empty string means use default
    } else if (path.trim()) {
      onSave(path.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            GitHub Token File Path
          </CardTitle>
          <CardDescription>
            Configure where GitHub authentication tokens are stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-blue-100">
              <input
                type="radio"
                name="pathOption"
                checked={useDefault}
                onChange={() => setUseDefault(true)}
                className="h-4 w-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">Use Default Path (Recommended)</div>
                <div className="text-xs text-gray-600 mt-1">
                  {getDefaultTokenPath()}
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-gray-100">
              <input
                type="radio"
                name="pathOption"
                checked={!useDefault}
                onChange={() => setUseDefault(false)}
                className="h-4 w-4 text-blue-600 mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-sm mb-2">Custom Path</div>
                <Input
                  value={path}
                  onChange={(e) => {
                    setPath(e.target.value)
                    setUseDefault(false)
                  }}
                  placeholder="Enter custom token file path"
                  disabled={useDefault}
                  className="text-sm"
                />
              </div>
            </label>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1 text-blue-900">Platform-specific defaults:</p>
                <div className="space-y-1 text-gray-700 text-xs">
                  <div><strong>macOS:</strong> <code>~/.testflowpro/github-tokens.json</code></div>
                  <div><strong>Windows:</strong> <code>%APPDATA%\TestFlowPro\github-tokens.json</code></div>
                  <div><strong>Linux:</strong> <code>~/.config/testflowpro/github-tokens.json</code></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
