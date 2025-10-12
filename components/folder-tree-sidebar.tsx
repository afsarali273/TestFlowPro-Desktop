"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MousePointer, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { TestSuite } from "@/types/test-suite"

interface FolderNode {
  name: string
  path: string
  isFolder: boolean
  children: FolderNode[]
  suites: TestSuite[]
}

interface FolderTreeSidebarProps {
  testSuites: TestSuite[]
  activeTab: 'all' | 'ui' | 'api'
  searchTerm?: string
  onSuiteSelect: (suite: TestSuite) => void
  onFolderSelect?: (folderPath: string) => void
  selectedFolder?: string | null
}

export function FolderTreeSidebar({ testSuites, activeTab, searchTerm = '', onSuiteSelect, onFolderSelect, selectedFolder }: FolderTreeSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']))
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null)

  useEffect(() => {
    buildFolderTree()
  }, [testSuites, activeTab, searchTerm])

  const buildFolderTree = () => {
    const filteredSuites = testSuites.filter(suite => {
      // Tab filter
      let matchesTab = true
      if (activeTab === 'ui') matchesTab = suite.type === 'UI'
      else if (activeTab === 'api') matchesTab = suite.type !== 'UI'
      
      // Search filter
      let matchesSearch = true
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        matchesSearch = 
          suite.suiteName.toLowerCase().includes(searchLower) ||
          (suite.fileName && suite.fileName.toLowerCase().includes(searchLower)) ||
          (suite.tags && suite.tags.some(tag => 
            Object.values(tag).some(value => 
              value.toString().toLowerCase().includes(searchLower)
            )
          )) ||
          suite.testCases.some(tc => 
            tc.name.toLowerCase().includes(searchLower) ||
            (tc.testData && tc.testData.some(td => td.name.toLowerCase().includes(searchLower))) ||
            (tc.testSteps && tc.testSteps.some(ts => ts.keyword.toLowerCase().includes(searchLower)))
          )
      }
      
      return matchesTab && matchesSearch
    })

    const root: FolderNode = {
      name: 'Test Suites',
      path: '',
      isFolder: true,
      children: [],
      suites: []
    }

    filteredSuites.forEach(suite => {
      if (!suite.filePath) {
        root.suites.push(suite)
        return
      }

      const fullPath = suite.filePath
      const testSuitesIndex = fullPath.indexOf('testSuites')
      
      if (testSuitesIndex === -1) {
        root.suites.push(suite)
        return
      }
      
      const pathAfterTestSuites = fullPath.substring(testSuitesIndex + 'testSuites'.length)
      const pathParts = pathAfterTestSuites.split(/[\/\\]/).filter(part => part)
      
      let currentNode = root

      if (pathParts.length === 0) {
        root.suites.push(suite)
      } else {
        pathParts.forEach((part, index) => {
          const isLastPart = index === pathParts.length - 1
          const currentPath = pathParts.slice(0, index + 1).join('/')

          if (isLastPart && part.endsWith('.json')) {
            currentNode.suites.push(suite)
          } else {
            let childNode = currentNode.children.find(child => child.name === part)
            
            if (!childNode) {
              childNode = {
                name: part,
                path: currentPath,
                isFolder: true,
                children: [],
                suites: []
              }
              currentNode.children.push(childNode)
            }
            
            currentNode = childNode
          }
        })
      }
    })

    const sortAndFilterNode = (node: FolderNode): FolderNode | null => {
      const validChildren = node.children
        .map(child => sortAndFilterNode(child))
        .filter((child): child is FolderNode => child !== null)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      const filteredSuites = node.suites.filter(suite => {
        if (activeTab === 'all') return true
        if (activeTab === 'ui') return suite.type === 'UI'
        if (activeTab === 'api') return suite.type !== 'UI'
        return true
      })
      
      if (validChildren.length === 0 && filteredSuites.length === 0 && node.path !== '') {
        return null
      }
      
      const getAllSuites = (n: FolderNode): TestSuite[] => {
        const childSuites = n.children.flatMap(getAllSuites)
        return [...n.suites, ...childSuites]
      }
      
      const allSuites = getAllSuites({ ...node, children: validChildren, suites: filteredSuites })
        .filter((suite, index, arr) => arr.findIndex(s => s.id === suite.id) === index)
      
      return {
        ...node,
        children: validChildren,
        suites: allSuites
      }
    }

    const processedRoot = sortAndFilterNode(root)
    setFolderTree(processedRoot)
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const renderNode = (node: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const hasChildren = node.children.length > 0
    const directSuites = node.suites.filter(suite => {
      if (!suite.filePath) return depth === 0
      const testSuitesIndex = suite.filePath.indexOf('testSuites')
      if (testSuitesIndex === -1) return depth === 0
      const pathAfterTestSuites = suite.filePath.substring(testSuitesIndex + 'testSuites'.length)
      const pathParts = pathAfterTestSuites.split(/[\/\\]/).filter(part => part)
      const expectedDepth = node.path ? node.path.split('/').length : 0
      return pathParts.length === expectedDepth + 1 && pathParts[pathParts.length - 1].endsWith('.json')
    })

    return (
      <div key={node.path} className="relative">
        {/* Folder Header */}
        {node.isFolder && (
          <div
            className={`group relative flex items-center gap-2 py-2 px-2 cursor-pointer rounded-lg transition-all duration-200 hover:bg-slate-50/80 ${
              selectedFolder === node.path ? 'bg-blue-50 border border-blue-200' : ''
            }`}
            style={{ marginLeft: `${depth * 16}px` }}
            onClick={() => {
              toggleFolder(node.path)
              if (onFolderSelect) {
                onFolderSelect(node.path)
              }
            }}
          >
            <div className="flex items-center justify-center w-4 h-4">
              {hasChildren ? (
                <div className={`transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : 'rotate-0'
                }`}>
                  <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-slate-700" />
                </div>
              ) : (
                <div className="w-3 h-3" />
              )}
            </div>
            
            <div className="flex items-center justify-center w-5 h-5">
              <div className={`p-0.5 rounded-md transition-all duration-200 ${
                isExpanded 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-500'
              }`}>
                {isExpanded ? (
                  <FolderOpen className="h-3 w-3" />
                ) : (
                  <Folder className="h-3 w-3" />
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors duration-200 truncate">
                {node.name}
              </span>
              {node.suites.length > 0 && (
                <div className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-all duration-200 flex-shrink-0">
                  {node.suites.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {node.isFolder && isExpanded && (
          <>
            {/* Child Folders */}
            {node.children.map(child => 
              renderNode(child, depth + 1)
            )}
            
            {/* Direct Files */}
            {directSuites.map(suite => {
              const isUISuite = suite.type === 'UI'
              return (
                <div
                  key={`file-${suite.id}`}
                  className="group relative flex items-center gap-2 py-2 px-2 cursor-pointer rounded-lg transition-all duration-200 hover:bg-slate-50/80 hover:shadow-sm"
                  style={{ marginLeft: `${(depth + 1) * 16}px` }}
                  onClick={() => onSuiteSelect(suite)}
                >
                  <div className="w-4 h-4" />
                  <div className="flex items-center justify-center w-5 h-5">
                    <div className={`p-0.5 rounded-md transition-all duration-200 ${
                      isUISuite 
                        ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200' 
                        : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'
                    }`}>
                      <FileText className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors duration-200 truncate">
                      {suite.suiteName}
                    </span>
                    <Badge variant="outline" className={`text-xs px-1 py-0 transition-all duration-200 flex-shrink-0 ${
                      isUISuite
                        ? 'bg-purple-50 text-purple-700 border-purple-200 group-hover:bg-purple-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100'
                    }`}>
                      {isUISuite ? (
                        <><MousePointer className="h-2 w-2 mr-0.5" />UI</>
                      ) : (
                        <><Globe className="h-2 w-2 mr-0.5" />API</>
                      )}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    )
  }

  if (!folderTree) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Loading folder structure...</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {folderTree.children.length === 0 && folderTree.suites.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
            <Folder className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-xs font-medium">No test suites found</p>
          <p className="text-xs text-slate-400 mt-1">Create test suites to see them here</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {renderNode(folderTree)}
        </div>
      )}
    </div>
  )
}