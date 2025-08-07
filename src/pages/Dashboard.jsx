import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👋 Welcome back to TaskPulse!</h1>
        <p className="text-gray-600">Here’s a quick glance at your tasks.</p>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-700">📋 Total Tasks</h2>
          <p className="text-3xl font-bold text-indigo-600 mt-2">24</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-700">✅ Completed</h2>
          <p className="text-3xl font-bold text-green-500 mt-2">12</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-700">🕓 Pending</h2>
          <p className="text-3xl font-bold text-yellow-500 mt-2">12</p>
        </div>
      </section>

      {/* Activity Feed */}
      <section className="bg-white shadow-md rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">📌 Recent Activity</h2>
        <ul className="space-y-2">
          <li className="text-gray-600">✅ You completed “Fix auth bug”</li>
          <li className="text-gray-600">📌 Added task “Set up RBAC system”</li>
          <li className="text-gray-600">🚀 Created project “Frontend UI Revamp”</li>
        </ul>
      </section>
    </div>
  );
}
