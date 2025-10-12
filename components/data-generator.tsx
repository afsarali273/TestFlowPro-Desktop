"use client"

import React, { useState } from "react"
import { faker } from '@faker-js/faker'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Wand2, User, Calendar, Hash, Globe, CreditCard, Building, Phone, Mail, MapPin, Copy, RefreshCw } from "lucide-react"

interface DataGeneratorProps {
  onGenerate: (value: string) => void
  children: React.ReactNode
}

interface GeneratorOption {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  generate: (options?: any) => string
}

export function DataGenerator({ onGenerate, children }: DataGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("personal")
  const [generatedValue, setGeneratedValue] = useState("")
  const [customOptions, setCustomOptions] = useState<Record<string, any>>({})

  const generators: GeneratorOption[] = [
    // Personal Data
    {
      id: "firstName",
      name: "First Name",
      description: "Generate random first names",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => {
        const names = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Maria", "William", "Jennifer", "Richard", "Linda", "Charles", "Patricia", "Joseph", "Susan", "Thomas", "Jessica"]
        return names[Math.floor(Math.random() * names.length)]
      }
    },
    {
      id: "lastName",
      name: "Last Name", 
      description: "Generate random last names",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => {
        const names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
        return names[Math.floor(Math.random() * names.length)]
      }
    },
    {
      id: "fullName",
      name: "Full Name",
      description: "Generate complete names",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => {
        const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Maria"]
        const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
      }
    },
    {
      id: "username",
      name: "Username",
      description: "Generate usernames",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => {
        const prefixes = ["user", "test", "demo", "admin", "guest"]
        const suffix = Math.floor(Math.random() * 9999) + 1
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffix}`
      }
    },
    {
      id: "email",
      name: "Email Address",
      description: "Generate email addresses",
      category: "personal",
      icon: <Mail className="h-4 w-4" />,
      generate: () => {
        const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "test.com", "example.com"]
        const names = ["john", "jane", "test", "user", "demo", "admin"]
        const name = names[Math.floor(Math.random() * names.length)]
        const number = Math.floor(Math.random() * 999) + 1
        const domain = domains[Math.floor(Math.random() * domains.length)]
        return `${name}${number}@${domain}`
      }
    },
    {
      id: "phone",
      name: "Phone Number",
      description: "Generate phone numbers",
      category: "personal",
      icon: <Phone className="h-4 w-4" />,
      generate: () => {
        const area = Math.floor(Math.random() * 900) + 100
        const exchange = Math.floor(Math.random() * 900) + 100
        const number = Math.floor(Math.random() * 9000) + 1000
        return `(${area}) ${exchange}-${number}`
      }
    },

    // Numbers & IDs
    {
      id: "randomNumber",
      name: "Random Number",
      description: "Generate random numbers",
      category: "numbers",
      icon: <Hash className="h-4 w-4" />,
      generate: (options = {}) => {
        const min = options.min || 1
        const max = options.max || 1000
        return String(Math.floor(Math.random() * (max - min + 1)) + min)
      }
    },
    {
      id: "uuid",
      name: "UUID",
      description: "Generate UUID v4",
      category: "numbers",
      icon: <Hash className="h-4 w-4" />,
      generate: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c == 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }
    },
    {
      id: "timestamp",
      name: "Timestamp",
      description: "Generate current timestamp",
      category: "numbers",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => String(Date.now())
    },
    {
      id: "sequentialId",
      name: "Sequential ID",
      description: "Generate sequential numbers",
      category: "numbers",
      icon: <Hash className="h-4 w-4" />,
      generate: () => String(Date.now() % 100000)
    },

    // Dates & Times
    {
      id: "currentDate",
      name: "Current Date",
      description: "Today's date in YYYY-MM-DD format",
      category: "datetime",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => new Date().toISOString().split('T')[0]
    },
    {
      id: "currentDateTime",
      name: "Current DateTime",
      description: "Current date and time",
      category: "datetime",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => new Date().toISOString()
    },
    {
      id: "futureDate",
      name: "Future Date",
      description: "Random future date",
      category: "datetime",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => {
        const future = new Date()
        future.setDate(future.getDate() + Math.floor(Math.random() * 365))
        return future.toISOString().split('T')[0]
      }
    },
    {
      id: "pastDate",
      name: "Past Date",
      description: "Random past date",
      category: "datetime",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => {
        const past = new Date()
        past.setDate(past.getDate() - Math.floor(Math.random() * 365))
        return past.toISOString().split('T')[0]
      }
    },

    // Internet & Web
    {
      id: "url",
      name: "URL",
      description: "Generate web URLs",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => {
        const protocols = ["https://", "http://"]
        const domains = ["example.com", "test.com", "demo.org", "sample.net", "mock.io"]
        const paths = ["", "/api", "/users", "/products", "/dashboard", "/admin"]
        const protocol = protocols[Math.floor(Math.random() * protocols.length)]
        const domain = domains[Math.floor(Math.random() * domains.length)]
        const path = paths[Math.floor(Math.random() * paths.length)]
        return `${protocol}${domain}${path}`
      }
    },
    {
      id: "domain",
      name: "Domain Name",
      description: "Generate domain names",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => {
        const names = ["example", "test", "demo", "sample", "mock", "api", "web", "app"]
        const tlds = [".com", ".org", ".net", ".io", ".co", ".dev"]
        const name = names[Math.floor(Math.random() * names.length)]
        const tld = tlds[Math.floor(Math.random() * tlds.length)]
        return `${name}${tld}`
      }
    },
    {
      id: "ipAddress",
      name: "IP Address",
      description: "Generate IPv4 addresses",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      }
    },

    // Business & Finance
    {
      id: "companyName",
      name: "Company Name",
      description: "Generate company names",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => {
        const prefixes = ["Tech", "Global", "Digital", "Smart", "Advanced", "Modern", "Future", "Elite"]
        const suffixes = ["Solutions", "Systems", "Corp", "Inc", "LLC", "Group", "Enterprises", "Technologies"]
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
        return `${prefix} ${suffix}`
      }
    },
    {
      id: "password",
      name: "Password",
      description: "Generate secure passwords",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
        let password = ""
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
      }
    },
    {
      id: "apiKey",
      name: "API Key",
      description: "Generate API key format",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        let key = "sk-"
        for (let i = 0; i < 32; i++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return key
      }
    },
    {
      id: "creditCard",
      name: "Credit Card",
      description: "Generate test credit card numbers",
      category: "business",
      icon: <CreditCard className="h-4 w-4" />,
      generate: () => {
        // Generate a test Visa number (starts with 4)
        let number = "4"
        for (let i = 0; i < 15; i++) {
          number += Math.floor(Math.random() * 10)
        }
        return number.replace(/(.{4})/g, '$1 ').trim()
      }
    },
    {
      id: "currency",
      name: "Currency Amount",
      description: "Generate currency amounts",
      category: "business",
      icon: <CreditCard className="h-4 w-4" />,
      generate: () => {
        const amount = (Math.random() * 10000).toFixed(2)
        return `$${amount}`
      }
    },

    // Location
    {
      id: "address",
      name: "Street Address",
      description: "Generate street addresses",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => {
        const numbers = Math.floor(Math.random() * 9999) + 1
        const streets = ["Main St", "Oak Ave", "Pine Rd", "Elm Dr", "Park Blvd", "First St", "Second Ave", "Third St"]
        const street = streets[Math.floor(Math.random() * streets.length)]
        return `${numbers} ${street}`
      }
    },
    {
      id: "coordinates",
      name: "GPS Coordinates",
      description: "Generate latitude/longitude",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => {
        const lat = (Math.random() * 180 - 90).toFixed(6)
        const lng = (Math.random() * 360 - 180).toFixed(6)
        return `${lat}, ${lng}`
      }
    },
    {
      id: "city",
      name: "City",
      description: "Generate city names",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => {
        const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"]
        return cities[Math.floor(Math.random() * cities.length)]
      }
    },
    {
      id: "zipCode",
      name: "ZIP Code",
      description: "Generate ZIP codes",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => {
        return String(Math.floor(Math.random() * 90000) + 10000)
      }
    },
    {
      id: "country",
      name: "Country",
      description: "Generate country names",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => {
        const countries = ["United States", "Canada", "United Kingdom", "Germany", "France", "Japan", "Australia", "Brazil", "India", "China"]
        return countries[Math.floor(Math.random() * countries.length)]
      }
    }
  ]

  const categories = [
    { id: "personal", name: "Personal", icon: <User className="h-4 w-4" /> },
    { id: "numbers", name: "Numbers & IDs", icon: <Hash className="h-4 w-4" /> },
    { id: "datetime", name: "Date & Time", icon: <Calendar className="h-4 w-4" /> },
    { id: "internet", name: "Internet", icon: <Globe className="h-4 w-4" /> },
    { id: "business", name: "Business & Security", icon: <Building className="h-4 w-4" /> },
    { id: "location", name: "Location", icon: <MapPin className="h-4 w-4" /> }
  ]

  const filteredGenerators = generators.filter(g => g.category === selectedCategory)

  const handleGenerate = (generator: GeneratorOption) => {
    const options = customOptions[generator.id] || {}
    const value = generator.generate(options)
    setGeneratedValue(value)
  }

  const handleUseValue = () => {
    if (generatedValue) {
      onGenerate(generatedValue)
      setIsOpen(false)
      setGeneratedValue("")
    }
  }

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-600" />
            Data Generator
          </DialogTitle>
          <DialogDescription>
            Generate realistic test data for your parameters
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 h-[500px]">
          {/* Categories Sidebar */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categories</Label>
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="w-full justify-start"
                >
                  {category.icon}
                  <span className="ml-2">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Generators List */}
          <div className="col-span-2 space-y-2">
            <Label className="text-sm font-medium">Generators</Label>
            <ScrollArea className="h-[450px]">
              <div className="space-y-2 pr-4">
                {filteredGenerators.map((generator) => (
                  <Card key={generator.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {generator.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{generator.name}</h4>
                            <p className="text-xs text-gray-600 mt-1">{generator.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(generator)}
                          className="ml-2 flex-shrink-0"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Custom Options for Random Number */}
                      {generator.id === "randomNumber" && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Min</Label>
                              <Input
                                type="number"
                                placeholder="1"
                                value={customOptions.randomNumber?.min || ""}
                                onChange={(e) => setCustomOptions({
                                  ...customOptions,
                                  randomNumber: {
                                    ...customOptions.randomNumber,
                                    min: parseInt(e.target.value) || 1
                                  }
                                })}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Max</Label>
                              <Input
                                type="number"
                                placeholder="1000"
                                value={customOptions.randomNumber?.max || ""}
                                onChange={(e) => setCustomOptions({
                                  ...customOptions,
                                  randomNumber: {
                                    ...customOptions.randomNumber,
                                    max: parseInt(e.target.value) || 1000
                                  }
                                })}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Generated Value Preview */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Generated Value</Label>
            
            {generatedValue ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-green-700 bg-green-100">
                      Generated
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedValue)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm break-all bg-white p-2 rounded border">
                    {generatedValue}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={handleUseValue}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Use This Value
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setGeneratedValue("")}
                    className="w-full"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click a generator to create data</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(generators.find(g => g.id === "uuid")!)}
                  className="w-full justify-start text-xs"
                >
                  <Hash className="h-3 w-3 mr-2" />
                  Generate UUID
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(generators.find(g => g.id === "email")!)}
                  className="w-full justify-start text-xs"
                >
                  <Mail className="h-3 w-3 mr-2" />
                  Generate Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(generators.find(g => g.id === "currentDate")!)}
                  className="w-full justify-start text-xs"
                >
                  <Calendar className="h-3 w-3 mr-2" />
                  Current Date
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}