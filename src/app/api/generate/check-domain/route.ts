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
    // Use Domainr's free API to check availability
    const response = await fetch(`https://api.domainr.com/v2/status?domain=${domainToCheck}&client_id=primenym`, {
      method: 'GET',
      headers: {
        'User-Agent': 'PrimeNym/1.0 (https://primenym.com)'
      }
    });

    if (!response.ok) {
      // If Domainr API fails, try a fallback method
      console.warn(`Domainr API failed with status ${response.status}, trying fallback method`);
      return fallbackDomainCheck(cleanName);
    }

    const data = await response.json();
    
    if (!data.status || data.status.length === 0) {
      return fallbackDomainCheck(cleanName);
    }

    const status = data.status[0]?.status;
    
    // Simplify the status into a boolean if it's available or not
    const isAvailable = status === 'available';

    return NextResponse.json({ 
      name, 
      domain: domainToCheck, 
      available: isAvailable, 
      status 
    });

  } catch (error) {
    console.error('Error checking domain:', error);
    return fallbackDomainCheck(cleanName);
  }
}

// Fallback method for domain checking
async function fallbackDomainCheck(name: string) {
  const domainToCheck = `${name}.com`;
  
  try {
    // Try a simple DNS lookup as fallback
    // Note: This is a less reliable method but works as a fallback
    const response = await fetch(`https://dns.google/resolve?name=${domainToCheck}&type=A`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      // If we get a valid DNS response, the domain is probably taken
      const isAvailable = !(data.Answer && data.Answer.length > 0);
      
      return NextResponse.json({ 
        name, 
        domain: domainToCheck, 
        available: isAvailable, 
        status: isAvailable ? 'available' : 'taken',
        source: 'fallback'
      });
    }
  } catch (fallbackError) {
    console.error('Fallback domain check also failed:', fallbackError);
  }

  // If all methods fail, return a neutral response
  return NextResponse.json({ 
    name, 
    domain: domainToCheck, 
    available: null, 
    status: 'unknown',
    source: 'none'
  });
}