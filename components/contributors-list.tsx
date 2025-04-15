"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import type { UserContribution } from "@/utils/document-processor"

interface ContributorsListProps {
  userContributions: UserContribution
}

export function ContributorsList({ userContributions }: ContributorsListProps) {
  // Extract unique contributors from the user contributions
  const contributors = Object.entries(userContributions).map(([userId, userData]) => {
    // Calculate total contributions
    const totalContributions = Object.values(userData.contributions).reduce((sum, count) => sum + count, 0)

    return {
      id: userId,
      name: userData.name,
      photo_url: userData.photo_url,
      totalContributions,
    }
  })

  // Sort by total contributions (highest first)
  contributors.sort((a, b) => b.totalContributions - a.totalContributions)

  return (
    <Card className="border-t-4 border-t-[#8F48D8] shadow-sm card-hover-effect">
      <CardHeader className="bg-[#8F48D8]/5">
        <CardTitle className="text-[#8F48D8] flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {contributors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contributors found.</p>
          ) : (
            <ul className="space-y-3">
              {contributors.map((contributor) => (
                <li
                  key={contributor.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <Avatar className="h-12 w-12 border-2 border-[#8F48D8]/20">
                    <AvatarImage src={contributor.photo_url} alt={contributor.name} />
                    <AvatarFallback className="bg-[#8F48D8]/10 text-[#8F48D8]">
                      {contributor.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contributor.name}</p>
                    <div className="flex items-center mt-1">
                      <div className="h-2 bg-[#8F48D8]/20 rounded-full flex-1 overflow-hidden">
                        <div className="h-full bg-[#8F48D8] rounded-full" style={{ width: "100%" }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground ml-2">
                        {contributor.totalContributions.toLocaleString()} contributions
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
