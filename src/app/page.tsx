'use client';

import { useState } from 'react';

export default function Home() {
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!keywords) return;
    
    setIsLoading(true);
    
    try {
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
      setGeneratedNames(data.names);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate names. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PrimeNym</h1>
          <p className="text-xl text-gray-600">AI-Powered Business Name Generator</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your business or enter keywords
            </label>
            <input
              type="text"
              id="keywords"
              placeholder="e.g., eco-friendly technology, health app, luxury fashion"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : 'Generate Names'}
          </button>
        </div>

        {generatedNames.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Generated Names</h2>
            <div className="space-y-4">
              {generatedNames.map((name, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <span className="text-lg font-medium text-gray-900">{name}</span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    Check Availability
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => setGeneratedNames([])}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Generate Again
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}