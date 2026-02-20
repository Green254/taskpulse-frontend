// src/pages/HomePage.jsx
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen font-sans text-gray-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-extrabold text-green-800">TaskPulse</Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-green-800">Home</Link>
            <Link to="/login" className="text-gray-700 hover:text-green-800">Login</Link>
            <Link to="/register" className="text-gray-700 hover:text-green-800">Register</Link>
          </nav>
          <div className="md:hidden">{/* mobile menu placeholder */}</div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-r from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Manage tasks. Empower teams. <span className="text-green-800">Move faster.</span>
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl">
              TaskPulse helps teams stay aligned — assign work, track progress, and get real-time updates with a clean, fast interface built for productivity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center bg-green-800 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-900 transition"
              >
                Get Started
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center border border-green-800 text-green-800 px-6 py-3 rounded-lg hover:bg-green-50 transition"
              >
                Login
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="user" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="user" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <img src="https://randomuser.me/api/portraits/men/68.jpg" alt="user" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
              </div>
              <p className="text-sm text-gray-600">Trusted by teams and startups worldwide</p>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full max-w-md transform hover:scale-102 transition-shadow duration-300">
              <img
                src="https://images.pexels.com/photos/7698712/pexels-photo-7698712.jpeg"
                alt="Office setup"
                className="rounded-2xl shadow-2xl object-cover w-full h-64 md:h-80"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">What makes TaskPulse different</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-12 h-12 bg-green-50 rounded-md flex items-center justify-center mb-4">
                {/* icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Real-time Collaboration</h3>
              <p className="text-sm text-gray-600">Work together with instant updates and live task statuses.</p>
            </motion.div>

            <motion.div
              className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-12 h-12 bg-green-50 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Role-Based Access</h3>
              <p className="text-sm text-gray-600">Manage permissions and secure your workflows with ease.</p>
            </motion.div>

            <motion.div
              className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="w-12 h-12 bg-green-50 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Clean & Intuitive UI</h3>
              <p className="text-sm text-gray-600">Built for speed and clarity — no bloat, only focus.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">Loved by teams</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Jane Doe',
                role: 'Project Manager',
                img: 'https://randomuser.me/api/portraits/women/44.jpg',
                text: 'TaskPulse has totally changed how we manage team tasks — clean and efficient!',
              },
              {
                name: 'Alex Kim',
                role: 'Team Lead',
                img: 'https://randomuser.me/api/portraits/men/32.jpg',
                text: 'The RBAC control is 🔥. Smooth login and beautiful interface!',
              },
              {
                name: 'Liam Smith',
                role: 'Developer',
                img: 'https://randomuser.me/api/portraits/men/68.jpg',
                text: 'It’s like Trello and Asana had a smarter baby.',
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4">
                  <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">“{t.text}”</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA + SUBSCRIBE */}
      <section className="py-16 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <p className="mb-6 text-gray-100 max-w-2xl mx-auto">Sign up and take control of your team’s workflow today.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="bg-white text-green-800 px-6 py-3 rounded-lg font-semibold">Create Account</Link>
            <Link to="/login" className="border border-white/30 px-6 py-3 rounded-lg">Login</Link>
          </div>

          <form className="mt-8 flex max-w-md mx-auto bg-white/10 rounded-lg p-1">
            <input
              type="email"
              placeholder="Your work email"
              className="flex-1 bg-transparent px-4 py-2 placeholder-gray-200 outline-none text-white"
            />
            <button className="bg-white text-green-800 px-4 py-2 rounded-r-lg">Subscribe</button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-6 text-center text-sm text-gray-600 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TaskPulse — Built with ❤️ by Martin Kibocha</p>
          <div className="flex items-center gap-4 text-gray-500">
            <a href="#" className="hover:text-green-700">Privacy</a>
            <a href="#" className="hover:text-green-700">Terms</a>
            <a href="#" className="hover:text-green-700">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
