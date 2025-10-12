'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, FileText, Folder, CheckCircle, Code, Plus, Save, Copy, Download, AlertCircle, ExternalLink } from 'lucide-react';
import { TestSuite } from '@/lib/utils/types';

interface BrunoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (testSuite: TestSuite) => void;
  onAddToExisting?: (suiteId: string, testCase: any) => void;
  existingSuites?: TestSuite[];
}

export default function BrunoImportModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onAddToExisting, 
  existingSuites = [] 
}: BrunoImportModalProps) {
  const [suiteName, setSuiteName] = useState('Bruno Collection');
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [jsonOutput, setJsonOutput] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    Promise.all(
      uploadedFiles.map(file => 
        new Promise<{ name: string; content: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            name: file.name,
            content: e.target?.result as string
          });
          reader.readAsText(file);
        })
      )
    ).then(fileContents => {
      setFiles(fileContents);
      generatePreview(fileContents);
    });
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    Promise.all(
      uploadedFiles.map(file => 
        new Promise<{ name: string; content: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            name: file.webkitRelativePath || file.name,
            content: e.target?.result as string
          });
          reader.readAsText(file);
        })
      )
    ).then(fileContents => {
      setFiles(fileContents);
      generatePreview(fileContents);
    });
  };

  const generatePreview = async (fileContents: { name: string; content: string }[]) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/parse-bruno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileContents, suiteName })
      });

      if (!response.ok) {
        throw new Error('Failed to parse Bruno collection');
      }

      const result = await response.json();
      setPreview(result);
      if (result) {
        setJsonOutput(JSON.stringify(result, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse collection');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (jsonOutput) {
      await navigator.clipboard.writeText(jsonOutput);
    }
  };

  const handleDownload = () => {
    if (jsonOutput) {
      const blob = new Blob([jsonOutput], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bruno-import-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveImport = () => {
    if (!preview) return;
    
    if (importMode === 'new' && onSave) {
      const completeTestSuite = {
        ...preview,
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
      resetForm();
    } else if (importMode === 'existing' && onAddToExisting && selectedSuiteId) {
      // Add all test cases from the collection
      preview.testCases?.forEach((testCase: any) => {
        onAddToExisting(selectedSuiteId, testCase);
      });
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setSuiteName('Bruno Collection');
    setFiles([]);
    setPreview(null);
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 border-0 shadow-2xl" style={{zIndex: 9999}}>
        <DialogHeader className="pb-6 border-b border-slate-200/50">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Bruno Collection Importer
              </div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                Convert Bruno collections to TestFlow Pro test suites
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden pt-6">
          {/* Input Section */}
          <div className="flex flex-col space-y-6 overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-purple-600" />
                </div>
                <label className="text-lg font-semibold text-slate-800">
                  Import Bruno Collection
                </label>
              </div>
              
              <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-slate-600" />
                  <label className="text-sm font-medium text-slate-700">Suite Name</label>
                </div>
                <Input
                  value={suiteName}
                  onChange={(e) => setSuiteName(e.target.value)}
                  placeholder="Enter suite name"
                  className="bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                />
              </div>

              <Tabs defaultValue="files" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm border border-slate-200 shadow-lg">
                  <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </TabsTrigger>
                  <TabsTrigger value="folder" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Folder className="w-4 h-4" />
                    Upload Folder
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="files" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <label className="text-sm font-medium text-slate-700">
                        Select Bruno Files
                      </label>
                    </div>
                    <div className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all duration-300">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-slate-800 mb-2">
                        Drop your Bruno files here
                      </p>
                      <p className="text-sm text-slate-600 mb-4">
                        or click to browse and select
                      </p>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        accept=".bru,.env"
                        onChange={handleFilesUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('files')?.click()}
                        className="bg-white/70 backdrop-blur-sm border-purple-200 hover:bg-white hover:border-purple-300 hover:scale-105 transition-all duration-300"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded-lg">
                      <span className="font-medium">Supported:</span> .bru files and .env files from your Bruno collection
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="folder" className="space-y-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-slate-600" />
                      <label className="text-sm font-medium text-slate-700">
                        Select Collection Folder
                      </label>
                    </div>
                    <div className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all duration-300">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Folder className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-slate-800 mb-2">
                        Drop your Bruno collection folder here
                      </p>
                      <p className="text-sm text-slate-600 mb-4">
                        or click to browse and select
                      </p>
                      <input
                        id="folder"
                        type="file"
                        {...({ webkitdirectory: '' } as any)}
                        multiple
                        onChange={handleFolderUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('folder')?.click()}
                        className="bg-white/70 backdrop-blur-sm border-purple-200 hover:bg-white hover:border-purple-300 hover:scale-105 transition-all duration-300"
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        Choose Folder
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded-lg">
                      <span className="font-medium">Supported:</span> Select the entire Bruno collection folder
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Button 
              onClick={() => generatePreview(files)} 
              disabled={files.length === 0 || loading}
              className="w-full h-11 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Code className="h-4 w-4 mr-2" />
              {loading ? 'Parsing...' : 'Parse Collection'}
            </Button>

            {files.length > 0 && (
              <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-lg text-slate-800">Loaded Files ({files.length})</h4>
                </div>
                <div className="bg-white/60 rounded-xl p-4 max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-white/50 rounded-lg">
                        <FileText className="w-3 h-3 text-purple-500" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {preview && (
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
                      ? 'border-purple-300 bg-purple-50 shadow-lg' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="new"
                      checked={importMode === 'new'}
                      onChange={(e) => setImportMode(e.target.value as 'new')}
                      className="w-5 h-5 text-purple-600"
                    />
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-purple-600" />
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
                      className="text-sm bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                    />
                  </div>
                )}
                
                {importMode === 'existing' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Select Existing Suite:
                    </label>
                    <Select value={selectedSuiteId} onValueChange={setSelectedSuiteId}>
                      <SelectTrigger className="text-sm bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300">
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

            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-red-800">Import Error</div>
                    <div className="text-sm text-red-700 mt-1">{error}</div>
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
                      onClick={handleSaveImport}
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
                {jsonOutput || '// Generated TestFlow Pro JSON will appear here...\n// Upload Bruno files and click "Parse Collection" to convert! 🚀'}
              </pre>
            </div>

            {loading && (
              <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg animate-pulse">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-700 font-medium">Parsing Bruno collection...</p>
                <p className="text-slate-500 text-sm mt-1">Converting requests to TestFlow Pro format</p>
              </div>
            )}

            {preview && (
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
                    <div className="text-2xl font-bold text-slate-800">{preview.testCases?.length || 0}</div>
                    <div className="text-xs text-slate-600">Test Cases</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-slate-800">
                      {preview.testCases?.reduce((sum: number, tc: any) => sum + (tc.testData?.length || 0), 0) || 0}
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
}