import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, GraduationCap, Shield, ArrowRight, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, adminSignIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isAdmin) {
      const { error } = await adminSignIn(email, password)
      if (error) {
        setError(error)
        setLoading(false)
        return
      }
      navigate('/dashboard')
      return
    }

    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setLoading(false)
      return
    }
    navigate('/dashboard')
  }

  async function handleGoogleSignIn() {
    const { error } = await signInWithGoogle()
    if (error) setError(error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4"
            >
              <GraduationCap className="w-8 h-8 text-primary-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-neutral-900">Welcome Back</h1>
            <p className="text-neutral-500 mt-1">Sign in to ARMS</p>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-neutral-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsAdmin(false); setError('') }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                !isAdmin ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4" />
                User
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setIsAdmin(true); setError('') }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isAdmin ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </span>
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-error-50 text-error-600 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {!isAdmin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-500">Or continue with</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
              >
                <Globe className="w-5 h-5" />
                Google
              </motion.button>
            </>
          )}

          {!isAdmin && (
            <p className="text-center text-sm text-neutral-500 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
