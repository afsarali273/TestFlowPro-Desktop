"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, X, AlertCircle, CheckCircle, Terminal } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FrameworkConfigModalProps {
  onSave: (path: string) => void
  onCancel: () => void
  currentPath?: string
}

export function FrameworkConfigModal({ onSave, onCancel, currentPath = "" }: FrameworkConfigModalProps) {
  const [path, setPath] = useState(currentPath)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
    hasRunner?: boolean
    hasPackageJson?: boolean
  } | null>(null)

  const validateFrameworkPath = async () => {
    if (!path.trim()) {
      setValidationResult({
        isValid: false,
        message: "Please enter a framework path",
      })
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch(`/api/validate-framework?path=${encodeURIComponent(path)}`)
      const result = await response.json()
      setValidationResult(result)
    } catch (error) {
      setValidationResult({
        isValid: false,
        message:
          "Failed to validate framework path. Please check if the path exists and contains your automation framework.",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = () => {
    if (validationResult?.isValid) {
      onSave(path)
    } else {
      validateFrameworkPath()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Configure Automation Framework Path
          </CardTitle>
          <CardDescription>
            Specify the directory path where your automation framework is located (containing src/runner.ts)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="frameworkPath">Automation Framework Directory Path</Label>
            <div className="flex gap-2">
              <Input
                id="frameworkPath"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value)
                  setValidationResult(null)
                }}
                placeholder="/path/to/your/automation-framework"
                className="flex-1"
              />
              <Button variant="outline" onClick={() => alert("Directory browser would open here")}>
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
                  {validationResult.hasRunner && (
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">✓ runner.ts found</Badge>
                      {validationResult.hasPackageJson && <Badge variant="secondary">✓ package.json found</Badge>}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Expected Framework Structure:</h4>
            <div className="space-y-1 text-sm text-gray-600 font-mono">
              <div>your-framework/</div>
              <div>├── src/</div>
              <div>│ └── runner.ts</div>
              <div>├── package.json</div>
              <div>└── node_modules/</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800">Current Command:</h4>
            <code className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
              npx ts-node src/runner.ts --serviceName=@UserService --suiteType=@smoke
            </code>
            <p className="text-sm text-blue-700 mt-2">
              The UI will execute this command with the appropriate parameters based on your test suite tags.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={validateFrameworkPath} variant="outline" disabled={isValidating}>
              {isValidating ? "Validating..." : "Validate Path"}
            </Button>
            <Button onClick={handleSave} disabled={!path.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
