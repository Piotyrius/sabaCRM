"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Filter, X, Search } from "lucide-react"

const SALES_STATUSES = [
  "NO_ANSWER",
  "NEVER_ANSWER",
  "LOW_POTENTIAL",
  "HIGH_POTENTIAL",
  "CALLBACK",
  "CONVERTED",
  "NOT_INTERESTED",
  "NO_POTENTIAL",
  "HUNG_UP",
  "INITIAL_CALL",
  "INVALID_COUNTRY",
  "INVALID_LANGUAGE",
  "WRONG_NUMBER",
  "WRONG_PERSON",
  "TEST",
  "REASSIGN",
  "WRONG_INFO",
  "UNDER18",
]

interface ClientFiltersProps {
  onFilter: (filters: any) => void
  desks?: any[]
  users?: any[]
}

export function ClientFilters({
  onFilter,
  desks = [],
  users = [],
}: ClientFiltersProps) {
  const [filters, setFilters] = useState({
    status: "",
    country: "",
    salesRepId: "",
    retentionRepId: "",
    salesDeskId: "",
    retentionDeskId: "",
    affiliate: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilter(newFilters)
  }

  const handleReset = () => {
    const emptyFilters = {
      status: "",
      country: "",
      salesRepId: "",
      retentionRepId: "",
      salesDeskId: "",
      retentionDeskId: "",
      affiliate: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    }
    setFilters(emptyFilters)
    onFilter(emptyFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== "" && v !== null
  ).length

  return (
    <div className="space-y-4">
      {/* Quick Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search by name, email, phone, or ID..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-gray-300"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? "Hide" : "Show"} Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <select
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                {SALES_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Country</Label>
              <Input
                placeholder="Filter by country..."
                value={filters.country}
                onChange={(e) => handleFilterChange("country", e.target.value)}
                className="mt-1 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Sales Desk</Label>
              <select
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                value={filters.salesDeskId}
                onChange={(e) => handleFilterChange("salesDeskId", e.target.value)}
              >
                <option value="">All Desks</option>
                {desks.map((desk) => (
                  <option key={desk.id} value={desk.id}>
                    {desk.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Sales Rep</Label>
              <select
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                value={filters.salesRepId}
                onChange={(e) => handleFilterChange("salesRepId", e.target.value)}
              >
                <option value="">All Reps</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Retention Desk</Label>
              <select
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                value={filters.retentionDeskId}
                onChange={(e) =>
                  handleFilterChange("retentionDeskId", e.target.value)
                }
              >
                <option value="">All Desks</option>
                {desks.map((desk) => (
                  <option key={desk.id} value={desk.id}>
                    {desk.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Retention Rep</Label>
              <select
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                value={filters.retentionRepId}
                onChange={(e) =>
                  handleFilterChange("retentionRepId", e.target.value)
                }
              >
                <option value="">All Reps</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Affiliate</Label>
              <Input
                placeholder="Filter by affiliate..."
                value={filters.affiliate}
                onChange={(e) => handleFilterChange("affiliate", e.target.value)}
                className="mt-1 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="mt-1 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="mt-1 border-gray-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
