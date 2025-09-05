import { NextRequest, NextResponse } from 'next/server';

// List of popular domain extensions to check
const DOMAIN_EXTENSIONS = ['.com', '.io', '.net', '.co', '.ai', '.org', '.dev', '.app'];

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
    }

    // Format the base name (lowercase, no spaces)
    const baseName = name.toLowerCase().replace(/\s+/g, '');

    // Check availability for each domain extension
    const domainResults = await Promise.all(
      DOMAIN_EXTENSIONS.map(async (extension) => {
        const domainToCheck = `${baseName}${extension}`;
        
        try {
          const response = await fetch(`https://api.domainr.com/v2/status?domain=${domainToCheck}&client_id=primenym`);
          
          if (!response.ok) {
            throw new Error(`Domainr API error: ${response.status}`);
          }

          const data = await response.json();
          const status = data.status[0]?.status;
          const isAvailable = status === 'available';
          
          return {
            domain: domainToCheck,
            extension,
            available: isAvailable,
            status
          };
        } catch (error) {
          console.error(`Error checking domain ${domainToCheck}:`, error);
          return {
            domain: domainToCheck,
            extension,
            available: false,
            status: 'error'
          };
        }
      })
    );

    // Also check social media availability (simulated for now)
    const socialMediaResults = [
      { platform: 'Twitter', available: true, username: baseName },
      { platform: 'Instagram', available: true, username: baseName },
      { platform: 'Facebook', available: Math.random() > 0.3, username: baseName },
      { platform: 'TikTok', available: Math.random() > 0.4, username: baseName },
    ];

    return NextResponse.json({
      name,
      baseName,
      domains: domainResults,
      socialMedia: socialMediaResults,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating full report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}