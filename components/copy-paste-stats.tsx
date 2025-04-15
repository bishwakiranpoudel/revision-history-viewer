"use client"

import { useState } from "react"
import { type ProcessedChange, getCopyPasteStats, getDetailedCopyPasteInfo } from "@/utils/document-processor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Trash, ChevronDown, ChevronUp, BarChart2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface CopyPasteStatsProps {
  changes: ProcessedChange[]
}

export function CopyPasteStats({ changes }: CopyPasteStatsProps) {
  const stats = getCopyPasteStats(changes)
  const copyPasteDetails = getDetailedCopyPasteInfo(changes)
  const [isOpen, setIsOpen] = useState(false)

  // Count insertions and deletions
  const insertions = changes.filter((change) => change.type === "insert").length
  const deletions = changes.filter((change) => change.type === "delete").length

  // Calculate total characters inserted and deleted
  const charsInserted = changes
    .filter((change) => change.type === "insert")
    .reduce((sum, change) => sum + change.length, 0)

  const charsDeleted = changes
    .filter((change) => change.type === "delete")
    .reduce((sum, change) => sum + change.length, 0)

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Truncate text for display
  const truncateText = (text: string, maxLength = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <Card className="border-t-4 border-t-[#8F48D8] shadow-sm card-hover-effect">
      <CardHeader className="bg-[#8F48D8]/5">
        <CardTitle className="text-[#8F48D8] flex items-center">
          <BarChart2 className="h-5 w-5 mr-2" />
          Editing Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-white rounded-md border shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-[#8F48D8]/20 p-3">
                <Copy className="h-5 w-5 text-[#8F48D8]" />
              </div>
              <div>
                <p className="text-sm font-medium">Copy-Paste</p>
                <p className="text-xl font-bold">{stats.copyPasteChanges}</p>
                <p className="text-xs text-muted-foreground">{stats.copyPastePercentage.toFixed(1)}% of changes</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-white rounded-md border shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-destructive/20 p-3">
                <Trash className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Deletions</p>
                <p className="text-xl font-bold">{deletions}</p>
                <p className="text-xs text-muted-foreground">{charsDeleted} characters</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-50 rounded-md border">
            <div className="flex justify-between">
              <span className="text-sm">Total Changes</span>
              <span className="font-medium">{stats.totalChanges}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Insertions</span>
              <span className="font-medium">{insertions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Characters Inserted</span>
              <span className="font-medium">{charsInserted.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Largest Copy-Paste</span>
              <span className="font-medium">{stats.largestCopyPaste.toLocaleString()} chars</span>
            </div>
          </div>

          {copyPasteDetails.length > 0 && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 font-medium bg-[#8F48D8]/5 hover:bg-[#8F48D8]/10 transition-colors">
                <span>Copy-Paste Details</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {copyPasteDetails.map((detail, index) => (
                  <div key={index} className="rounded-md border p-3 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={detail.user.photo_url} />
                        <AvatarFallback className="bg-[#8F48D8]/10 text-[#8F48D8]">
                          {detail.user.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{detail.user.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatTimestamp(detail.timestamp)}</span>
                    </div>
                    <div className="text-xs bg-slate-50 p-2 rounded border">{truncateText(detail.text, 100)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {detail.length.toLocaleString()} characters
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
