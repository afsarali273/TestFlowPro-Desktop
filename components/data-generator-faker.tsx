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
      generate: () => faker.person.firstName()
    },
    {
      id: "lastName",
      name: "Last Name", 
      description: "Generate random last names",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => faker.person.lastName()
    },
    {
      id: "fullName",
      name: "Full Name",
      description: "Generate complete names",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => faker.person.fullName()
    },
    {
      id: "username",
      name: "Username",
      description: "Generate usernames",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => faker.internet.username()
    },
    {
      id: "email",
      name: "Email Address",
      description: "Generate email addresses",
      category: "personal",
      icon: <Mail className="h-4 w-4" />,
      generate: () => faker.internet.email()
    },
    {
      id: "phone",
      name: "Phone Number",
      description: "Generate phone numbers",
      category: "personal",
      icon: <Phone className="h-4 w-4" />,
      generate: () => faker.phone.number()
    },
    {
      id: "jobTitle",
      name: "Job Title",
      description: "Generate job titles",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => faker.person.jobTitle()
    },
    {
      id: "bio",
      name: "Biography",
      description: "Generate short bio text",
      category: "personal",
      icon: <User className="h-4 w-4" />,
      generate: () => faker.person.bio()
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
        return String(faker.number.int({ min, max }))
      }
    },
    {
      id: "uuid",
      name: "UUID",
      description: "Generate UUID v4",
      category: "numbers",
      icon: <Hash className="h-4 w-4" />,
      generate: () => faker.string.uuid()
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
      generate: () => String(faker.number.int({ min: 10000, max: 99999 }))
    },
    {
      id: "hexColor",
      name: "Hex Color",
      description: "Generate hex color codes",
      category: "numbers",
      icon: <Hash className="h-4 w-4" />,
      generate: () => faker.color.rgb()
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
      generate: () => faker.date.future().toISOString().split('T')[0]
    },
    {
      id: "pastDate",
      name: "Past Date",
      description: "Random past date",
      category: "datetime",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => faker.date.past().toISOString().split('T')[0]
    },
    {
      id: "birthDate",
      name: "Birth Date",
      description: "Generate realistic birth dates",
      category: "datetime",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => faker.date.birthdate().toISOString().split('T')[0]
    },
    {
      id: "weekday",
      name: "Weekday",
      description: "Generate day of the week",
      category: "datetime",
      icon: <Calendar className="h-4 w-4" />,
      generate: () => faker.date.weekday()
    },

    // Internet & Web
    {
      id: "url",
      name: "URL",
      description: "Generate web URLs",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => faker.internet.url()
    },
    {
      id: "domain",
      name: "Domain Name",
      description: "Generate domain names",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => faker.internet.domainName()
    },
    {
      id: "ipAddress",
      name: "IP Address",
      description: "Generate IPv4 addresses",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => faker.internet.ip()
    },
    {
      id: "userAgent",
      name: "User Agent",
      description: "Generate browser user agents",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => faker.internet.userAgent()
    },
    {
      id: "mac",
      name: "MAC Address",
      description: "Generate MAC addresses",
      category: "internet",
      icon: <Globe className="h-4 w-4" />,
      generate: () => faker.internet.mac()
    },

    // Business & Finance
    {
      id: "companyName",
      name: "Company Name",
      description: "Generate company names",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => faker.company.name()
    },
    {
      id: "password",
      name: "Password",
      description: "Generate secure passwords",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => faker.internet.password({ length: 12, memorable: false })
    },
    {
      id: "apiKey",
      name: "API Key",
      description: "Generate API key format",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => `sk-${faker.string.alphanumeric({ length: 32 })}`
    },
    {
      id: "creditCard",
      name: "Credit Card",
      description: "Generate test credit card numbers",
      category: "business",
      icon: <CreditCard className="h-4 w-4" />,
      generate: () => faker.finance.creditCardNumber({ issuer: 'visa' })
    },
    {
      id: "currency",
      name: "Currency Amount",
      description: "Generate currency amounts",
      category: "business",
      icon: <CreditCard className="h-4 w-4" />,
      generate: () => `$${faker.finance.amount({ min: 1, max: 10000, dec: 2 })}`
    },
    {
      id: "iban",
      name: "IBAN",
      description: "Generate IBAN numbers",
      category: "business",
      icon: <CreditCard className="h-4 w-4" />,
      generate: () => faker.finance.iban()
    },
    {
      id: "department",
      name: "Department",
      description: "Generate company departments",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => faker.commerce.department()
    },
    {
      id: "product",
      name: "Product Name",
      description: "Generate product names",
      category: "business",
      icon: <Building className="h-4 w-4" />,
      generate: () => faker.commerce.productName()
    },

    // Strings & Encoding
    {
      id: "randomString",
      name: "Random String",
      description: "Generate random strings",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: (options = {}) => {
        const length = options.length || 10
        return faker.string.alpha({ length })
      }
    },
    {
      id: "alphanumeric",
      name: "Alphanumeric",
      description: "Generate alphanumeric strings",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: (options = {}) => {
        const length = options.length || 10
        return faker.string.alphanumeric({ length })
      }
    },
    {
      id: "base64",
      name: "Base64 Encoded",
      description: "Generate base64 encoded strings",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: () => {
        const text = faker.lorem.words(3)
        return btoa(text)
      }
    },
    {
      id: "base64Encode",
      name: "Base64 Encode",
      description: "Encode custom text to base64",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: (options = {}) => {
        const text = options.text || "Hello World"
        try {
          return btoa(text)
        } catch (e) {
          return "Invalid text for encoding"
        }
      }
    },
    {
      id: "base64Decode",
      name: "Base64 Decode",
      description: "Decode base64 to text",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: (options = {}) => {
        const encoded = options.encoded || "SGVsbG8gV29ybGQ="
        try {
          return atob(encoded)
        } catch (e) {
          return "Invalid base64 string"
        }
      }
    },
    {
      id: "jwt",
      name: "JWT Token",
      description: "Generate JWT-like tokens",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: () => {
        const header = btoa(JSON.stringify({"alg":"HS256","typ":"JWT"}))
        const payload = btoa(JSON.stringify({"sub":faker.string.uuid(),"name":faker.person.fullName(),"iat":Math.floor(Date.now()/1000)}))
        const signature = faker.string.alphanumeric({ length: 43 })
        return `${header}.${payload}.${signature}`
      }
    },
    {
      id: "slug",
      name: "URL Slug",
      description: "Generate URL-friendly slugs",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: () => faker.lorem.slug()
    },
    {
      id: "loremText",
      name: "Lorem Text",
      description: "Generate lorem ipsum text",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: () => faker.lorem.sentence()
    },
    {
      id: "paragraph",
      name: "Paragraph",
      description: "Generate text paragraphs",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: () => faker.lorem.paragraph()
    },
    {
      id: "hexString",
      name: "Hex String",
      description: "Generate hexadecimal strings",
      category: "strings",
      icon: <Hash className="h-4 w-4" />,
      generate: (options = {}) => {
        const length = options.length || 16
        return faker.string.hexadecimal({ length, prefix: '' })
      }
    },

    // Location
    {
      id: "address",
      name: "Street Address",
      description: "Generate street addresses",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => faker.location.streetAddress()
    },
    {
      id: "coordinates",
      name: "GPS Coordinates",
      description: "Generate latitude/longitude",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => `${faker.location.latitude({ precision: 6 })}, ${faker.location.longitude({ precision: 6 })}`
    },
    {
      id: "city",
      name: "City",
      description: "Generate city names",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => faker.location.city()
    },
    {
      id: "zipCode",
      name: "ZIP Code",
      description: "Generate ZIP codes",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => faker.location.zipCode()
    },
    {
      id: "country",
      name: "Country",
      description: "Generate country names",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => faker.location.country()
    },
    {
      id: "state",
      name: "State",
      description: "Generate state names",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => faker.location.state()
    },
    {
      id: "timeZone",
      name: "Time Zone",
      description: "Generate time zones",
      category: "location",
      icon: <MapPin className="h-4 w-4" />,
      generate: () => faker.location.timeZone()
    }
  ]

  const categories = [
    { id: "personal", name: "Personal", icon: <User className="h-4 w-4" /> },
    { id: "numbers", name: "Numbers & IDs", icon: <Hash className="h-4 w-4" /> },
    { id: "datetime", name: "Date & Time", icon: <Calendar className="h-4 w-4" /> },
    { id: "internet", name: "Internet", icon: <Globe className="h-4 w-4" /> },
    { id: "business", name: "Business & Security", icon: <Building className="h-4 w-4" /> },
    { id: "strings", name: "Strings & Encoding", icon: <Hash className="h-4 w-4" /> },
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
            Faker.js Data Generator
          </DialogTitle>
          <DialogDescription>
            Generate realistic test data using Faker.js library
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
            <Label className="text-sm font-medium">Generators ({filteredGenerators.length})</Label>
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

                      {/* Custom Options for String Generators */}
                      {["randomString", "alphanumeric", "hexString"].includes(generator.id) && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div>
                            <Label className="text-xs">Length</Label>
                            <Input
                              type="number"
                              placeholder="10"
                              value={customOptions[generator.id]?.length || ""}
                              onChange={(e) => setCustomOptions({
                                ...customOptions,
                                [generator.id]: {
                                  ...customOptions[generator.id],
                                  length: parseInt(e.target.value) || 10
                                }
                              })}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Custom Options for Base64 Encode */}
                      {generator.id === "base64Encode" && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div>
                            <Label className="text-xs">Text to Encode</Label>
                            <Input
                              placeholder="Enter text to encode"
                              value={customOptions.base64Encode?.text || ""}
                              onChange={(e) => setCustomOptions({
                                ...customOptions,
                                base64Encode: {
                                  ...customOptions.base64Encode,
                                  text: e.target.value
                                }
                              })}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Custom Options for Base64 Decode */}
                      {generator.id === "base64Decode" && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div>
                            <Label className="text-xs">Base64 to Decode</Label>
                            <Input
                              placeholder="Enter base64 string"
                              value={customOptions.base64Decode?.encoded || ""}
                              onChange={(e) => setCustomOptions({
                                ...customOptions,
                                base64Decode: {
                                  ...customOptions.base64Decode,
                                  encoded: e.target.value
                                }
                              })}
                              className="h-7 text-xs"
                            />
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
                  onClick={() => handleGenerate(generators.find(g => g.id === "fullName")!)}
                  className="w-full justify-start text-xs"
                >
                  <User className="h-3 w-3 mr-2" />
                  Generate Name
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(generators.find(g => g.id === "password")!)}
                  className="w-full justify-start text-xs"
                >
                  <Building className="h-3 w-3 mr-2" />
                  Generate Password
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate(generators.find(g => g.id === "base64")!)}
                  className="w-full justify-start text-xs"
                >
                  <Hash className="h-3 w-3 mr-2" />
                  Generate Base64
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}