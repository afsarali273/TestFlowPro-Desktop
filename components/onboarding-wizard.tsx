"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Rocket,
  FolderOpen,
  CheckCircle,
  Globe,
  MousePointer,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText
} from 'lucide-react'

interface OnboardingWizardProps {
  isOpen: boolean
  onComplete: (config: OnboardingConfig) => void
  onSkip: () => void
}

export interface OnboardingConfig {
  testSuitePath: string
  frameworkPath: string
  testType: 'api' | 'ui' | 'both'
  loadSampleData: boolean
}

export function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<OnboardingConfig>({
    testSuitePath: '',
    frameworkPath: '',
    testType: 'both',
    loadSampleData: true
  })

  const totalSteps = 4
  const progress = ((currentStep + 1) / totalSteps) * 100

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    onComplete(config)
  }

  const handleAutoDetect = async (type: 'suite' | 'framework') => {
    try {
      const endpoint = type === 'suite' ? '/api/validate-path' : '/api/validate-framework'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: type === 'suite' ? './testSuites' : './TestFlowPro' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setConfig(prev => ({
            ...prev,
            [type === 'suite' ? 'testSuitePath' : 'frameworkPath']: data.path || (type === 'suite' ? './testSuites' : './TestFlowPro')
          }))
        }
      }
    } catch (error) {
      console.error('Auto-detect failed:', error)
    }
  }

  const steps = [
    // Step 0: Welcome
    {
      title: 'Welcome to TestFlowPro!',
      icon: <Rocket className="h-16 w-16 text-blue-600" />,
      content: (
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Rocket className="h-12 w-12 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Let's get you set up!</h2>
            <p className="text-muted-foreground">
              We'll walk you through the basics in less than 2 minutes
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">API Testing</p>
              <p className="text-xs text-muted-foreground mt-1">REST, SOAP, GraphQL</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <MousePointer className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">UI Testing</p>
              <p className="text-xs text-muted-foreground mt-1">Playwright Automation</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Sparkles className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">AI Powered</p>
              <p className="text-xs text-muted-foreground mt-1">Smart Generation</p>
            </div>
          </div>
        </div>
      )
    },
    // Step 1: Test Suite Path
    {
      title: 'Configure Test Suite Path',
      icon: <FolderOpen className="h-16 w-16 text-blue-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-6">
            <FolderOpen className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Where should we store your test suites?
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testSuitePath" className="text-base font-semibold mb-2 block">
                Test Suites Directory
              </Label>
              <div className="flex gap-2">
                <Input
                  id="testSuitePath"
                  value={config.testSuitePath}
                  onChange={(e) => setConfig(prev => ({ ...prev, testSuitePath: e.target.value }))}
                  placeholder="e.g., /Users/you/projects/tests/testSuites"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleAutoDetect('suite')}
                  className="flex-shrink-0"
                >
                  🔍 Auto-detect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This is where your test suite JSON files will be saved
              </p>
            </div>
            {config.testSuitePath && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Path configured successfully
                </p>
              </div>
            )}
          </div>
        </div>
      )
    },
    // Step 2: Framework Path
    {
      title: 'Configure Framework Path',
      icon: <FileText className="h-16 w-16 text-blue-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-6">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Where is the TestFlowPro framework located?
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="frameworkPath" className="text-base font-semibold mb-2 block">
                Framework Directory
              </Label>
              <div className="flex gap-2">
                <Input
                  id="frameworkPath"
                  value={config.frameworkPath}
                  onChange={(e) => setConfig(prev => ({ ...prev, frameworkPath: e.target.value }))}
                  placeholder="e.g., /Users/you/projects/TestFlowPro"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleAutoDetect('framework')}
                  className="flex-shrink-0"
                >
                  🔍 Auto-detect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This is where the TestFlowPro execution engine is installed
              </p>
            </div>
            {config.frameworkPath && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Framework path configured successfully
                </p>
              </div>
            )}
          </div>
        </div>
      )
    },
    // Step 3: Test Type & Sample Data
    {
      title: 'Choose Your Testing Focus',
      icon: <Sparkles className="h-16 w-16 text-blue-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-6">
            <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <p className="text-muted-foreground">
              What type of testing will you focus on?
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setConfig(prev => ({ ...prev, testType: 'api' }))}
              className={`p-6 rounded-lg border-2 transition-all ${
                config.testType === 'api'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Globe className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <p className="font-semibold">API Testing</p>
              <p className="text-xs text-muted-foreground mt-1">REST, SOAP, GraphQL</p>
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, testType: 'ui' }))}
              className={`p-6 rounded-lg border-2 transition-all ${
                config.testType === 'ui'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <MousePointer className="h-10 w-10 mx-auto mb-3 text-purple-600" />
              <p className="font-semibold">UI Testing</p>
              <p className="text-xs text-muted-foreground mt-1">Playwright, Selenium</p>
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, testType: 'both' }))}
              className={`p-6 rounded-lg border-2 transition-all ${
                config.testType === 'both'
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-600" />
              <p className="font-semibold">Both</p>
              <p className="text-xs text-muted-foreground mt-1">API + UI Testing</p>
            </button>
          </div>

          <div className="mt-8 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Load Sample Test Suites</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Get started quickly with example tests
                </p>
              </div>
              <Button
                variant={config.loadSampleData ? 'default' : 'outline'}
                onClick={() => setConfig(prev => ({ ...prev, loadSampleData: !prev.loadSampleData }))}
              >
                {config.loadSampleData ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Getting Started</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip Setup
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {steps[currentStep].content}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep === totalSteps - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!config.testSuitePath || !config.frameworkPath}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

