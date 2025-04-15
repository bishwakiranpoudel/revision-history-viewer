"use client"

import { useState, useEffect } from "react"
import { DocumentViewer } from "@/components/document-viewer"
import { ContributionChart } from "@/components/contribution-chart"
import { CopyPasteStats } from "@/components/copy-paste-stats"
import { ContributorsList } from "@/components/contributors-list"
import { EditingSummary } from "@/components/editing-summary"
import { Navbar } from "@/components/navbar"
import {
  type DocumentData,
  type ProcessedChange,
  type UserContribution,
  processDocumentData,
} from "@/utils/document-processor"
import { FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RevisionHistoryViewer() {
  const [processedChanges, setProcessedChanges] = useState<ProcessedChange[]>([])
  const [userContributions, setUserContributions] = useState<UserContribution>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Only fetch from the API route
        const response = await fetch("/api/document-data")

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }

        const data: DocumentData = await response.json()

        // Process the data
        const changes = processDocumentData(data)

        // User contributions are already in object format in the JSON
        setUserContributions(data.user_contribution as UserContribution)
        setProcessedChanges(changes)

        console.log("User contributions data:", data.user_contribution)
      } catch (error) {
        console.error("Failed to load document data:", error)
        setError("Failed to load document data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center flex-1 bg-slate-50/50">
          <div className="text-center p-8 rounded-lg">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-[#8F48D8]/30 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-[#8F48D8] rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">Loading document history...</p>
            <p className="text-sm text-gray-500 mt-2">Preparing visualization of document changes</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 bg-slate-50/50 p-8">
          <h1 className="text-3xl font-bold text-[#8F48D8] mb-6">Document Revision History</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-1 bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-7 w-7 text-[#8F48D8]" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Document Revision History</h1>
          </div>

          <EditingSummary changes={processedChanges} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <DocumentViewer changes={processedChanges} />
            </div>

            <div className="space-y-6">
              <ContributorsList userContributions={userContributions} />
              <ContributionChart userContributions={userContributions} />
              <CopyPasteStats changes={processedChanges} />
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-50 border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="h-8 w-28 relative">
                <img src="/logo.png" alt="ChimpVine Logo" className="h-full object-contain" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Document Revision History Viewer</p>
            </div>
            <div className="text-sm text-gray-500">© {new Date().getFullYear()} ChimpVine. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
