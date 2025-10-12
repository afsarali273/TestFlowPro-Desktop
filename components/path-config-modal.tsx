"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, Save, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PathConfigModalProps {
  onSave: (path: string) => void
  onCancel: () => void
  currentPath?: string
}

export function PathConfigModal({ onSave, onCancel, currentPath = "" }: PathConfigModalProps) {
  const [path, setPath] = useState(currentPath)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
    fileCount?: number
  } | null>(null)

  const validatePath = async () => {
    if (!path.trim()) {
      setValidationResult({
        isValid: false,
        message: "Please enter a path",
      })
      return
    }

    setIsValidating(true)
    try {
      // In a real implementation, this would call your backend API to validate the path
      const response = await fetch(`/api/validate-path?path=${encodeURIComponent(path)}`)
      const result = await response.json()

      setValidationResult(result)
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: "Failed to validate path. Please check if the path exists and is accessible.",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = () => {
    if (validationResult?.isValid) {
      onSave(path)
    } else {
      validatePath()
    }
  }

  const handleBrowse = async () => {
    // In a real implementation, this would open a directory picker
    // For now, we'll simulate it
    try {
      const response = await fetch("/api/browse-directories")
      const directories = await response.json()

      // This would typically open a directory picker dialog
      // For demo purposes, we'll just show an alert
      alert("Directory browser would open here. For now, please enter the path manually.")
    } catch (error) {
      console.error("Failed to browse directories:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Configure Test Suite Path
          </CardTitle>
          <CardDescription>Specify the directory path where your JSON test suite files are located</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="path">Test Suite Directory Path</Label>
            <div className="flex gap-2">
              <Input
                id="path"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value)
                  setValidationResult(null)
                }}
                placeholder="/path/to/your/test-suites"
                className="flex-1"
              />
              <Button variant="outline" onClick={handleBrowse}>
                Browse
              </Button>
            </div>
          </div>

          {validationResult && (
            <Alert className={validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={validationResult.isValid ? "text-green-800" : "text-red-800"}>
                  {validationResult.message}
                  {validationResult.fileCount !== undefined && (
                    <span className="ml-2">
                      <Badge variant="secondary">{validationResult.fileCount} JSON files found</Badge>
                    </span>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Path Examples:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                <code>/home/user/api-tests/suites</code> - Linux/Mac absolute path
              </div>
              <div>
                <code>C:\Users\User\api-tests\suites</code> - Windows absolute path
              </div>
              <div>
                <code>./test-suites</code> - Relative path from current directory
              </div>
              <div>
                <code>../tests/api-suites</code> - Relative path from parent directory
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800">Requirements:</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Directory must exist and be readable</li>
              <li>• JSON files should follow the test suite schema</li>
              <li>• Files with .json extension will be automatically detected</li>
              <li>• Subdirectories will be scanned recursively</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={validatePath} variant="outline" disabled={isValidating}>
              {isValidating ? "Validating..." : "Validate Path"}
            </Button>
            <Button onClick={handleSave} disabled={!path.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save & Load
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
