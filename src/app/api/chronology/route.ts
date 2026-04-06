import { NextRequest, NextResponse } from 'next/server'

interface MemoryFragment {
  date?: string
  description: string
  metadata?: {
    location?: string
    people?: string[]
    emotions?: string[]
  }
}

interface ChronologyResult {
  chronologicalOrder: MemoryFragment[]
  gaps: string[]
  draftStatement: string
}

// Mock LLM function - in production, this would call Claude API
async function generateChronologyDraft(fragments: MemoryFragment[]): Promise<ChronologyResult> {
  // Sort fragments by date if available
  const sortedFragments = fragments.sort((a, b) => {
    if (a.date && b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    return 0
  })

  // Identify gaps
  const gaps: string[] = []
  for (let i = 0; i < sortedFragments.length - 1; i++) {
    const current = sortedFragments[i]
    const next = sortedFragments[i + 1]

    if (current.date && next.date) {
      const timeDiff = new Date(next.date).getTime() - new Date(current.date).getTime()
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

      if (daysDiff > 7) {
        gaps.push(`There's a gap of approximately ${Math.round(daysDiff)} days between the events on ${current.date} and ${next.date}. This is completely normal and doesn't diminish the validity of your experiences.`)
      }
    }
  }

  // Generate supportive draft statement
  const draftStatement = `LEGAL STATEMENT DRAFT

This statement represents a chronological reconstruction of events based on the memory fragments provided. Please remember that trauma can affect how we remember and organize experiences, and this draft is meant to support your healing journey and legal needs.

CHRONOLOGICAL TIMELINE:

${sortedFragments.map((fragment, index) => {
  const dateStr = fragment.date ? `On ${fragment.date}: ` : `Memory fragment ${index + 1}: `
  const location = fragment.metadata?.location ? ` (Location: ${fragment.metadata.location})` : ''
  const people = fragment.metadata?.people?.length ? ` (People involved: ${fragment.metadata.people.join(', ')})` : ''
  const emotions = fragment.metadata?.emotions?.length ? ` (Emotions: ${fragment.metadata.emotions.join(', ')})` : ''

  return `${dateStr}${fragment.description}${location}${people}${emotions}`
}).join('\n\n')}

${gaps.length > 0 ? `\n\nAREAS FOR FURTHER REFLECTION:\n\n${gaps.join('\n\n')}\n\nThese gaps are opportunities to explore more details when you're ready, but they don't invalidate the experiences you've already shared.` : ''}

This draft is a starting point and can be modified as you remember more details. Your safety and well-being are the highest priority.`

  return {
    chronologicalOrder: sortedFragments,
    gaps,
    draftStatement
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fragments }: { fragments: MemoryFragment[] } = await request.json()

    if (!fragments || !Array.isArray(fragments)) {
      return NextResponse.json(
        { error: 'Invalid input: fragments array is required' },
        { status: 400 }
      )
    }

    const result = await generateChronologyDraft(fragments)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating chronology:', error)
    return NextResponse.json(
      { error: 'Failed to generate chronology draft' },
      { status: 500 }
    )
  }
}