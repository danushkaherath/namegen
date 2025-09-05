'use client';

import { useState, useEffect, useCallback } from 'react';

interface DomainResult {
  domain: string;
  extension: string;
  available: boolean;
  status: string;
}

interface SocialMediaResult {
  platform: string;
  available: boolean;
  username: string;
}

interface ReportData {
  name: string;
  baseName: string;
  domains: DomainResult[];
  socialMedia: SocialMediaResult[];
  generatedAt: string;
}

interface FullReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
}

export default function FullReportModal({ isOpen, onClose, name }: FullReportModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  // Use useCallback to memoize the function and fix the useEffect dependency warning
  const generateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/full-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [name]); // Add name as a dependency

  useEffect(() => {
    if (isOpen && name) {
      generateReport();
    }
  }, [isOpen, name, generateReport]); // Add generateReport to the dependency array

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const handleBuyDomain = (domain: string) => {
    window.open(`https://www.namecheap.com/domains/registration/results/?domain=${domain}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Domain Report for &quot;{name}&quot;</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : reportData ? (
            <div>
              {/* Domain Availability Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Domain Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportData.domains.map((domain) => (
                    <div
                      key={domain.domain}
                      className={`p-4 rounded-lg border ${
                        domain.available
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-lg">{domain.domain}</span>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            domain.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {domain.available ? 'Available' : 'Taken'}
                        </span>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(domain.domain)}
                          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                        >
                          {copiedDomain === domain.domain ? 'Copied!' : 'Copy'}
                        </button>
                        {domain.available && (
                          <button
                            onClick={() => handleBuyDomain(domain.domain)}
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                          >
                            Buy Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media Availability */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Social Media Availability</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {reportData.socialMedia.map((social) => (
                    <div
                      key={social.platform}
                      className={`p-3 rounded-lg border text-center ${
                        social.available
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="font-semibold">{social.platform}</div>
                      <div className="text-sm mt-1">
                        {social.available ? 'Available' : 'Taken'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <p className="text-gray-600">
                  Generated on {new Date(reportData.generatedAt).toLocaleString()}
                </p>
                <div className="mt-2">
                  <p>
                    <strong>Base name:</strong> {reportData.baseName}
                  </p>
                  <p>
                    <strong>Available domains:</strong>{' '}
                    {reportData.domains.filter(d => d.available).length} of{' '}
                    {reportData.domains.length}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}