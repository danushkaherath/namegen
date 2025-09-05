import { NextRequest, NextResponse } from 'next/server';
import { checkDomainWithCache } from '@/lib/domainCheck';

// List of popular domain extensions to check
const DOMAIN_EXTENSIONS = ['.com', '.io', '.net', '.co', '.ai', '.org', '.dev', '.app'];

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
    }

    // Format the base name (lowercase, no spaces)
    const baseName = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');

    // Check availability for each domain extension
    const domainResults = await Promise.all(
      DOMAIN_EXTENSIONS.map(async (extension) => {
        const domainToCheck = `${baseName}${extension}`;
        
        try {
          const result = await checkDomainWithCache(domainToCheck);
          
          return {
            domain: domainToCheck,
            extension,
            available: result.available,
            status: result.status
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