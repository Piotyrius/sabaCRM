"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function ClientSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search/clients?q=${encodeURIComponent(query)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          setShowResults(true)
        }
      } catch (error) {
        console.error("Error searching:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

  const handleSelect = (clientId: string) => {
    setQuery("")
    setShowResults(false)
    router.push(`/dashboard/clients/${clientId}`)
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="search"
          placeholder="Search clients..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      {showResults && (results.length > 0 || loading) && (
        <Card className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            ) : (
              <div>
                {results.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelect(client.id)}
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.email || client.phone || client.clientId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

