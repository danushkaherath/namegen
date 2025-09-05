'use client';

import { useState } from 'react';
import FullReportModal from '@/components/FullReportModal';

// Simple in-memory cache for domain checks
const domainCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check domain with caching
async function checkDomainWithCache(name: string) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');
  const domainToCheck = `${cleanName}.com`;
  const now = Date.now();
  
  // Check cache first
  const cached = domainCache.get(domainToCheck);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return { name, ...cached.data };
  }
  
  try {
    // Use Domainr API through RapidAPI
    const response = await fetch(`https://domainr.p.rapidapi.com/v2/status?domain=${domainToCheck}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'd65586099fmsh5f1a2354faf20b6p1382a6jsn7ba5353ddaba',
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
    const isAvailable = status === 'available';

    const result = { 
      name, 
      domain: domainToCheck, 
      available: isAvailable, 
      status 
    };
    
    // Cache the result
    domainCache.set(domainToCheck, {
      data: result,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    console.error('Error checking domain:', error);
    return { 
      name, 
      domain: domainToCheck, 
      available: false, 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default function Home() {
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<Array<{
    name: string;
    available?: boolean;
    status?: string;
    domain?: string;
  }>>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const handleGenerate = async () => {
    if (!keywords) return;
    
    setIsLoading(true);
    
    try {
      // Get AI-generated names
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate names');
      }

      const data = await response.json();
      
      // Set initial state with "checking" status
      const namesWithCheckingStatus = data.names.map((name: string) => ({
        name,
        available: undefined,
        status: 'checking'
      }));
      
      setGeneratedNames(namesWithCheckingStatus);
      
      // Check availability for each name with delays to avoid rate limiting
      const namesWithAvailability = await Promise.all(
        data.names.map(async (name: string, index: number) => {
          // Add a small delay to avoid rate limiting (200ms between requests)
          await new Promise(resolve => setTimeout(resolve, index * 200));
          return checkDomainWithCache(name);
        })
      );
      
      setGeneratedNames(namesWithAvailability);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate names. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setGeneratedNames([]);
    setKeywords('');
  };

  const handleGetReport = (name: string) => {
    setSelectedName(name);
    setIsReportModalOpen(true);
  };

  const retryDomainCheck = async (name: string, index: number) => {
    try {
      const updatedNames = [...generatedNames];
      updatedNames[index] = { ...updatedNames[index], status: 'checking' };
      setGeneratedNames(updatedNames);
      
      const result = await checkDomainWithCache(name);
      
      const newUpdatedNames = [...generatedNames];
      newUpdatedNames[index] = result;
      setGeneratedNames(newUpdatedNames);
    } catch (error) {
      console.error(`Retry failed for ${name}:`, error);
    }
  };

  const getStatusText = (status: string | undefined, available: boolean | undefined) => {
    if (status === 'available') return '.com available';
    if (status === 'active') return '.com registered';
    if (status === 'inactive') return '.com inactive';
    if (status === 'pending') return '.com pending';
    if (status === 'disallowed') return '.com not allowed';
    if (status === 'reserved') return '.com reserved';
    if (status === 'premium') return '.com premium';
    if (status === 'error') return 'Check failed';
    if (available === true) return '.com available';
    if (available === false) return '.com taken';
    return 'Checking...';
  };

  const getStatusClass = (status: string | undefined, available: boolean | undefined) => {
    if (status === 'available' || available === true) return 'text-green-600';
    if (status === 'error') return 'text-gray-500';
    if (status === 'checking') return 'text-gray-500';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PrimeNym
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</a>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-500">
              AI-Powered Business Names
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Generate memorable, brandable business names with artificial intelligence. 
            Find your perfect name in seconds, not days.
          </p>

          {/* Main Generator Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto border border-white/20">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                What&apos;s your business about?
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., sustainable fashion, tech startup, coffee shop..."
                  className="w-full px-6 py-4 text-lg border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 shadow-sm"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <div className="absolute right-2 top-2">
                  <button 
                    onClick={handleGenerate}
                    disabled={isLoading || !keywords}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : 'Generate Names'}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 flex items-center justify-center space-x-4">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Instant AI Generation
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Domain Availability
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                100% Free
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">10K+</div>
              <div className="text-gray-600">Names Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">24/7</div>
              <div className="text-gray-600">AI Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {generatedNames.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Generated Names
              </h2>
              <p className="text-xl text-gray-600">
                We found {generatedNames.length} perfect names for your business
              </p>
            </div>

            <div className="grid gap-4 mb-12">
              {generatedNames.map((item, index) => {
                const statusText = getStatusText(item.status, item.available);
                const statusClass = getStatusClass(item.status, item.available);
                const showRetry = item.status === 'error';
                
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {item.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                          <div className="flex items-center">
                            <span className={`text-sm ${statusClass} mr-2`}>
                              {statusText}
                            </span>
                            {showRetry && (
                              <button 
                                onClick={() => retryDomainCheck(item.name, index)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Retry
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleGetReport(item.name)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          Get Full Report
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <button 
                onClick={handleTryAgain}
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 transform hover:scale-105"
              >
                ↻ Generate New Names
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose PrimeNym?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform takes the stress out of naming your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
              <p className="text-gray-600">Generate dozens of professional names in seconds, not days</p>
            </div>

            <div className="text-center p-6 rounded-2xl hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Powered</h3>
              <p className="text-gray-600">Advanced AI that understands branding and market trends</p>
            </div>

            <div className="text-center p-6 rounded-2xl hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Domain Checks</h3>
              <p className="text-gray-600">Instant domain availability checking for popular extensions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Entrepreneurs
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying about PrimeNym
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Founder, EcoVerve",
                text: "Found our perfect name in under a minute. The domain was available too!",
                avatar: "SC"
              },
              {
                name: "Michael Rodriguez",
                role: "Tech Startup CEO",
                text: "Saved us weeks of brainstorming. The AI suggestions were incredibly relevant.",
                avatar: "MR"
              },
              {
                name: "Emily Watson",
                role: "Creative Director",
                text: "The quality of names generated is exceptional. Better than any naming agency I&apos;ve used.",
                avatar: "EW"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{testimonial.avatar}</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">&ldquo;{testimonial.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold">PrimeNym</span>
          </div>
          <p className="text-gray-400 mb-8">
            Generating the perfect business names with AI
          </p>
          <div className="flex justify-center space-x-6 mb-8">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} PrimeNym. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Full Report Modal */}
      <FullReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        name={selectedName}
      />
    </div>
  );
}