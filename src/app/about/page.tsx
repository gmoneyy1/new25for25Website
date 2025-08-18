import React from 'react';

const AboutPage = () => (
  <section className="py-12">
    <div className="text-center mb-8">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">JetBlue&apos;s 25th Anniversary Challenge</h2>
      <p className="text-gray-600 text-lg max-w-2xl mx-auto">
        Celebrate JetBlue&apos;s 25th anniversary by visiting unique destinations. The more you explore, the more you earn.
      </p>
    </div>
    <div className="flex flex-col md:flex-row justify-center gap-6 mb-10">
      <div className="flex-1 bg-white rounded-2xl shadow p-6 text-center">
        <div className="flex justify-center mb-2">
          <span className="inline-block bg-blue-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z" /></svg>
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-1">15 Destinations</h3>
        <p className="text-gray-600">Earn 150,000 bonus points</p>
      </div>
      <div className="flex-1 bg-white rounded-2xl shadow p-6 text-center">
        <div className="flex justify-center mb-2">
          <span className="inline-block bg-blue-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z" /></svg>
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-1">20 Destinations</h3>
        <p className="text-gray-600">Earn additional 200,000 points (350,000 total)</p>
      </div>
      <div className="flex-1 bg-blue-600 rounded-2xl shadow p-6 text-center text-white">
        <div className="flex justify-center mb-2">
          <span className="inline-block bg-blue-500 p-3 rounded-full">
            <svg className="w-8 h-8 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z" /></svg>
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-1">25 Destinations</h3>
        <p>Unlock all points + 25 years Mosaic 1 status</p>
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow p-8 max-w-4xl mx-auto">
      <h4 className="text-xl font-bold mb-4 text-center">Important Rules to Remember</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <span className="mt-1 text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </span>
          <div>
            <span className="font-semibold">JetBlue-Operated Only</span>
            <div className="text-gray-600 text-sm">Codeshare flights and Blue Basic fares don&apos;t qualify</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-1 text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </span>
          <div>
            <span className="font-semibold">Airport-Based Counting</span>
            <div className="text-gray-600 text-sm">JFK, LGA, EWR each count as separate destinations</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-1 text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </span>
          <div>
            <span className="font-semibold">Layovers Count</span>
            <div className="text-gray-600 text-sm">Even brief connections count toward your total</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-1 text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </span>
          <div>
            <span className="font-semibold">Pre-booked Eligible</span>
            <div className="text-gray-600 text-sm">Flights booked before June 25 still qualify</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutPage; 