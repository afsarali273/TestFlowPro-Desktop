'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Save, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnvVariable {
  key: string;
  value: string;
}

interface EnvVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnvVariablesModal({ isOpen, onClose }: EnvVariablesModalProps) {
  const [environments, setEnvironments] = useState<string[]>([]);
  const [activeEnv, setActiveEnv] = useState<string>('');
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadEnvironments();
    }
  }, [isOpen]);

  const loadEnvironments = async () => {
    setLoading(true);
    try {
      const frameworkPath = localStorage.getItem('frameworkPath');
      if (!frameworkPath) {
        throw new Error('Framework path not found');
      }
      
      const response = await fetch(`/api/env-variables?frameworkPath=${encodeURIComponent(frameworkPath)}`);
      if (response.ok) {
        const data = await response.json();
        setEnvironments(data.environments);
        if (data.environments.length > 0 && !activeEnv) {
          setActiveEnv(data.environments[0]);
          loadVariables(data.environments[0]);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load environments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVariables = async (env: string) => {
    if (!env) return;
    
    setLoading(true);
    try {
      const frameworkPath = localStorage.getItem('frameworkPath');
      if (!frameworkPath) {
        throw new Error('Framework path not found');
      }
      
      const response = await fetch(`/api/env-variables/${env}?frameworkPath=${encodeURIComponent(frameworkPath)}`);
      if (response.ok) {
        const data = await response.json();
        setVariables(data.variables);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to load variables for ${env}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveVariables = async () => {
    if (!activeEnv) return;
    
    setSaving(true);
    try {
      const frameworkPath = localStorage.getItem('frameworkPath');
      if (!frameworkPath) {
        throw new Error('Framework path not found');
      }
      
      const response = await fetch(`/api/env-variables/${activeEnv}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables, frameworkPath })
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Environment variables saved for ${activeEnv}`
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save environment variables',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '' }]);
  };

  const updateVariable = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...variables];
    updated[index][field] = value;
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleEnvChange = (env: string) => {
    setActiveEnv(env);
    loadVariables(env);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Environment Variables Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Environment Tabs */}
          {environments.length > 0 && (
            <Tabs value={activeEnv} onValueChange={handleEnvChange}>
              <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${environments.length}, 1fr)`}}>
                {environments.map(env => (
                  <TabsTrigger key={env} value={env} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    .env.{env}
                  </TabsTrigger>
                ))}
              </TabsList>

              {environments.map(env => (
                <TabsContent key={env} value={env} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Variables for .env.{env}</h3>
                      <p className="text-sm text-slate-600">{variables.length} variables defined</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addVariable} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Variable
                      </Button>
                      <Button onClick={saveVariables} size="sm" disabled={saving}>
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                      <p className="mt-2 text-slate-600">Loading variables...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {variables.map((variable, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor={`key-${index}`} className="text-xs text-slate-600">Key</Label>
                            <Input
                              id={`key-${index}`}
                              value={variable.key}
                              onChange={(e) => updateVariable(index, 'key', e.target.value)}
                              placeholder="VARIABLE_NAME"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={`value-${index}`} className="text-xs text-slate-600">Value</Label>
                            <Input
                              id={`value-${index}`}
                              value={variable.value}
                              onChange={(e) => updateVariable(index, 'value', e.target.value)}
                              placeholder="variable_value"
                              className="mt-1"
                            />
                          </div>
                          <Button
                            onClick={() => removeVariable(index)}
                            size="sm"
                            variant="outline"
                            className="mt-6 border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {variables.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No environment variables defined</p>
                          <p className="text-sm">Click "Add Variable" to get started</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {environments.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">
              <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No environment files found</p>
              <p className="text-sm">Create .env.dev, .env.qa, or .env.prod files in your project</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}