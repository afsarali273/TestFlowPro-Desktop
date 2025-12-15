"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderOpen, Save, X, Github } from "lucide-react"

interface GitHubConfigModalProps {
  onSave: (path: string) => void
  onCancel: () => void
  currentPath?: string
}

export function GitHubConfigModal({ onSave, onCancel, currentPath = "" }: GitHubConfigModalProps) {
  const [path, setPath] = useState(currentPath || `${process.env.HOME || '~'}/.config/github-copilot/apps.json`)

  const handleSave = () => {
    if (path.trim()) {
      onSave(path.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Copilot Configuration
          </CardTitle>
          <CardDescription>
            Specify the path to your GitHub Copilot apps.json file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="copilot-path">Apps.json File Path</Label>
            <Input
              id="copilot-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="~/.config/github-copilot/apps.json"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Default locations:</p>
            <div className="space-y-1 text-gray-600">
              <div>macOS/Linux: <code>~/.config/github-copilot/apps.json</code></div>
              <div>Windows: <code>%APPDATA%\GitHub Copilot\apps.json</code></div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!path.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}