import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Bell, Users, LogOut, Shield, GraduationCap,
  Plus, X, ChevronRight, Trash2, Megaphone
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Course {
  id: string
  code: string
  title: string
  department: string
  credits: number
  created_at: string
}

interface Post {
  id: string
  title: string
  content: string
  target_role: string
  created_at: string
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'posts'>('overview')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDept, setCourseDept] = useState('')
  const [courseCredits, setCourseCredits] = useState(3)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postTarget, setPostTarget] = useState('all')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [coursesRes, postsRes] = await Promise.all([
      supabase.from('courses').select('*').order('code'),
      supabase.from('posts').select('*').order('created_at', { ascending: false })
    ])

    if (coursesRes.data) setCourses(coursesRes.data)
    if (postsRes.data) setPosts(postsRes.data)
    setLoading(false)
  }

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('courses').insert({
      code: courseCode,
      title: courseTitle,
      department: courseDept,
      credits: courseCredits
    })

    if (!error) {
      setShowCourseModal(false)
      setCourseCode('')
      setCourseTitle('')
      setCourseDept('')
      setCourseCredits(3)
      await fetchData()
    }
    setSaving(false)
  }

  async function handleAddPost(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('posts').insert({
      title: postTitle,
      content: postContent,
      target_role: postTarget,
      author_id: user?.id
    })

    if (!error) {
      setShowPostModal(false)
      setPostTitle('')
      setPostContent('')
      setPostTarget('all')
      await fetchData()
    }
    setSaving(false)
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm('Are you sure you want to delete this course?')) return
    await supabase.from('courses').delete().eq('id', id)
    await fetchData()
  }

  async function handleDeletePost(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return
    await supabase.from('posts').delete().eq('id', id)
    await fetchData()
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
                <p className="text-xs text-neutral-500">Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-600" />
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
          {(['overview', 'courses', 'posts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab}
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
              <h2 className="text-xl font-bold">Welcome, Administrator!</h2>
              <p className="text-primary-100 mt-1">Manage courses, posts, and system settings.</p>
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
                    <p className="text-sm text-neutral-500">Total Courses</p>
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
                    <Users className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">Admin</p>
                    <p className="text-sm text-neutral-500">Access Level</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => { setActiveTab('courses'); setShowCourseModal(true) }}
                className="bg-white rounded-xl border border-neutral-200 p-5 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">Add Course</h4>
                      <p className="text-sm text-neutral-500">Create a new course</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => { setActiveTab('posts'); setShowPostModal(true) }}
                className="bg-white rounded-xl border border-neutral-200 p-5 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-warning-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">Post Announcement</h4>
                      <p className="text-sm text-neutral-500">Share information</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">All Courses</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCourseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </motion.button>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Credits</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900">{course.code}</td>
                        <td className="px-6 py-4 text-sm text-neutral-700">{course.title}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">{course.department}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">{course.credits}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1.5 text-neutral-400 hover:text-error-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                          No courses yet. Add your first course!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">All Announcements</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPostModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Post
              </motion.button>
            </div>
            <div className="space-y-3">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-neutral-200 p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-neutral-900">{post.title}</h4>
                      <span className="text-xs text-primary-600 font-medium capitalize">{post.target_role === 'all' ? 'All Users' : `${post.target_role}s`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-neutral-400 hover:text-error-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600">{post.content}</p>
                </motion.div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-12 text-neutral-400">No announcements yet</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Course Modal */}
      <AnimatePresence>
        {showCourseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCourseModal(false)}
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
                  <Plus className="w-5 h-5 text-primary-600" />
                  Add New Course
                </h3>
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              <form onSubmit={handleAddCourse} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Course Title</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Introduction to Computer Science"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={courseDept}
                    onChange={(e) => setCourseDept(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Credits</label>
                  <input
                    type="number"
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min={1}
                    max={6}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="flex-1 py-2.5 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Add Course'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Post Modal */}
      <AnimatePresence>
        {showPostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPostModal(false)}
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
                  <Megaphone className="w-5 h-5 text-primary-600" />
                  New Announcement
                </h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              <form onSubmit={handleAddPost} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Announcement title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Target Audience</label>
                  <select
                    value={postTarget}
                    onChange={(e) => setPostTarget(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Users</option>
                    <option value="student">Students Only</option>
                    <option value="lecturer">Lecturers Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Content</label>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Write your announcement..."
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="flex-1 py-2.5 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Post Announcement'
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
