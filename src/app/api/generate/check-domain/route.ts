import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  // Format the name for a domain (lowercase, no spaces, no special characters)
  const cleanName = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');
  const domainToCheck = `${cleanName}.com`;

  try {
    // Use Domainr API through RapidAPI
    const response = await fetch(`https://domainr.p.rapidapi.com/v2/status?domain=${domainToCheck}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'd65586099fmsh5f1a2354faf20b6p1382a6jsn7ba5353ddaba',
        'x-rapidapi-host': 'domainr.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`Domainr API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.status || data.status.length === 0) {
      throw new Error('No status in response');
    }

    const status = data.status[0]?.status;
    
    // Domainr API status can be: active, inactive, pending, disallowed, available, reserved, premium, etc.
    // We'll consider it available only if status is explicitly "available"
    const isAvailable = status === 'available';

    return NextResponse.json({ 
      name, 
      domain: domainToCheck, 
      available: isAvailable, 
      status 
    });

  } catch (error) {
    console.error('Error checking domain:', error);
    return NextResponse.json({ 
      name, 
      domain: domainToCheck, 
      available: false, 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}