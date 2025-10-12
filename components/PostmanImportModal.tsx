'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Save, Download, AlertCircle, Plus, FileText, Upload, Link, Zap, Activity, Code, X, CheckCircle, Folder, ExternalLink } from 'lucide-react';
import { PostmanParser, PostmanParseResult } from '@/lib/utils/postmanParser';
import { TestSuite } from '@/lib/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PostmanImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (testSuite: TestSuite) => void;
  onAddToExisting?: (suiteId: string, testCase: any) => void;
  existingSuites?: TestSuite[];
}

export const PostmanImportModal: React.FC<PostmanImportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddToExisting,
  existingSuites = []
}) => {
  const [collectionInput, setCollectionInput] = useState('');
  const [collectionUrl, setCollectionUrl] = useState('');
  const [parseResult, setParseResult] = useState<PostmanParseResult | null>(null);
  const [jsonOutput, setJsonOutput] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCollectionInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleUrlImport = async () => {
    if (!collectionUrl.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(collectionUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch collection: ${response.statusText}`);
      }
      const collection = await response.json();
      setCollectionInput(JSON.stringify(collection, null, 2));
    } catch (error) {
      setParseResult({ success: false, error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = () => {
    if (!collectionInput.trim()) return;
    
    const result = PostmanParser.parse(collectionInput);
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
      // Add all test cases from the collection
      parseResult.testSuite.testCases.forEach(testCase => {
        onAddToExisting(selectedSuiteId, testCase);
      });
      onClose();
    }
  };

  const handleDownload = () => {
    if (jsonOutput) {
      const blob = new Blob([jsonOutput], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `postman-import-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setCollectionInput('');
    setCollectionUrl('');
    setParseResult(null);
    setJsonOutput('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-orange-50/30 border-0 shadow-2xl" style={{zIndex: 9999}}>
        <DialogHeader className="pb-6 border-b border-slate-200/50">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Postman Collection Importer
              </div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                Convert Postman collections to TestFlow Pro test suites
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden pt-6">
          {/* Input Section */}
          <div className="flex flex-col space-y-6 overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-lg font-semibold text-slate-800">
                  Import Postman Collection
                </label>
              </div>
              
              <Tabs defaultValue="paste" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm border border-slate-200 shadow-lg">
                  <TabsTrigger value="paste" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Paste JSON</TabsTrigger>
                  <TabsTrigger value="file" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Upload File</TabsTrigger>
                  <TabsTrigger value="url" className="data-[state=active]:bg-white data-[state=active]:shadow-md">From URL</TabsTrigger>
                </TabsList>
              
                <TabsContent value="paste" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-slate-600" />
                      <label className="text-sm font-medium text-slate-700">
                        Paste Postman Collection JSON
                      </label>
                    </div>
                    <Textarea
                      value={collectionInput}
                      onChange={(e) => setCollectionInput(e.target.value)}
                      placeholder='{"info": {"name": "My API Collection"}, "item": [...]}'
                      className="h-40 font-mono text-sm bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300 resize-none"
                    />
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      <span>Export collection from Postman and paste the JSON here</span>
                    </div>
                  </div>
                </TabsContent>
              
                <TabsContent value="file" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-slate-600" />
                      <label className="text-sm font-medium text-slate-700">
                        Upload Collection File
                      </label>
                    </div>
                    <div className="border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 text-center hover:border-orange-400 hover:bg-orange-50 transition-all duration-300">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-slate-800 mb-2">
                        Drop your collection file here
                      </p>
                      <p className="text-sm text-slate-600 mb-4">
                        or click to browse and select
                      </p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="bg-white/70 backdrop-blur-sm border-orange-200 hover:bg-white hover:border-orange-300 hover:scale-105 transition-all duration-300"
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              
                <TabsContent value="url" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-slate-600" />
                      <label className="text-sm font-medium text-slate-700">
                        Import from URL
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        value={collectionUrl}
                        onChange={(e) => setCollectionUrl(e.target.value)}
                        placeholder="https://api.postman.com/collections/..."
                        className="flex-1 bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                      />
                      <Button 
                        onClick={handleUrlImport} 
                        disabled={isLoading || !collectionUrl.trim()}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        {isLoading ? 'Loading...' : 'Import'}
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded-lg">
                      <span className="font-medium">Supported:</span> Postman API URLs, public collection links, or shared collection URLs
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleParse} 
                disabled={!collectionInput.trim()}
                className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Zap className="h-4 w-4 mr-2" />
                Parse Collection
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="h-11 px-6 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
              >
                Reset
              </Button>
            </div>
            
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
                      ? 'border-orange-300 bg-orange-50 shadow-lg' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="new"
                      checked={importMode === 'new'}
                      onChange={(e) => setImportMode(e.target.value as 'new')}
                      className="w-5 h-5 text-orange-600"
                    />
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-orange-600" />
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
                      <SelectContent>
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

            {parseResult?.error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-red-800">Import Error</div>
                    <div className="text-sm text-red-700 mt-1">{parseResult.error}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="flex flex-col space-y-6 overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Code className="h-4 w-4 text-slate-600" />
                </div>
                <label className="text-lg font-semibold text-slate-800">
                  Generated Test Suite
                </label>
              </div>
              {jsonOutput && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2 h-10 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:scale-105 transition-all duration-300"
                  >
                    <Copy className="h-4 w-4" />
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
                      {importMode === 'new' ? 'Create Suite' : 'Add Test Cases'}
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
                {jsonOutput || '// Generated TestFlow Pro JSON will appear here...\n// Click "Parse Collection" to convert your Postman collection! 🚀'}
              </pre>
            </div>

            {parseResult?.success && parseResult.testSuite && (
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-800">
                      Collection Parsed Successfully!
                    </h4>
                    <p className="text-sm text-emerald-600">Ready to import into TestFlow Pro</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-slate-800">{parseResult.testSuite.testCases.length}</div>
                    <div className="text-xs text-slate-600">Test Cases</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-slate-800">
                      {parseResult.testSuite.testCases.reduce((sum, tc) => sum + tc.testData.length, 0)}
                    </div>
                    <div className="text-xs text-slate-600">Total Tests</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-slate-800">API</div>
                    <div className="text-xs text-slate-600">Suite Type</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};