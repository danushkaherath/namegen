// Simple in-memory cache for domain availability (for serverless environment)
const domainCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check domain with caching
export async function checkDomainWithCache(domain: string) {
  const now = Date.now();
  const cached = domainCache.get(domain);
  
  // Return cached result if it's still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Otherwise, make API call to Domainr via RapidAPI
  try {
    const response = await fetch(`https://domainr.p.rapidapi.com/v2/status?domain=${domain}`, {
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
    const status = data.status[0]?.status;
    const isAvailable = status === 'available';
    
    const result = { available: isAvailable, status };
    
    // Cache the result
    domainCache.set(domain, {
      data: result,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    console.error(`Error checking domain ${domain}:`, error);
    return { available: false, status: 'error' };
  }
}