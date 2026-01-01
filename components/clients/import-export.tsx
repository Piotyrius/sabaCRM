"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Upload, FileSpreadsheet, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react"

export function ImportExport() {
  const queryClient = useQueryClient()
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const handleExport = async (format: "csv" | "xlsx") => {
    setExporting(true)
    try {
      const response = await fetch(`/api/clients/export?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `clients-${new Date().toISOString().split("T")[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting:", error)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setImporting(true)
    setImportResult(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get("file") as File

    if (!file) {
      setImportResult("Please select a file")
      setImporting(false)
      return
    }

    try {
      const importFormData = new FormData()
      importFormData.append("file", file)

      const response = await fetch("/api/clients/import", {
        method: "POST",
        body: importFormData,
      })

      const data = await response.json()

      if (response.ok) {
        setImportResult(data.message)
        e.currentTarget.reset()
        queryClient.invalidateQueries({ queryKey: ["clients"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      } else {
        setImportResult(data.error || "Import failed")
      }
    } catch (error) {
      setImportResult("An error occurred during import")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2 text-green-600" />
            Export Clients
          </CardTitle>
          <CardDescription>
            Download your client data in CSV or Excel format
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              variant="outline"
              className="w-full justify-start border-gray-300 hover:bg-green-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </>
              )}
            </Button>
            <Button
              onClick={() => handleExport("xlsx")}
              disabled={exporting}
              variant="outline"
              className="w-full justify-start border-gray-300 hover:bg-green-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Import Clients
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file to import clients
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <Label htmlFor="file" className="text-sm font-medium">
                Select File
              </Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                required
                className="mt-2 border-gray-300 cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: CSV, XLSX, XLS
              </p>
            </div>
            <Button
              type="submit"
              disabled={importing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Clients
                </>
              )}
            </Button>
            {importResult && (
              <div
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  importResult.includes("successful")
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {importResult.includes("successful") ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{importResult}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
