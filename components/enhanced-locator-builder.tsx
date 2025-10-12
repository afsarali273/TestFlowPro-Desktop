"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, HelpCircle, Zap, Filter, Link, Eye, Code } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LocatorDefinition {
  strategy: string
  value: string
  options?: Record<string, any>
  filter?: {
    type: string
    value: string
    regex?: boolean
    locator?: LocatorDefinition
  }
  filters?: Array<{
    type: string
    value: string
    regex?: boolean
    locator?: LocatorDefinition
  }>
  chain?: Array<LocatorDefinition & {
    filters?: Array<{
      type: string
      value: string
      regex?: boolean
      locator?: LocatorDefinition
    }>
  }>
  index?: string | number
}

interface EnhancedLocatorBuilderProps {
  locator?: LocatorDefinition
  onChange: (locator: LocatorDefinition) => void
  className?: string
}

export function EnhancedLocatorBuilder({ locator, onChange, className = "" }: EnhancedLocatorBuilderProps) {
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple')
  const [showPreview, setShowPreview] = useState(false)

  // Initialize with default values
  const currentLocator: LocatorDefinition = locator || {
    strategy: 'role',
    value: '',
    options: {},
  }

  const handleBaseLocatorChange = (field: keyof LocatorDefinition, value: any) => {
    const updated = { ...currentLocator, [field]: value }
    onChange(updated)
  }

  const handleOptionChange = (key: string, value: any) => {
    const updated = {
      ...currentLocator,
      options: {
        ...currentLocator.options,
        [key]: value || undefined
      }
    }
    // Clean up empty options
    if (!value) {
      delete updated.options![key]
    }
    onChange(updated)
  }

  const handleFilterChange = (filterData: any) => {
    const updated = {
      ...currentLocator,
      filter: filterData || undefined
    }
    onChange(updated)
  }

  const handleFiltersChange = (filtersData: any[]) => {
    const updated = {
      ...currentLocator,
      filters: filtersData.length > 0 ? filtersData : undefined
    }
    onChange(updated)
  }

  const addFilter = () => {
    const newFilter = {
      type: 'hasText',
      value: '',
      regex: false
    }
    const currentFilters = currentLocator.filters || []
    handleFiltersChange([...currentFilters, newFilter])
  }

  const removeFilter = (index: number) => {
    const currentFilters = currentLocator.filters || []
    handleFiltersChange(currentFilters.filter((_, i) => i !== index))
  }

  const updateFilter = (index: number, filter: any) => {
    const currentFilters = currentLocator.filters || []
    const updated = currentFilters.map((f, i) => i === index ? filter : f)
    handleFiltersChange(updated)
  }

  const handleChainChange = (chainData: LocatorDefinition[]) => {
    const updated = {
      ...currentLocator,
      chain: chainData.length > 0 ? chainData : undefined
    }
    onChange(updated)
  }

  const addChainStep = () => {
    const newStep: LocatorDefinition = {
      strategy: 'role',
      value: 'button'
    }
    const currentChain = currentLocator.chain || []
    handleChainChange([...currentChain, newStep])
  }

  const removeChainStep = (index: number) => {
    const currentChain = currentLocator.chain || []
    handleChainChange(currentChain.filter((_, i) => i !== index))
  }

  const updateChainStep = (index: number, step: LocatorDefinition) => {
    const currentChain = currentLocator.chain || []
    const updated = currentChain.map((s, i) => i === index ? step : s)
    handleChainChange(updated)
  }

  // Generate Playwright code preview
  const generatePlaywrightCode = (): string => {
    let code = `page.`
    
    // Base locator
    switch (currentLocator.strategy) {
      case 'role':
        code += `getByRole('${currentLocator.value}'`
        if (currentLocator.options?.name) {
          code += `, { name: '${currentLocator.options.name}' }`
        }
        code += ')'
        break
      case 'text':
        code += `getByText('${currentLocator.value}'`
        if (currentLocator.options?.exact) {
          code += `, { exact: true }`
        }
        code += ')'
        break
      case 'testId':
        code += `getByTestId('${currentLocator.value}')`
        break
      case 'css':
        code += `locator('${currentLocator.value}')`
        break
      case 'xpath':
        code += `locator('${currentLocator.value}')`
        break
      default:
        code += `getBy${currentLocator.strategy.charAt(0).toUpperCase() + currentLocator.strategy.slice(1)}('${currentLocator.value}')`
    }

    // Add filter (legacy single filter)
    if (currentLocator.filter) {
      code += `.filter({ ${currentLocator.filter.type}: `
      if (currentLocator.filter.regex) {
        code += `/${currentLocator.filter.value}/`
      } else {
        code += `'${currentLocator.filter.value}'`
      }
      code += ' })'
    }

    // Add multiple filters
    if (currentLocator.filters && currentLocator.filters.length > 0) {
      currentLocator.filters.forEach(filter => {
        code += `.filter({ ${filter.type}: `
        if (filter.type === 'has' || filter.type === 'hasNot') {
          // For 'has' filters, the value should be a locator expression
          code += filter.value
        } else if (filter.regex) {
          code += `/${filter.value}/`
        } else {
          code += `'${filter.value}'`
        }
        code += ' })'
      })
    }

    // Add chain
    if (currentLocator.chain && currentLocator.chain.length > 0) {
      currentLocator.chain.forEach(chainStep => {
        let step
        
        // Handle both ChainStep format and direct LocatorDefinition format
        if (chainStep.operation === 'locator' && chainStep.locator) {
          step = chainStep.locator
        } else if (chainStep.strategy) {
          step = chainStep
        } else {
          return // Skip invalid chain steps
        }
        
        switch (step.strategy) {
          case 'role':
            code += `.getByRole('${step.value}'`
            if (step.options?.name) {
              code += `, { name: '${step.options.name}' }`
            }
            code += ')'
            break
          case 'text':
            code += `.getByText('${step.value}'`
            if (step.options?.exact) {
              code += `, { exact: true }`
            }
            code += ')'
            break
          case 'testId':
            code += `.getByTestId('${step.value}')`
            break
          default:
            code += `.getBy${step.strategy.charAt(0).toUpperCase() + step.strategy.slice(1)}('${step.value}')`
        }
        
        // Add filters for this chained element
        if (step.filters && step.filters.length > 0) {
          step.filters.forEach(filter => {
            code += `.filter({ ${filter.type}: `
            if (filter.type === 'has' || filter.type === 'hasNot') {
              code += filter.value
            } else if (filter.regex) {
              code += `/${filter.value}/`
            } else {
              code += `'${filter.value}'`
            }
            code += ' })'
          })
        }
      })
    }

    // Add index
    if (currentLocator.index !== undefined) {
      if (currentLocator.index === 'first') {
        code += '.first()'
      } else if (currentLocator.index === 'last') {
        code += '.last()'
      } else {
        code += `.nth(${currentLocator.index})`
      }
    }

    return code
  }

  const isComplexLocator = !!(currentLocator.filter || currentLocator.filters || currentLocator.chain || currentLocator.index !== undefined)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Smart Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">Element Locator</Label>
          {isComplexLocator && (
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
              <Filter className="h-3 w-3 mr-1" />
              Advanced
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-8 px-3 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            {showPreview ? 'Hide' : 'Preview'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'simple' ? 'advanced' : 'simple')}
            className="h-8 px-3 text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            {activeTab === 'simple' ? 'Advanced' : 'Simple'}
          </Button>
        </div>
      </div>

      {/* Code Preview */}
      {showPreview && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4" />
              Playwright Code Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs font-mono bg-slate-100 p-2 rounded block overflow-x-auto">
              {generatePlaywrightCode()}
            </code>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'simple' | 'advanced')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simple">Simple Mode</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="simple" className="space-y-4">
          {/* Basic Locator */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Strategy</Label>
                <div className="group relative">
                  <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    <div className="font-semibold mb-2 text-blue-300">🎯 Locator Strategies</div>
                    <div className="space-y-1">
                      <div><span className="text-green-300">role:</span> <code className="text-yellow-200">"button"</code> - Semantic elements</div>
                      <div><span className="text-green-300">testId:</span> <code className="text-yellow-200">"submit-btn"</code> - data-testid</div>
                      <div><span className="text-green-300">text:</span> <code className="text-yellow-200">"Sign Up"</code> - Text content</div>
                      <div><span className="text-green-300">css:</span> <code className="text-yellow-200">".btn-primary"</code> - CSS selectors</div>
                    </div>
                  </div>
                </div>
              </div>
              <Select
                value={currentLocator.strategy}
                onValueChange={(value) => handleBaseLocatorChange('strategy', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="testId">Test ID</SelectItem>
                  <SelectItem value="label">Label</SelectItem>
                  <SelectItem value="placeholder">Placeholder</SelectItem>
                  <SelectItem value="css">CSS Selector</SelectItem>
                  <SelectItem value="xpath">XPath</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Value</Label>
              <Input
                value={currentLocator.value}
                onChange={(e) => handleBaseLocatorChange('value', e.target.value)}
                placeholder={
                  currentLocator.strategy === 'role' ? 'button, link, textbox' :
                  currentLocator.strategy === 'css' ? '.class, #id' :
                  currentLocator.strategy === 'xpath' ? '//div[@class="example"]' :
                  'Enter value'
                }
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Index</Label>
              <Select
                value={currentLocator.index?.toString() || 'none'}
                onValueChange={(value) => 
                  handleBaseLocatorChange('index', 
                    value === 'none' ? undefined : 
                    value === 'first' || value === 'last' ? value : 
                    Number(value)
                  )
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                  <SelectItem value="last">Last</SelectItem>
                  <SelectItem value="0">Index 0</SelectItem>
                  <SelectItem value="1">Index 1</SelectItem>
                  <SelectItem value="2">Index 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Options */}
          {(currentLocator.strategy === 'role' || currentLocator.strategy === 'text') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Name/Text</Label>
                <Input
                  value={currentLocator.options?.name || ''}
                  onChange={(e) => handleOptionChange('name', e.target.value)}
                  placeholder={currentLocator.strategy === 'role' ? 'Subscribe, Login' : 'Button text'}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Options</Label>
                <div className="flex items-center space-x-4 h-9">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!currentLocator.options?.exact}
                      onChange={(e) => handleOptionChange('exact', e.target.checked || undefined)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Exact match</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Smart Filter Detection */}
          {isComplexLocator && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Complex Locator Detected</span>
              </div>
              <p className="text-xs text-purple-700 mb-3">
                This locator uses advanced features like filtering or chaining. Switch to Advanced Mode for full control.
              </p>
              <Button
                size="sm"
                onClick={() => setActiveTab('advanced')}
                className="bg-purple-600 hover:bg-purple-700 text-white h-8"
              >
                <Zap className="h-3 w-3 mr-1" />
                Switch to Advanced Mode
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* Base Locator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Base Locator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Strategy</Label>
                  <Select
                    value={currentLocator.strategy}
                    onValueChange={(value) => handleBaseLocatorChange('strategy', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="testId">Test ID</SelectItem>
                      <SelectItem value="label">Label</SelectItem>
                      <SelectItem value="placeholder">Placeholder</SelectItem>
                      <SelectItem value="css">CSS Selector</SelectItem>
                      <SelectItem value="xpath">XPath</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Value</Label>
                  <Input
                    value={currentLocator.value}
                    onChange={(e) => handleBaseLocatorChange('value', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Index</Label>
                  <Select
                    value={currentLocator.index?.toString() || 'none'}
                    onValueChange={(value) => 
                      handleBaseLocatorChange('index', 
                        value === 'none' ? undefined : 
                        value === 'first' || value === 'last' ? value : 
                        Number(value)
                      )
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="first">First</SelectItem>
                      <SelectItem value="last">Last</SelectItem>
                      <SelectItem value="0">Index 0</SelectItem>
                      <SelectItem value="1">Index 1</SelectItem>
                      <SelectItem value="2">Index 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Name</Label>
                  <Input
                    value={currentLocator.options?.name || ''}
                    onChange={(e) => handleOptionChange('name', e.target.value)}
                    placeholder="Accessible name"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Options</Label>
                  <div className="flex items-center space-x-4 h-9">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!currentLocator.options?.exact}
                        onChange={(e) => handleOptionChange('exact', e.target.checked || undefined)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Exact</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multiple Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters (Optional)
                </CardTitle>
                <Button
                  size="sm"
                  onClick={addFilter}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentLocator.filters && currentLocator.filters.length > 0 ? (
                currentLocator.filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Filter Type</Label>
                        <Select
                          value={filter.type}
                          onValueChange={(value) => updateFilter(index, { ...filter, type: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hasText">Has Text</SelectItem>
                            <SelectItem value="hasNotText">Has Not Text</SelectItem>
                            <SelectItem value="has">Has Element</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Filter Value</Label>
                        <Input
                          value={filter.value}
                          onChange={(e) => updateFilter(index, { ...filter, value: e.target.value })}
                          placeholder={filter.type === 'has' ? 'page.getByRole("button")' : 'Text to filter by'}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Options</Label>
                        <div className="flex items-center space-x-2 h-9">
                          <input
                            type="checkbox"
                            checked={filter.regex || false}
                            onChange={(e) => updateFilter(index, { ...filter, regex: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Regex</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFilter(index)}
                      className="h-9 w-9 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No filters applied</p>
                  <p className="text-xs">Add filters to narrow down element selection</p>
                </div>
              )}
              
              {/* Legacy single filter support */}
              {currentLocator.filter && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Legacy Filter Detected</span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-3">
                    Found legacy single filter: {currentLocator.filter.type} = "{currentLocator.filter.value}"
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Convert legacy filter to new filters array
                      const newFilters = [currentLocator.filter!]
                      handleFiltersChange(newFilters)
                      handleFilterChange(undefined)
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white h-8"
                  >
                    Convert to New Format
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chain */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Chained Locators (Optional)
                </CardTitle>
                <Button
                  size="sm"
                  onClick={addChainStep}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Chain
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentLocator.chain && currentLocator.chain.length > 0 ? (
                currentLocator.chain.map((step, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Strategy</Label>
                        <Select
                          value={step.strategy}
                          onValueChange={(value) => updateChainStep(index, { ...step, strategy: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="role">Role</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="testId">Test ID</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Value</Label>
                        <Input
                          value={step.value}
                          onChange={(e) => updateChainStep(index, { ...step, value: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeChainStep(index)}
                      className="h-9 w-9 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chained locators</p>
                  <p className="text-xs">Chain locators for complex element targeting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}