import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';

// GET all registrations
export async function GET(request: NextRequest) {
  try {
    const registrations = await prisma.registration.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true
          }
        }
      }
    });
    
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

// POST create a new registration
export async function POST(request: NextRequest) {
  try {
    const { userId, eventId, status = 'pending' } = await request.json();
    
    if (!userId || !eventId) {
      return NextResponse.json(
        { error: 'User ID and Event ID are required' },
        { status: 400 }
      );
    }
    
    // Check for existing registration
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });
    
    if (existingRegistration) {
      return NextResponse.json(
        { error: 'User is already registered for this event' },
        { status: 409 }
      );
    }
    
    const registration = await prisma.registration.create({
      data: {
        userId,
        eventId,
        status
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true
          }
        }
      }
    });
    
    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
