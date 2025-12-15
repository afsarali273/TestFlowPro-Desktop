'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Save, Download, AlertCircle, Plus, FileText, Play, Shield, Activity, Search, Code, X } from 'lucide-react';
import { SoapParser, SoapParseResult } from '@/lib/utils/soapParser';
import { TestSuite } from '@/types/test-suite';

interface SoapImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (testSuite: TestSuite) => void;
  onAddToExisting?: (suiteId: string, testCase: any) => void;
  existingSuites?: TestSuite[];
}

export const SoapImportModal: React.FC<SoapImportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddToExisting,
  existingSuites = []
}) => {
  const [inputType, setInputType] = useState<'wsdl' | 'xml'>('xml');
  const [wsdlUrl, setWsdlUrl] = useState('');
  const [operation, setOperation] = useState('');
  const [xmlBody, setXmlBody] = useState('');
  const [serviceUrl, setServiceUrl] = useState('');
  const [soapAction, setSoapAction] = useState('');
  const [parseResult, setParseResult] = useState<SoapParseResult | null>(null);
  const [isFetchingWsdl, setIsFetchingWsdl] = useState(false);
  const [wsdlOperations, setWsdlOperations] = useState<string[]>([]);
  const [jsonOutput, setJsonOutput] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingSoap, setIsTestingSoap] = useState(false);
  const [xpathQuery, setXpathQuery] = useState('');
  const [filteredResult, setFilteredResult] = useState<any>(null);
  const [assertions, setAssertions] = useState<any[]>([]);
  const [wsdlContent, setWsdlContent] = useState<string>('');

  const generateXmlBodyTemplate = (operationName: string) => {
    if (!operationName) return;
    
    // Generate a basic SOAP envelope template
    const template = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <!-- Optional: Add authentication or other headers here -->
  </soap:Header>
  <soap:Body>
    <${operationName} xmlns="http://tempuri.org/">
      <!-- TODO: Add operation parameters here -->
      <!-- Example: <parameter1>value1</parameter1> -->
      <!-- Example: <parameter2>value2</parameter2> -->
    </${operationName}>
  </soap:Body>
</soap:Envelope>`;
    
    setXmlBody(template);
    // Clear test results when template is regenerated
    setTestResult(null);
    setXpathQuery('');
    setFilteredResult(null);
    setAssertions([]);
  };

  const handleXmlBodyChange = (value: string) => {
    setXmlBody(value);
    // Clear test results when XML body is manually changed
    if (testResult) {
      setTestResult(null);
      setXpathQuery('');
      setFilteredResult(null);
      setAssertions([]);
    }
  };

  const handleOperationChange = (selectedOperation: string) => {
    setOperation(selectedOperation);
    generateXmlBodyTemplate(selectedOperation);
    // Clear previous test results when operation changes
    setTestResult(null);
    setXpathQuery('');
    setFilteredResult(null);
    setAssertions([]);
  };

  const handleFetchWsdl = async () => {
    if (!wsdlUrl.trim()) return;
    
    setIsFetchingWsdl(true);
    try {
      const response = await fetch('/api/fetch-wsdl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsdlUrl })
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.warn('WSDL fetch warning:', result.error);
        setWsdlOperations([]);
        setWsdlContent('');
      } else if (result.operations && result.operations.length > 0) {
        setWsdlOperations(result.operations);
        setOperation(result.operations[0]);
        setWsdlContent(result.wsdlContent || '');
        // Generate XML body template for first operation
        generateXmlBodyTemplate(result.operations[0]);
      } else {
        setWsdlOperations([]);
        setWsdlContent('');
      }
    } catch (error) {
      console.error('WSDL fetch error:', error);
      setWsdlOperations([]);
    } finally {
      setIsFetchingWsdl(false);
    }
  };

  const handleTestSoap = async () => {
    // Always use current xmlBody and serviceUrl/wsdlUrl regardless of input type
    const url = inputType === 'wsdl' ? wsdlUrl.replace('?wsdl', '') : serviceUrl;
    const soapRequest = {
      url,
      body: xmlBody,
      headers: soapAction ? { 'SOAPAction': `"${soapAction}"` } : {}
    };

    if (!soapRequest.url || !soapRequest.body) return;

    setIsTestingSoap(true);
    try {
      const response = await fetch('/api/test-soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soapRequest })
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: 'Failed to execute SOAP request' });
    } finally {
      setIsTestingSoap(false);
    }
  };

  const handleXPathFilter = () => {
    if (!testResult?.data || !xpathQuery.trim()) {
      setFilteredResult(null);
      return;
    }

    try {
      // Simple XPath-like filtering for XML
      const xmlData = testResult.data;
      let result = xmlData;

      if (xpathQuery.includes('//')) {
        const tagName = xpathQuery.replace('//', '');
        const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'g');
        const matches = [...xmlData.matchAll(regex)];
        result = matches.map(m => m[1]);
      } else if (xpathQuery.startsWith('/')) {
        const tagName = xpathQuery.replace('/', '');
        const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`);
        const match = xmlData.match(regex);
        result = match ? match[1] : null;
      }

      setFilteredResult(result);
    } catch (error) {
      setFilteredResult({ error: 'Invalid XPath expression' });
    }
  };

  const addAssertion = (type: string, expected?: any) => {
    if (!xpathQuery.trim()) return;

    const newAssertion = {
      type,
      xpathExpression: xpathQuery,
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
    let result: SoapParseResult;

    if (inputType === 'wsdl') {
      if (!wsdlUrl.trim() || !operation.trim()) return;
      result = SoapParser.parseFromWsdl(wsdlUrl, operation);
    } else {
      if (!xmlBody.trim() || !serviceUrl.trim()) return;
      result = SoapParser.parseFromXml(xmlBody, serviceUrl, soapAction);
    }

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
        type: (parseResult.testSuite.type as any) || 'API',
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
      a.download = `soap-import-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setWsdlUrl('');
    setOperation('');
    setXmlBody('');
    setServiceUrl('');
    setSoapAction('');
    setParseResult(null);
    setJsonOutput('');
    setTestResult(null);
    setWsdlOperations([]);
    setWsdlContent('');
    setXpathQuery('');
    setFilteredResult(null);
    setAssertions([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-teal-50/30 border-0 shadow-2xl" style={{zIndex: 9999}}>
        <DialogHeader className="pb-6 border-b border-slate-200/50">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧼</span>
            </div>
            <div>
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                SOAP to TestFlow Pro
              </div>
              <div className="text-sm font-normal text-slate-600 mt-1">
                Convert SOAP services to test suites with live testing
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden pt-6">
          {/* Input Section */}
          <div className="flex flex-col space-y-6 overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                  <span className="text-lg">🧼</span>
                </div>
                <label className="text-lg font-semibold text-slate-800">
                  Input Method
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  inputType === 'xml' 
                    ? 'border-teal-300 bg-teal-50 shadow-lg' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="inputType"
                    value="xml"
                    checked={inputType === 'xml'}
                    onChange={(e) => setInputType(e.target.value as 'xml')}
                    className="w-5 h-5 text-teal-600"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    <div>
                      <div className="font-medium text-slate-800">XML Body</div>
                      <div className="text-xs text-slate-600">Direct SOAP XML input</div>
                    </div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  inputType === 'wsdl' 
                    ? 'border-teal-300 bg-teal-50 shadow-lg' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="inputType"
                    value="wsdl"
                    checked={inputType === 'wsdl'}
                    onChange={(e) => setInputType(e.target.value as 'wsdl')}
                    className="w-5 h-5 text-teal-600"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <div>
                      <div className="font-medium text-slate-800">WSDL URL</div>
                      <div className="text-xs text-slate-600">From service definition</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center">
                  <span className="text-lg">⚙️</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Configuration</h3>
              </div>

              {inputType === 'xml' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">Service URL:</label>
                    <Input
                      value={serviceUrl}
                      onChange={(e) => setServiceUrl(e.target.value)}
                      placeholder="https://api.example.com/soap"
                      className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">SOAPAction (optional):</label>
                    <Input
                      value={soapAction}
                      onChange={(e) => setSoapAction(e.target.value)}
                      placeholder="urn:operation"
                      className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">SOAP XML Body:</label>
                      {inputType as string  === 'wsdl' && operation && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateXmlBodyTemplate(operation)}
                          className="text-xs h-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        >
                          🔄 Regenerate Template
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={xmlBody}
                      onChange={(e) => handleXmlBodyChange(e.target.value)}
                      placeholder="<?xml version='1.0'?>&#10;<soap:Envelope>&#10;  <soap:Body>&#10;    <!-- Your SOAP request -->&#10;  </soap:Body>&#10;</soap:Envelope>"
                      className="h-48 font-mono text-sm bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300 resize-none"
                    />
                    {inputType as string === 'wsdl' && (
                      <div className="text-xs text-slate-500 mt-2 p-2 bg-blue-50 rounded-lg">
                        💡 <span className="font-medium">Tip:</span> The XML template is auto-generated based on the selected operation. Customize the parameters as needed for your test.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">WSDL URL:</label>
                    <div className="flex gap-3">
                      <Input
                        value={wsdlUrl}
                        onChange={(e) => setWsdlUrl(e.target.value)}
                        placeholder="https://api.example.com/service?wsdl"
                        className="flex-1 bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300"
                      />
                      <Button
                        onClick={handleFetchWsdl}
                        disabled={isFetchingWsdl || !wsdlUrl.trim()}
                        className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                      >
                        {isFetchingWsdl ? 'Fetching...' : 'Fetch WSDL'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">Operation Name:</label>
                    {wsdlOperations.length > 0 ? (
                      <Select value={operation} onValueChange={handleOperationChange}>
                        <SelectTrigger className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300">
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent style={{ zIndex: 10000 }}>
                          {wsdlOperations.map((op) => (
                            <SelectItem key={op} value={op}>
                              {op}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={operation}
                        onChange={(e) => setOperation(e.target.value)}
                        placeholder="GetUserInfo"
                        className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300"
                      />
                    )}
                  </div>
                  {inputType === 'wsdl' && wsdlOperations.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Generated SOAP XML Body:</label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateXmlBodyTemplate(operation)}
                          className="text-xs h-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        >
                          🔄 Regenerate Template
                        </Button>
                      </div>
                      <Textarea
                        value={xmlBody}
                        onChange={(e) => handleXmlBodyChange(e.target.value)}
                        placeholder="XML body will be generated when you select an operation"
                        className="h-48 font-mono text-sm bg-white/70 backdrop-blur-sm border-slate-200 shadow-lg focus:shadow-xl focus:bg-white transition-all duration-300 resize-none"
                      />
                      <div className="text-xs text-slate-500 mt-2 p-2 bg-blue-50 rounded-lg">
                        💡 <span className="font-medium">Tip:</span> The XML template is auto-generated based on the selected operation. Customize the parameters as needed for your test.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {testResult && (
              <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-lg text-slate-800">Live SOAP Response</h4>
                </div>
                {testResult.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <div className="text-red-600 text-sm mt-2">{testResult.error}</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${testResult.status < 400 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Status: <span className={testResult.status < 400 ? 'text-emerald-600' : 'text-red-600'}>{testResult.status}</span></span>
                      </div>
                      <span className="text-slate-600 font-medium">⚡ {testResult.time}ms</span>
                    </div>
                    
                    {testResult.data && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-600" />
                          <span className="font-medium text-slate-800">Response XML</span>
                        </div>
                        <pre className="p-4 bg-slate-900 text-green-400 rounded-xl text-xs max-h-40 overflow-auto border border-slate-700 font-mono shadow-inner">
                          {testResult.data}
                        </pre>
                      </div>
                    )}
                    
                    {/* XPath Filter Section */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                          <Search className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="font-medium text-slate-800">XPath Filter & Assertions</span>
                      </div>
                      <div className="flex gap-3 mb-3">
                        <Input
                          value={xpathQuery}
                          onChange={(e) => setXpathQuery(e.target.value)}
                          placeholder="//result or /soap:Body/response"
                          className="text-sm h-10 flex-1 bg-white/70 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-300"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleXPathFilter} 
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
                          
                          {!filteredResult?.error && xpathQuery && (
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
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg">
                        <span className="font-medium">Examples:</span> <code className="bg-white px-1 rounded">//tagName</code> (find all), <code className="bg-white px-1 rounded">/root/element</code> (specific path)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleTestSoap} 
                disabled={isTestingSoap}
                className="flex-1 h-11 bg-white/70 backdrop-blur-sm border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105 transition-all duration-300"
              >
                <Play className="h-4 w-4 mr-2" />
                {isTestingSoap ? 'Testing...' : 'Test Live'}
              </Button>
              <Button 
                onClick={handleParse}
                className="flex-1 h-11 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <span className="text-lg mr-2">🧼</span>
                Convert to Suite
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="h-11 px-4 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
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
                        <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-700">{assertion.xpathExpression}</code>
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
                      ? 'border-teal-300 bg-teal-50 shadow-lg' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="new"
                      checked={importMode === 'new'}
                      onChange={(e) => setImportMode(e.target.value as 'new')}
                      className="w-5 h-5 text-teal-600"
                    />
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-teal-600" />
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
                {jsonOutput || '// Generated TestFlow Pro JSON will appear here...\n// Configure your SOAP request and click "Convert to Suite" to see the magic! ✨'}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

