import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET() {
  try {
    // Get the path to the data.json file
    const dataFilePath = path.join(process.cwd(), "public", "data.json")

    // Read the file
    let fileContents = fs.readFileSync(dataFilePath, "utf8")

    // Sanitize the JSON string by removing control characters
    fileContents = fileContents.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")

    // Parse the JSON data
    const documentData = JSON.parse(fileContents)

    return NextResponse.json(documentData)
  } catch (error) {
    console.error("Error reading data.json file:", error)
    return NextResponse.json({ error: "Failed to load document data" }, { status: 500 })
  }
}
