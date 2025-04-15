"use client"

import type { UserContribution } from "@/utils/document-processor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

interface ContributionChartProps {
  userContributions: UserContribution
}

export function ContributionChart({ userContributions }: ContributionChartProps) {
  // Process the contribution data
  const contributionData = Object.entries(userContributions).flatMap(([userId, userData]) => {
    return Object.entries(userData.contributions).map(([date, count]) => {
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rawDate: date,
        count,
        user: userData.name,
      }
    })
  })

  // Sort by date
  contributionData.sort((a, b) => {
    const dateA = new Date(a.rawDate)
    const dateB = new Date(b.rawDate)
    return dateA.getTime() - dateB.getTime()
  })

  if (contributionData.length === 0) {
    return (
      <Card className="border-t-4 border-t-[#8F48D8] shadow-sm card-hover-effect">
        <CardHeader className="bg-[#8F48D8]/5">
          <CardTitle className="text-[#8F48D8] flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Contributions Per Day
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No contribution data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find the maximum contribution count for scaling
  const maxCount = Math.max(...contributionData.map((d) => d.count))

  return (
    <Card className="border-t-4 border-t-[#8F48D8] shadow-sm card-hover-effect">
      <CardHeader className="bg-[#8F48D8]/5">
        <CardTitle className="text-[#8F48D8] flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Contributions Per Day
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Chart container with gradient background */}
        <div className="h-[200px] relative bg-gradient-to-b from-white to-slate-50 rounded-md border p-4 mb-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground px-2">
            <div>{maxCount.toLocaleString()}</div>
            <div>{Math.floor(maxCount / 2).toLocaleString()}</div>
            <div>0</div>
          </div>

          {/* Chart area */}
          <div className="absolute left-[40px] right-0 top-0 bottom-[20px] flex items-end">
            {contributionData.map((item, index) => {
              // Calculate height percentage based on count and max count
              const heightPercentage = (item.count / maxCount) * 100

              return (
                <div key={index} className="flex flex-col items-center justify-end h-full flex-1 px-2 group">
                  <div
                    className="w-full bg-gradient-to-t from-[#8F48D8] to-[#9F68E8] rounded-t-sm transition-all group-hover:opacity-90 group-hover:shadow-md relative overflow-hidden"
                    style={{ height: `${heightPercentage}%`, minHeight: "4px" }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white text-xs font-medium px-2 py-1 rounded shadow-sm">
                        {item.count.toLocaleString()}
                      </div>
                    </div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine"></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute left-[40px] right-0 bottom-0 flex justify-around text-xs text-muted-foreground">
            {contributionData.map((item, index) => (
              <div key={index} className="font-medium">
                {item.date}
              </div>
            ))}
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-white rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2 text-muted-foreground">Date</th>
                <th className="text-left p-2 text-muted-foreground">Contributor</th>
                <th className="text-right p-2 text-muted-foreground">Contributions</th>
              </tr>
            </thead>
            <tbody>
              {contributionData.map((item, index) => (
                <tr key={index} className="border-t hover:bg-slate-50">
                  <td className="p-2">{item.date}</td>
                  <td className="p-2">{item.user}</td>
                  <td className="p-2 text-right font-medium">{item.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
