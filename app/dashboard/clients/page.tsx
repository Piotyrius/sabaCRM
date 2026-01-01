"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientFilters } from "@/components/clients/client-filters"
import { ImportExport } from "@/components/clients/import-export"
import { BulkActions } from "@/components/clients/bulk-actions"
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Loader2,
  Users,
} from "lucide-react"

interface Client {
  id: string
  clientId: string | null
  name: string
  email: string | null
  phone: string | null
  country: string | null
  salesStatus: string
  balance: number
  registrationDate: string
  salesRep: { name: string | null } | null
  retentionRep: { name: string | null } | null
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<any>({})
  const [desks, setDesks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Use React Query for caching and deduplication
  const { data: desksData } = useQuery({
    queryKey: ["desks"],
    queryFn: async () => {
      const response = await fetch("/api/desks")
      if (!response.ok) throw new Error("Failed to fetch desks")
      return response.json()
    },
    enabled: !!session,
  })

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      return response.json()
    },
    enabled: !!session,
  })

  useEffect(() => {
    if (desksData) setDesks(desksData)
  }, [desksData])

  useEffect(() => {
    if (usersData) setUsers(usersData)
  }, [usersData])

  const hasFilters = useMemo(
    () => Object.values(filters).some((v) => v !== "" && v !== null),
    [filters]
  )

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: hasFilters
      ? ["clients", "filter", filters]
      : ["clients", "page", page],
    queryFn: async () => {
      if (hasFilters) {
        const response = await fetch("/api/clients/filter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        })
        if (!response.ok) throw new Error("Failed to fetch clients")
        const data = await response.json()
        return { clients: data.clients, totalPages: 1 }
      } else {
        const response = await fetch(`/api/clients?page=${page}&limit=50`)
        if (!response.ok) throw new Error("Failed to fetch clients")
        const data = await response.json()
        return {
          clients: data.clients,
          totalPages: data.pagination.totalPages,
        }
      }
    },
    enabled: !!session,
  })

  useEffect(() => {
    if (clientsData) {
      setClients(clientsData.clients)
      setTotalPages(clientsData.totalPages)
    }
  }, [clientsData])

  useEffect(() => {
    setLoading(clientsLoading)
  }, [clientsLoading])

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters)
    setPage(1)
  }

  const queryClientHook = useQueryClient()
  const handleSuccess = () => {
    queryClientHook.invalidateQueries({ queryKey: ["clients"] })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CONVERTED: "bg-green-100 text-green-800 border-green-200",
      HIGH_POTENTIAL: "bg-blue-100 text-blue-800 border-blue-200",
      LOW_POTENTIAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
      CALLBACK: "bg-purple-100 text-purple-800 border-purple-200",
      NOT_INTERESTED: "bg-red-100 text-red-800 border-red-200",
      NO_ANSWER: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return (
      colors[status] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    )
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your client database ({clients.length} clients)
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/clients/new")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-gray-300"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? "Hide" : "Show"} Filters
        </Button>
        <ImportExport />
      </div>

      {showFilters && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <ClientFilters onFilter={handleFilter} desks={desks} users={users} />
          </CardContent>
        </Card>
      )}

      {selectedIds.length > 0 && (
        <BulkActions
          selectedIds={selectedIds}
          onSuccess={() => {
            setSelectedIds([])
            queryClient.invalidateQueries({ queryKey: ["clients"] })
          }}
          desks={desks}
          users={users}
        />
      )}

      {/* Clients Table */}
      {loading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading clients...</p>
            </div>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No clients found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first client
              </p>
              <Button
                onClick={() => router.push("/dashboard/clients/new")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-600" />
              Client List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === clients.length &&
                          clients.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(clients.map((c) => c.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sales Rep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(client.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, client.id])
                            } else {
                              setSelectedIds(
                                selectedIds.filter((id) => id !== client.id)
                              )
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">
                          {client.clientId || client.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        {client.country && (
                          <div className="text-sm text-gray-500">
                            {client.country}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.email || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                            client.salesStatus
                          )}`}
                        >
                          {client.salesStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ${client.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.salesRep?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/clients/${client.id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
