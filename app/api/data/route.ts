import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint can be used to verify server-side data processing
    // For now, we're using localStorage on client side
    
    return NextResponse.json({
      success: true,
      message: 'Data API is working. Currently using browser localStorage for temporary storage.',
      info: {
        storageType: 'localStorage',
        endpoint: '/api/data',
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch data: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Endpoint to clear data (client-side will handle localStorage clearing)
    return NextResponse.json({
      success: true,
      message: 'Clear data request received. Use localStorage.clear() on client side.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to clear data: ' + error.message },
      { status: 500 }
    )
  }
}
