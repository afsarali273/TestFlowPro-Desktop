'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Save, Download, AlertCircle, Plus, FileText, Play, Shield, Zap, Activity, Search, Code, X } from 'lucide-react';
import { CurlParser, CurlParseResult } from '@/lib/utils/curlParser';
import { TestSuite } from '@/lib/utils/types';

interface CurlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (testSuite: TestSuite) => void;
  onAddToExisting?: (suiteId: string, testCase: any) => void;
  existingSuites?: TestSuite[];
}

export const CurlImportModal: React.FC<CurlImportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddToExisting,
  existingSuites = []
}) => {
  const [curlInput, setCurlInput] = useState('');
  const [parseResult, setParseResult] = useState<CurlParseResult | null>(null);
  const [jsonOutput, setJsonOutput] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingCurl, setIsTestingCurl] = useState(false);
  const [jsonPath, setJsonPath] = useState('');
  const [filteredResult, setFilteredResult] = useState<any>(null);
  const [assertions, setAssertions] = useState<any[]>([]);

  const handleTestCurl = async () => {
    if (!curlInput.trim()) return;
    
    setIsTestingCurl(true);
    try {
      const response = await fetch('/api/test-curl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curlCommand: curlInput })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: 'Failed to execute cURL command' });
    } finally {
      setIsTestingCurl(false);
    }
  };

  const handleJsonPathFilter = () => {
    if (!testResult?.data || !jsonPath.trim()) {
      setFilteredResult(null);
      return;
    }

    try {
      // Simple JSONPath implementation for basic queries
      const data = testResult.data;
      let result = data;
      
      if (jsonPath === '$') {
        result = data;
      } else if (jsonPath.startsWith('$.')) {
        const path = jsonPath.substring(2);
        const parts = path.split('.');
        
        for (const part of parts) {
          if (part.includes('[') && part.includes(']')) {
            const [key, indexStr] = part.split('[');
            const index = parseInt(indexStr.replace(']', ''));
            result = key ? result[key][index] : result[index];
          } else {
            result = result[part];
          }
          if (result === undefined) break;
        }
      }
      
      setFilteredResult(result);
    } catch (error) {
      setFilteredResult({ error: 'Invalid JSONPath expression' });
    }
  };

  const addAssertion = (type: string, expected?: any) => {
    if (!jsonPath.trim()) return;
    
    const newAssertion = {
      type,
      jsonPath,
      ...(expected !== undefined && { expected })
    };
    
    setAssertions(prev => [...prev, newAssertion]);
  };

  const removeAssertion = (index: number) => {
    setAssertions(prev => prev.filter((_, i) => i !== index));
  };

  const updateTestSuiteWithAssertions = () => {
    if (!parseResult?.testSuite || assertions.length === 0) return;
    
    const updatedSuite = { ...parseResult.testSuite };
    if (updatedSuite.testCases[0]?.testData[0]) {
      updatedSuite.testCases[0].testData[0].assertions = [
        ...(updatedSuite.testCases[0].testData[0].assertions || []),
        ...assertions
      ];
    }
    
    setJsonOutput(JSON.stringify(updatedSuite, null, 2));
    setParseResult({ ...parseResult, testSuite: updatedSuite });
    setAssertions([]);
  };

  const handleParse = () => {
    if (!curlInput.trim()) return;
    
    const result = CurlParser.parse(curlInput);
    setParseResult(result);
    
    if (result.success && result.testSuite) {
      setJsonOutput(JSON.stringify(result.testSuite, null, 2));
    } else {
      setJsonOutput('');
    }
  };

  const handleCopy = async () => {
    if (jsonOutput) {
      await navigator.clipboard.writeText(jsonOutput);
    }
  };

  const handleSave = () => {
    if (!parseResult?.success || !parseResult.testSuite) return;
    
    if (importMode === 'new' && onSave) {
      const completeTestSuite = {
        ...parseResult.testSuite,
        status: 'Not Started',
        ...(savePath && { filePath: savePath })
      };
      
      // Update localStorage with new suite's baseUrl
      if (completeTestSuite.baseUrl) {
        localStorage.setItem('suiteBaseUrl', completeTestSuite.baseUrl);
      } else {
        localStorage.removeItem('suiteBaseUrl');
      }
      
      onSave(completeTestSuite);
      onClose();
    } else if (importMode === 'existing' && onAddToExisting && selectedSuiteId) {
      const testCase = parseResult.testSuite.testCases[0];
      onAddToExisting(selectedSuiteId, testCase);
      onClose();
    }
  };

  const handleDownload = () => {
    if (jsonOutput) {
      const blob = new Blob([jsonOutput], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curl-import-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setCurlInput('');
    setParseResult(null);
    setJsonOutput('');
    setTestResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border-0 shadow-2xl" style={{zIndex: 9999}}>
        <DialogHeader className="pb-4 border-b border-slate-200/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                cURL to TestFlow Pro
              </div>
              <div className="text-xs font-normal text-slate-600 mt-1">
                Convert cURL commands to test suites with live testing
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden pt-4">
          {/* Input Section */}
          <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <Copy className="h-3 w-3 text-emerald-600" />
                </div>
                <label className="text-base font-semibold text-slate-800">
                  cURL Command Input
                </label>
              </div>
              <Textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder="curl -X GET 'https://api.example.com/users' -H 'Authorization: Bearer token' -H 'Content-Type: application/json'"
                className="h-32 font-mono text-xs bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300 resize-none"
              />
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Paste your cURL command from browser dev tools, Postman, or any API client</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Test Results */}
              {testResult && (
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Activity className="h-3 w-3 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-base text-slate-800">Live API Response</h4>
                  </div>
                  {testResult.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        <span className="font-medium text-sm">Error</span>
                      </div>
                      <div className="text-red-600 text-xs mt-1">{testResult.error}</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${testResult.status < 400 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium text-sm">Status: <span className={testResult.status < 400 ? 'text-emerald-600' : 'text-red-600'}>{testResult.status}</span></span>
                        </div>
                        <span className="text-slate-600 font-medium text-sm">⚡ {testResult.time}ms</span>
                      </div>
                      
                      {testResult.data && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-600" />
                            <span className="font-medium text-slate-800">Response Data</span>
                          </div>
                          <pre className="p-4 bg-slate-900 text-green-400 rounded-xl text-xs max-h-40 overflow-auto border border-slate-700 font-mono shadow-inner">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {/* JSONPath Filter Section */}
                      <div className="border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                            <Search className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="font-medium text-slate-800">JSONPath Filter & Assertions</span>
                        </div>
                        <div className="flex gap-3 mb-3">
                          <Input
                            value={jsonPath}
                            onChange={(e) => setJsonPath(e.target.value)}
                            placeholder="$.data[0].name or $..id"
                            className="text-sm h-10 flex-1 bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                          />
                          <Button 
                            size="sm" 
                            onClick={handleJsonPathFilter} 
                            className="h-10 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          >
                            <Search className="h-4 w-4 mr-1" />
                            Filter
                          </Button>
                        </div>
                        
                        {filteredResult !== null && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-slate-700">Filtered Result:</div>
                            <pre className="p-3 bg-slate-900 text-green-400 rounded-xl text-xs max-h-32 overflow-auto border border-slate-700 font-mono shadow-inner">
                              {filteredResult?.error 
                                ? filteredResult.error 
                                : JSON.stringify(filteredResult, null, 2)}
                            </pre>
                            
                            {!filteredResult?.error && jsonPath && (
                              <div className="mt-3 flex gap-2 flex-wrap">
                                <Button size="sm" onClick={() => addAssertion('exists')} className="text-xs h-8 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Exists
                                </Button>
                                <Button size="sm" onClick={() => addAssertion('equals', filteredResult)} className="text-xs h-8 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Equals
                                </Button>
                                <Button size="sm" onClick={() => addAssertion('contains', filteredResult)} className="text-xs h-8 bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Contains
                                </Button>
                                <Button size="sm" onClick={() => addAssertion('type', typeof filteredResult)} className="text-xs h-8 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Type
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg">
                          <span className="font-medium">Examples:</span> <code className="bg-white px-1 rounded">$</code> (root), <code className="bg-white px-1 rounded">$.data</code> (data field), <code className="bg-white px-1 rounded">$.items[0]</code> (first item)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleTestCurl} 
                  disabled={isTestingCurl || !curlInput.trim()}
                  className="flex-1 h-9 text-sm bg-white/70 backdrop-blur-sm border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105 transition-all duration-300"
                >
                  <Play className="h-3 w-3 mr-1" />
                  {isTestingCurl ? 'Testing...' : 'Test Live'}
                </Button>
                <Button 
                  onClick={handleParse} 
                  disabled={!curlInput.trim()}
                  className="flex-1 h-9 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Convert to Suite
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="h-9 px-3 text-sm bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                >
                  Reset
                </Button>
              </div>
              
              {/* Assertions Section */}
              {assertions.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200/50 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Test Assertions</h4>
                        <p className="text-sm text-emerald-600">{assertions.length} assertion{assertions.length !== 1 ? 's' : ''} ready</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={updateTestSuiteWithAssertions} 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Apply to Suite
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {assertions.map((assertion, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200/30 shadow-sm">
                        <div className="flex items-center gap-3">
                          <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-700">{assertion.jsonPath}</code>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{assertion.type}</span>
                          {assertion.expected !== undefined && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono max-w-32 truncate">
                              {JSON.stringify(assertion.expected)}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => removeAssertion(index)} 
                          className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:border-red-300 hover:scale-110 transition-all duration-300"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {parseResult?.success && (
                <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <Download className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-lg text-slate-800">Import Options</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      importMode === 'new' 
                        ? 'border-blue-300 bg-blue-50 shadow-lg' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="new"
                        checked={importMode === 'new'}
                        onChange={(e) => setImportMode(e.target.value as 'new')}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-slate-800">Create New Suite</div>
                          <div className="text-xs text-slate-600">Start fresh with a new test suite</div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      importMode === 'existing' 
                        ? 'border-emerald-300 bg-emerald-50 shadow-lg' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="existing"
                        checked={importMode === 'existing'}
                        onChange={(e) => setImportMode(e.target.value as 'existing')}
                        className="w-5 h-5 text-emerald-600"
                      />
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-medium text-slate-800">Add to Existing</div>
                          <div className="text-xs text-slate-600">Extend an existing test suite</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {importMode === 'new' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Save Path (optional):
                      </label>
                      <Input
                        value={savePath}
                        onChange={(e) => setSavePath(e.target.value)}
                        placeholder="/path/to/save/suite.json"
                        className="text-sm"
                      />
                    </div>
                  )}
                  
                  {importMode === 'existing' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Select Existing Suite:
                      </label>
                      <Select value={selectedSuiteId} onValueChange={setSelectedSuiteId}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Choose a test suite" />
                        </SelectTrigger>
                        <SelectContent style={{ zIndex: 10000 }}>
                          {existingSuites.filter(s => s.type === 'API').map((suite) => (
                            <SelectItem key={suite.id} value={suite.id}>
                              {suite.suiteName} ({suite.testCases.length} cases)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {parseResult?.error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-red-800">Parsing Error</div>
                    <div className="text-sm text-red-700 mt-1">{parseResult.error}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Code className="h-3 w-3 text-slate-600" />
                </div>
                <label className="text-base font-semibold text-slate-800">
                  Generated Test Suite
                </label>
              </div>
              {jsonOutput && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-1 h-8 text-xs bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all duration-300"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-2 h-10 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all duration-300"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {(onSave || onAddToExisting) && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={
                        (importMode === 'new' && !onSave) ||
                        (importMode === 'existing' && (!onAddToExisting || !selectedSuiteId))
                      }
                      className="flex items-center gap-2 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Save className="h-4 w-4" />
                      {importMode === 'new' ? 'Create Suite' : 'Add Test Case'}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white/50 backdrop-blur-sm">
              <div className="h-8 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 text-center text-white text-xs font-medium">TestFlow Pro JSON</div>
              </div>
              <pre className="h-full overflow-auto p-6 text-sm font-mono bg-slate-900 text-green-400 leading-relaxed">
                {jsonOutput || '// Generated TestFlow Pro JSON will appear here...\n// Click "Convert to Suite" to see the magic! ✨'}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};