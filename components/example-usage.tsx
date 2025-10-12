"use client"

import React, { useState } from "react"
import { InputWithGenerator } from "./input-with-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

// Example component showing how to use InputWithGenerator
export function ExampleUsage() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [apiKey, setApiKey] = useState("")

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Data Generator Example</CardTitle>
        <CardDescription>
          Click the magic wand icon to generate test data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <InputWithGenerator
            id="email"
            placeholder="Enter email or generate one"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onGenerate={(value) => setEmail(value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <InputWithGenerator
            id="username"
            placeholder="Enter username or generate one"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onGenerate={(value) => setUsername(value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <InputWithGenerator
            id="apiKey"
            placeholder="Enter API key or generate one"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onGenerate={(value) => setApiKey(value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}