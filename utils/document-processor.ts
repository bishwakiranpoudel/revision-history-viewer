// This utility processes the document changes and reconstructs the document state at any point in time

export interface Change {
  name: string
  photo_url: string
  s?: string
  start: number
  end?: number
  timestamp: number
  type: "is" | "ds"
  user_id: string
}

export interface MassInsertion {
  name: string
  photo_url: string
  text: string
  timestamp: number
  user_id: string
}

export interface Revision {
  revision: number
  user_id: string
}

export interface UserContribution {
  [userId: string]: {
    name: string
    photo_url: string
    contributions: {
      [date: string]: number
    }
  }
}

export interface DocumentData {
  changes: Change[]
  mass_insertion: MassInsertion[]
  revisions: Revision[]
  user_contribution: UserContribution | string
}

export interface ProcessedChange {
  text: string
  timestamp: number
  type: "insert" | "delete"
  length: number
  position: number
  user: {
    name: string
    photo_url: string
    id: string
  }
  isCopyPaste: boolean
  isMassInsertion?: boolean
  isLargeInsertion?: boolean
}

export interface DocumentState {
  content: string
  timestamp: number
  changeIndex: number
  cursorPosition: number
}

// Process the raw document data into a format that's easier to work with
export function processDocumentData(data: DocumentData): ProcessedChange[] {
  const processedChanges: ProcessedChange[] = []

  // Process regular changes
  data.changes.forEach((change) => {
    if (change.type === "is" && change.s) {
      processedChanges.push({
        text: change.s,
        timestamp: change.timestamp,
        type: "insert",
        length: change.s.length,
        position: change.start,
        user: {
          name: change.name,
          photo_url: change.photo_url,
          id: change.user_id,
        },
        isCopyPaste: change.s.length > 10, // Simple heuristic to detect copy-paste
        isLargeInsertion: change.s.length > 5, // As per requirement, insertions > 5 chars should appear instantly
      })
    } else if (change.type === "ds" && change.end !== undefined) {
      processedChanges.push({
        text: "",
        timestamp: change.timestamp,
        type: "delete",
        length: change.end - change.start,
        position: change.start,
        user: {
          name: change.name,
          photo_url: change.photo_url,
          id: change.user_id,
        },
        isCopyPaste: false,
      })
    }
  })

  // Process mass insertions
  data.mass_insertion.forEach((insertion) => {
    processedChanges.push({
      text: insertion.text,
      timestamp: insertion.timestamp,
      type: "insert",
      length: insertion.text.length,
      position: -1, // We don't know the position for mass insertions
      user: {
        name: insertion.name,
        photo_url: insertion.photo_url,
        id: insertion.user_id,
      },
      isCopyPaste: true,
      isMassInsertion: true,
      isLargeInsertion: true, // Mass insertions are always large
    })
  })

  // Sort by timestamp
  return processedChanges.sort((a, b) => a.timestamp - b.timestamp)
}

// Get the document state at a specific index
export function getDocumentStateAtIndex(changes: ProcessedChange[], index: number): DocumentState {
  let content = ""
  let cursorPosition = 0

  // Apply all changes up to and including the specified index
  for (let i = 0; i <= index; i++) {
    const change = changes[i]

    if (change.type === "insert") {
      if (change.position >= 0) {
        // For regular insertions, insert at the exact position specified
        // If position is beyond content length, append to the end
        const insertPosition = Math.min(change.position, content.length)
        content = content.substring(0, insertPosition) + change.text + content.substring(insertPosition)
        cursorPosition = insertPosition + change.text.length
      } else {
        // For mass insertions where we don't know the position
        content += change.text
        cursorPosition = content.length
      }
    } else if (change.type === "delete") {
      // For deletions, delete the exact range specified
      // Ensure we don't delete beyond content length
      const deleteStart = Math.min(change.position, content.length)
      const deleteEnd = Math.min(change.position + change.length, content.length)

      // Only delete if there's something to delete
      if (deleteStart < deleteEnd) {
        content = content.substring(0, deleteStart) + content.substring(deleteEnd)
      }

      cursorPosition = deleteStart
    }
  }

  return {
    content,
    timestamp: changes[index].timestamp,
    changeIndex: index,
    cursorPosition,
  }
}

// Get statistics about copy-paste operations
export function getCopyPasteStats(changes: ProcessedChange[]): {
  totalChanges: number
  copyPasteChanges: number
  copyPastePercentage: number
  largestCopyPaste: number
} {
  const copyPasteChanges = changes.filter((change) => change.isCopyPaste)
  const largestCopyPaste = copyPasteChanges.reduce((max, change) => Math.max(max, change.length), 0)

  return {
    totalChanges: changes.length,
    copyPasteChanges: copyPasteChanges.length,
    copyPastePercentage: (copyPasteChanges.length / changes.length) * 100,
    largestCopyPaste,
  }
}

// Add a function to get detailed copy-paste information
export function getDetailedCopyPasteInfo(changes: ProcessedChange[]): {
  user: {
    name: string
    photo_url: string
    id: string
  }
  text: string
  timestamp: number
  length: number
}[] {
  return changes
    .filter((change) => change.isCopyPaste && change.type === "insert")
    .map((change) => ({
      user: change.user,
      text: change.text,
      timestamp: change.timestamp,
      length: change.length,
    }))
    .sort((a, b) => b.length - a.length) // Sort by length (largest first)
}
