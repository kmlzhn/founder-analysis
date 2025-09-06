import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';

// GET endpoint to retrieve search history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Build the query
    const query: any = {};
    
    // Filter by userId if provided
    if (userId) {
      query.where = { userId };
    }
    
    // Get searches ordered by createdAt (newest first)
    const searches = await prisma.search.findMany({
      ...query,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Error retrieving search history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve search history' },
      { status: 500 }
    );
  }
}

// POST endpoint to save a new search
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      searchType, 
      searchQuery, 
      founderScore, 
      analysisResults 
    } = await request.json();
    
    // Validate required fields
    if (!searchType || !searchQuery || founderScore === undefined || !analysisResults) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the search record
    const search = await prisma.search.create({
      data: {
        userId,
        searchType,
        searchQuery,
        founderScore,
        analysisResults,
      },
    });
    
    return NextResponse.json({ search });
  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a search by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    await prisma.search.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting search:', error);
    return NextResponse.json(
      { error: 'Failed to delete search' },
      { status: 500 }
    );
  }
}
