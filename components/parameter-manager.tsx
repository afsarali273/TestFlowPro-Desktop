"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { InputWithGenerator } from "./input-with-generator"
import {
  Database,
  FileText,
  Upload,
  Download,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Play,
  Edit,
  X,
  Info
} from "lucide-react"
import type { TestCaseParameters, ParameterSource } from "@/types/test-suite"

interface ParameterManagerProps {
  parameters?: TestCaseParameters
  onParametersChange: (parameters: TestCaseParameters | undefined) => void
  testCaseName: string
}

export function ParameterManager({ parameters, onParametersChange, testCaseName }: ParameterManagerProps) {
  const { toast } = useToast()
  const [isEnabled, setIsEnabled] = useState(parameters?.enabled || false)
  const [dataSource, setDataSource] = useState<ParameterSource>(
    parameters?.dataSource || { type: "inline", data: [] }
  )
  const [parameterMapping, setParameterMapping] = useState<Record<string, string>>(
    parameters?.parameterMapping || {}
  )
  const [previewData, setPreviewData] = useState<any[]>([])

  // Update preview data when dataSource or parameterMapping changes
  useEffect(() => {
    if (dataSource.data && dataSource.data.length > 0) {
      setPreviewData(dataSource.data.slice(0, 5))
    } else {
      setPreviewData([])
    }
  }, [dataSource.data])
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    if (isEnabled) {
      onParametersChange({
        enabled: isEnabled,
        dataSource,
        parameterMapping
      })
    } else {
      onParametersChange(undefined)
    }
  }, [isEnabled, dataSource, parameterMapping])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoadingFile(true)
    setFileError(null)

    try {
      const text = await file.text()
      let parsedData: any[] = []

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.trim().split('\n')
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header row and one data row')
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        parsedData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })
      } else if (file.name.endsWith('.json')) {
        // Parse JSON
        parsedData = JSON.parse(text)
        if (!Array.isArray(parsedData)) {
          throw new Error('JSON file must contain an array of objects')
        }
      } else {
        throw new Error('Only CSV and JSON files are supported')
      }

      setDataSource({
        type: file.name.endsWith('.csv') ? 'csv' : 'json',
        filePath: file.name,
        data: parsedData
      })

      toast({
        title: "File Loaded Successfully",
        description: `Loaded ${parsedData.length} parameter sets from ${file.name}`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse file'
      setFileError(errorMessage)
      toast({
        title: "File Load Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoadingFile(false)
    }
  }

  const addInlineParameter = () => {
    const newData = [...(dataSource.data || []), {}]
    setDataSource({ ...dataSource, data: newData })
  }

  const updateInlineParameter = (index: number, key: string, value: string) => {
    const newData = [...(dataSource.data || [])]
    newData[index] = { ...newData[index], [key]: value }
    setDataSource({ ...dataSource, data: newData })
  }

  const removeInlineParameter = (index: number) => {
    const newData = (dataSource.data || []).filter((_, i) => i !== index)
    setDataSource({ ...dataSource, data: newData })
  }

  const removeParameterField = (rowIndex: number, paramKey: string) => {
    const newData = [...(dataSource.data || [])]
    const newRow = { ...newData[rowIndex] }
    delete newRow[paramKey]
    newData[rowIndex] = newRow
    setDataSource({ ...dataSource, data: newData })
  }

  const addParameterMapping = () => {
    const newKey = `param${Object.keys(parameterMapping).length + 1}`
    setParameterMapping({ ...parameterMapping, [newKey]: `{{param.${newKey}}}` })
  }

  const updateParameterMapping = (oldKey: string, newKey: string, value: string) => {
    const newMapping = { ...parameterMapping }
    delete newMapping[oldKey]
    newMapping[newKey] = value
    setParameterMapping(newMapping)
  }

  const removeParameterMapping = (key: string) => {
    const newMapping = { ...parameterMapping }
    delete newMapping[key]
    setParameterMapping(newMapping)
  }

  const getAvailableParameters = () => {
    if (!dataSource.data || dataSource.data.length === 0) return []
    return Object.keys(dataSource.data[0] || {})
  }

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Parameter Configuration
              </CardTitle>
              <CardDescription className="text-slate-600">
                Configure data-driven parameters for {testCaseName}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="enable-parameters" className="text-sm font-medium">
              Enable Parameters
            </Label>
            <Switch
              id="enable-parameters"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-6">
          <Tabs defaultValue="datasource" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="datasource" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Data Source
              </TabsTrigger>
              <TabsTrigger value="mapping" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Parameter Mapping
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="datasource" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Data Source Type</Label>
                  <Select
                    value={dataSource.type}
                    onValueChange={(value: "csv" | "json" | "inline") => 
                      setDataSource({ type: value, data: value === "inline" ? [] : undefined })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="json">JSON File</SelectItem>
                      <SelectItem value="inline">Inline Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(dataSource.type === "csv" || dataSource.type === "json") && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Upload File</Label>
                      <div className="mt-2">
                        <Input
                          type="file"
                          accept={dataSource.type === "csv" ? ".csv" : ".json"}
                          onChange={handleFileUpload}
                          disabled={isLoadingFile}
                        />
                      </div>
                      {isLoadingFile && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading file...
                        </div>
                      )}
                      {fileError && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {fileError}
                        </div>
                      )}
                      {dataSource.filePath && !fileError && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Loaded: {dataSource.filePath} ({dataSource.data?.length || 0} rows)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {dataSource.type === "inline" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                          <Database className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-slate-900">Inline Parameter Data</Label>
                          <p className="text-xs text-slate-600">Create parameter sets directly in the interface</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={addInlineParameter}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Parameter Set
                      </Button>
                    </div>
                    
                    {dataSource.data && dataSource.data.length > 0 ? (
                      <div className="space-y-4">
                        {dataSource.data.map((row, index) => (
                          <div key={index} className="group relative">
                            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">Set {index + 1}</span>
                                  <Badge variant="outline" className="text-xs bg-slate-50 px-1.5 py-0.5">
                                    {Object.keys(row).length}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeInlineParameter(index)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                {Object.entries(row).map(([key, value]) => (
                                  <div key={key} className="bg-slate-50/50 rounded-md p-2 border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                      {Object.keys(row).length > 1 && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeParameterField(index, key)}
                                          className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        ref={(el) => { inputRefs.current[`${index}-${key}-name`] = el }}
                                        placeholder="Parameter name"
                                        value={key}
                                        onChange={(e) => {
                                          const newValue = e.target.value
                                          const cursorPosition = e.target.selectionStart
                                          const newRow = { ...row }
                                          delete newRow[key]
                                          newRow[newValue || ''] = value
                                          const newData = [...(dataSource.data || [])]
                                          newData[index] = newRow
                                          setDataSource({ ...dataSource, data: newData })
                                          
                                          setTimeout(() => {
                                            const input = inputRefs.current[`${index}-${newValue || ''}-name`]
                                            if (input) {
                                              input.focus()
                                              input.setSelectionRange(cursorPosition || 0, cursorPosition || 0)
                                            }
                                          }, 0)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                          }
                                        }}
                                        className="h-8 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                                      />
                                      <InputWithGenerator
                                        placeholder="Parameter value"
                                        value={value as string}
                                        onChange={(e) => updateInlineParameter(index, key, e.target.value)}
                                        onGenerate={(generatedValue) => updateInlineParameter(index, key, generatedValue)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                          }
                                        }}
                                        className="h-8 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                                      />
                                    </div>
                                  </div>
                                ))}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateInlineParameter(index, `param${Object.keys(row).length + 1}`, '')}
                                  className="w-full mt-2 h-7 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Field
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Database className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Parameter Sets Yet</h3>
                        <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                          Create inline parameter sets to define test data directly in the interface. Each set represents one test execution.
                        </p>
                        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200 text-left max-w-md mx-auto">
                          <p className="text-xs font-medium text-blue-800 mb-2">💡 Data Type Tips:</p>
                          <div className="text-xs text-blue-700 space-y-1">
                            <div>• Numbers: Use <code className="bg-blue-100 px-1 rounded">25</code> (auto-detected)</div>
                            <div>• Booleans: Use <code className="bg-blue-100 px-1 rounded">true</code> or <code className="bg-blue-100 px-1 rounded">false</code></div>
                            <div>• Strings: Use <code className="bg-blue-100 px-1 rounded">John Doe</code> (auto-quoted)</div>
                          </div>
                        </div>
                        <Button 
                          onClick={addInlineParameter}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Parameter Set
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Parameter Mapping</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Map parameter names to template variables used in test data
                    </p>
                  </div>
                  <Button size="sm" onClick={addParameterMapping}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Mapping
                  </Button>
                </div>

                {Object.keys(parameterMapping).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(parameterMapping).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Input
                          ref={(el) => { inputRefs.current[`mapping-${key}-name`] = el }}
                          placeholder="Parameter name"
                          value={key}
                          onChange={(e) => {
                            const newValue = e.target.value
                            const cursorPosition = e.target.selectionStart
                            updateParameterMapping(key, newValue, value)
                            
                            setTimeout(() => {
                              const input = inputRefs.current[`mapping-${newValue}-name`]
                              if (input) {
                                input.focus()
                                input.setSelectionRange(cursorPosition || 0, cursorPosition || 0)
                              }
                            }, 0)
                          }}
                          className="flex-1"
                        />
                        <span className="text-gray-400">→</span>
                        <InputWithGenerator
                          placeholder="Template variable (e.g., {{param.username}})"
                          value={value}
                          onChange={(e) => {
                            const newValue = e.target.value
                            updateParameterMapping(key, key, newValue)
                          }}
                          onGenerate={(generatedValue) => updateParameterMapping(key, key, generatedValue)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeParameterMapping(key)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No parameter mappings defined</p>
                    <p className="text-xs text-gray-400">Add mappings to use parameters in test data</p>
                  </div>
                )}

                {getAvailableParameters().length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium text-blue-800">Available Parameters:</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getAvailableParameters().map(param => (
                        <Badge key={param} variant="outline" className="text-xs bg-blue-100 text-blue-700">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900">How Parameter Mapping Works</h4>
                      <div className="text-sm text-slate-600 space-y-2">
                        <p>Parameter mapping allows you to use data from your CSV/JSON files in test cases using template variables.</p>
                        <div className="space-y-1">
                          <p className="font-medium">Example:</p>
                          <div className="bg-white p-2 rounded border text-xs font-mono">
                            <div className="text-slate-500">// CSV Data: username,email,age</div>
                            <div className="text-slate-500">// john_doe,john@test.com,25</div>
                            <div className="mt-1">
                              <span className="text-blue-600">username</span> → <span className="text-green-600">{'{{param.username}}'}</span>
                            </div>
                            <div>
                              <span className="text-blue-600">email</span> → <span className="text-green-600">{'{{param.email}}'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Usage in Test Data:</p>
                          <div className="bg-white p-2 rounded border text-xs font-mono">
                            <div>"endpoint": "/users/{'{{param.username}}'}"</div>
                            <div>"body": {`{ "email": "{{param.email}}" }`}</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">Data Type Handling:</p>
                          <div className="bg-white p-2 rounded border text-xs font-mono space-y-1">
                            <div className="text-slate-500">// For strings (with quotes):</div>
                            <div>"name": "{'{{username}}'}"</div>
                            <div className="text-slate-500">// For numbers (without quotes):</div>
                            <div>"age": {`{{age}}`}</div>
                            <div className="text-slate-500">// For booleans (without quotes):</div>
                            <div>"active": {`{{isActive}}`}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Parameter Data Preview</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Preview of parameter data that will be used for test execution
                </p>
              </div>

              {previewData.length > 0 ? (
                <ScrollArea className="h-64 w-full border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        {Object.keys(previewData[0] || {}).map(key => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex} className="max-w-32 truncate">
                              {String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No parameter data to preview</p>
                  <p className="text-xs text-gray-400">Configure a data source to see preview</p>
                </div>
              )}

              {dataSource.data && dataSource.data.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  Showing first 5 rows of {dataSource.data.length} total rows
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}