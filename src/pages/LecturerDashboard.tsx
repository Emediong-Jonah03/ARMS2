import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Bell, MessageSquare, LogOut, User, GraduationCap,
  Send, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Course {
  id: string
  code: string
  title: string
}

interface Post {
  id: string
  title: string
  content: string
  target_role: string
  created_at: string
}

interface LecturerMessage {
  id: string
  title: string
  content: string
  course_title: string
  created_at: string
}

export default function LecturerDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [messages, setMessages] = useState<LecturerMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'send'>('overview')
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [messageTitle, setMessageTitle] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [coursesRes, postsRes, messagesRes] = await Promise.all([
      supabase.from('courses').select('id, code, title').order('code'),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('lecturer_messages').select('*, courses(title)').eq('lecturer_id', user?.id).order('created_at', { ascending: false })
    ])

    if (coursesRes.data) setCourses(coursesRes.data)
    if (postsRes.data) setPosts(postsRes.data)
    if (messagesRes.data) {
      setMessages(messagesRes.data.map((m: any) => ({
        ...m,
        course_title: m.courses?.title || 'Unknown Course'
      })))
    }
    setLoading(false)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourse || !messageTitle.trim() || !messageContent.trim()) return

    setSending(true)
    const { error } = await supabase.from('lecturer_messages').insert({
      course_id: selectedCourse,
      lecturer_id: user?.id,
      title: messageTitle,
      content: messageContent
    })

    if (!error) {
      setShowSendModal(false)
      setSelectedCourse('')
      setMessageTitle('')
      setMessageContent('')
      await fetchData()
    }
    setSending(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900">ARMS</h1>
                <p className="text-xs text-neutral-500">Lecturer Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-neutral-500 hover:text-neutral-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-neutral-700 hidden sm:block">{user?.full_name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-neutral-500 hover:text-error-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2 p-1 bg-white rounded-xl border border-neutral-200 w-fit">
          {(['overview', 'messages', 'send'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'send') setShowSendModal(true)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'send' ? (
                <span className="flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Send Message
                </span>
              ) : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white"
            >
              <h2 className="text-xl font-bold">Welcome back, {user?.full_name}!</h2>
              <p className="text-primary-100 mt-1">Manage your courses and communicate with students.</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-5 border border-neutral-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{courses.length}</p>
                    <p className="text-sm text-neutral-500">Courses</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-5 border border-neutral-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{posts.length}</p>
                    <p className="text-sm text-neutral-500">Announcements</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-5 border border-neutral-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{messages.length}</p>
                    <p className="text-sm text-neutral-500">Sent Messages</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">Recent Announcements</h3>
              </div>
              <div className="divide-y divide-neutral-100">
                {posts.slice(0, 3).map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-6 py-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900">{post.title}</h4>
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{post.content}</p>
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap ml-4">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {posts.length === 0 && (
                  <p className="px-6 py-8 text-center text-neutral-400">No announcements yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-neutral-200 p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-neutral-900">{msg.title}</h4>
                    <span className="text-xs text-primary-600 font-medium">{msg.course_title}</span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-600">{msg.content}</p>
              </motion.div>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-12 text-neutral-400">No messages sent yet</div>
            )}
          </div>
        )}
      </main>

      {/* Send Message Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary-600" />
                  Send Course Message
                </h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Select Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Message title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Content</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Write your message..."
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 py-2.5 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={sending}
                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
