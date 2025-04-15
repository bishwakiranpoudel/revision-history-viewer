"use client"

import { useState } from "react"
import type { ProcessedChange } from "@/utils/document-processor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Info, FileText, Copy, Type, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditingSummaryProps {
  changes: ProcessedChange[]
}

export function EditingSummary({ changes }: EditingSummaryProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Analyze the document creation process
  const totalChanges = changes.length
  const insertions = changes.filter((c) => c.type === "insert").length
  const deletions = changes.filter((c) => c.type === "delete").length
  const massInsertions = changes.filter((c) => c.isMassInsertion).length
  const copyPasteOperations = changes.filter((c) => c.isCopyPaste && !c.isMassInsertion).length
  const smallEdits = changes.filter((c) => c.type === "insert" && !c.isCopyPaste).length

  // Identify editing phases
  const timeRanges = changes.reduce(
    (acc, change) => {
      const date = new Date(change.timestamp).toLocaleDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(change)
      return acc
    },
    {} as Record<string, ProcessedChange[]>,
  )

  const editingDays = Object.keys(timeRanges).length

  // Calculate average change size
  const avgInsertionSize =
    changes.filter((c) => c.type === "insert").reduce((sum, c) => sum + c.length, 0) / insertions || 0

  const avgDeletionSize =
    changes.filter((c) => c.type === "delete").reduce((sum, c) => sum + c.length, 0) / deletions || 0

  return (
    <Card className="border-t-4 border-t-[#8F48D8] mb-6 shadow-sm card-hover-effect">
      <CardHeader className="bg-[#8F48D8]/5">
        <CardTitle className="text-[#8F48D8] flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Document Creation Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-[#8F48D8]/5 to-[#8F48D8]/10 rounded-md border">
            <p className="text-sm">
              This document was created over <strong>{editingDays} day(s)</strong> with a total of{" "}
              <strong>{totalChanges} changes</strong>, including {insertions} insertions and {deletions} deletions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-md border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-[#8F48D8]/10 p-1.5">
                  <FileText className="h-4 w-4 text-[#8F48D8]" />
                </div>
                <p className="text-xs text-muted-foreground">Mass Insertions</p>
              </div>
              <p className="text-xl font-bold">{massInsertions}</p>
            </div>
            <div className="bg-white p-4 rounded-md border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-blue-100 p-1.5">
                  <Copy className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground">Copy-Paste Ops</p>
              </div>
              <p className="text-xl font-bold">{copyPasteOperations}</p>
            </div>
            <div className="bg-white p-4 rounded-md border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-purple-100 p-1.5">
                  <Type className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground">Small Edits</p>
              </div>
              <p className="text-xl font-bold">{smallEdits}</p>
            </div>
            <div className="bg-white p-4 rounded-md border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-red-100 p-1.5">
                  <Scissors className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-xs text-muted-foreground">Avg Insert Size</p>
              </div>
              <p className="text-xl font-bold">{Math.round(avgInsertionSize)}</p>
            </div>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex justify-between hover:bg-[#8F48D8]/5">
                <span>Document Creation Pattern</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-3 text-sm bg-white p-4 rounded-md border">
                <p>
                  <strong className="text-[#8F48D8]">Initial Setup:</strong> The document began with small
                  character-by-character edits, suggesting the author was setting up the initial structure.
                </p>
                <p>
                  <strong className="text-[#8F48D8]">Mass Content Addition:</strong> Large blocks of text were added
                  through copy-paste operations, forming the bulk of the document content.
                </p>
                <p>
                  <strong className="text-[#8F48D8]">Refinement:</strong> The author made formatting improvements,
                  adding line breaks and adjusting spacing to improve readability.
                </p>
                <p>
                  <strong className="text-[#8F48D8]">Restructuring:</strong> Content was deleted and reinserted with
                  better formatting, showing an iterative improvement process.
                </p>
                <div className="mt-4 p-3 bg-[#8F48D8]/5 rounded-md text-xs text-muted-foreground">
                  <p className="font-medium text-gray-700 mb-1">Pro Tip:</p>
                  <p>
                    Use the playback controls to see these patterns in action. Pay special attention to the large
                    insertions and how the document structure evolves.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  )
}
