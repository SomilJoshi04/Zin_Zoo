import { useState, useEffect } from "react"
import { toast } from "sonner"
import { adminAPI } from "@food/api"
import { Textarea } from "@food/components/ui/textarea"
import { legalHtmlToPlainText, plainTextToLegalHtml } from "@food/utils/legalContentFormat"
const SUPPORT_EMAIL_REGEX = /^(?!.*\.\.)([A-Za-z0-9]+[._%+-]?)*[A-Za-z0-9]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/

const hasSuspiciousEmailTld = (emailValue) => {
  const email = String(emailValue || "").trim().toLowerCase()
  const domain = email.split("@")[1] || ""
  const tld = domain.split(".").pop() || ""
  if (!tld) return true
  if (/^com+$/i.test(tld) && tld !== "com") return true
  if (/(.)\1{2,}/.test(tld)) return true
  return false
}

export default function SupportCMS() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState("edit") // "edit" | "preview"
  const [selectedModule, setSelectedModule] = useState("ALL")
  const [supportData, setSupportData] = useState({
    title: 'Help & Support',
    content: '',
    email: '',
    mobile: ''
  })

  useEffect(() => {
    fetchSupportData()
  }, [selectedModule])

  const fetchSupportData = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPageContent('support', { module: selectedModule })
      if (response?.data?.success && response?.data?.data) {
        // Convert HTML to plain text for textarea
        const content = response.data.data.content || ''
        const textContent = legalHtmlToPlainText(content)
        setSupportData({
          ...response.data.data,
          content: textContent
        })
      } else {
        setSupportData({
          title: 'Help & Support',
          content: '',
          email: '',
          mobile: ''
        })
      }
    } catch (error) {
      console.error('Error fetching support data:', error)
      if (error.response?.status === 404) {
        setSupportData({
          title: 'Help & Support',
          content: '',
          email: '',
          mobile: ''
        })
      } else {
        toast.error('Failed to load support data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validations
    if (!supportData.email) {
      toast.error("Support Email is required")
      return
    }
    if (!SUPPORT_EMAIL_REGEX.test(supportData.email)) {
      toast.error("Please enter a valid email address (e.g. support@example.com)")
      return
    }
    if (hasSuspiciousEmailTld(supportData.email)) {
      toast.error("The email address domain contains an invalid or suspicious top-level domain (TLD)")
      return
    }

    if (!supportData.mobile) {
      toast.error("Support Mobile is required")
      return
    }
    if (!INDIAN_MOBILE_REGEX.test(supportData.mobile)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6-9")
      return
    }

    try {
      setSaving(true)
      // Convert plain text/markdown to HTML for storage + user rendering
      const htmlContent = plainTextToLegalHtml(supportData.content)
      
      const response = await adminAPI.updatePageContent('support', { 
        title: supportData.title, 
        content: htmlContent,
        email: supportData.email,
        mobile: supportData.mobile,
        module: selectedModule
      })
      if (response?.data?.success) {
        toast.success('Help and support updated successfully')
        // Convert HTML to plain text for display in textarea
        const content = response.data.data.content || ''
        const textContent = legalHtmlToPlainText(content)
        setSupportData({
          ...response.data.data,
          content: textContent
        })
      }
    } catch (error) {
      console.error('Error saving support:', error)
      toast.error(error.response?.data?.message || 'Failed to save support content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 p-4 lg:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F84E04] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
            <p className="text-sm text-slate-600 mt-1">Configure customer assistance channels and user documentation resources</p>
          </div>
        </div>
        {/* Contact Info Inputs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="support-email" className="text-sm font-medium text-slate-700">Support Email</label>
              <input
                id="support-email"
                type="email"
                value={supportData.email || ""}
                onChange={(e) => setSupportData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="support@example.com"
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-[#F84E04] focus:border-[#F84E04] block w-full p-2.5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="support-mobile" className="text-sm font-medium text-slate-700">Support Mobile</label>
              <input
                id="support-mobile"
                type="text"
                value={supportData.mobile || ""}
                onChange={(e) =>
                  setSupportData((prev) => ({
                    ...prev,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                maxLength={10}
                placeholder="+91 00000 00000"
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-[#F84E04] focus:border-[#F84E04] block w-full p-2.5 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-sm text-slate-600">
              Customer Care & Support CMS
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className={`px-3 py-1.5 text-sm font-medium ${viewMode === "edit" ? "bg-[#F84E04] text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 text-sm font-medium ${viewMode === "preview" ? "bg-[#F84E04] text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                Preview
              </button>
            </div>
          </div>

          {viewMode === "edit" ? (
            <Textarea
              value={supportData.content}
              onChange={(e) => setSupportData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter help & support content here..."
              className="min-h-[600px] w-full text-sm text-slate-700 leading-relaxed resize-y"
              dir="ltr"
              style={{
                direction: 'ltr',
                textAlign: 'left',
                unicodeBidi: 'bidi-override',
                width: '100%',
                maxWidth: '100%'
              }}
            />
          ) : !supportData.content || !supportData.content.trim() ? (
            <div className="min-h-[600px] w-full rounded-md border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
              <p className="text-slate-500 font-medium text-base mb-1">No Policy Content Found</p>
              <p className="text-slate-400 text-sm">Please switch to "Edit" mode to add or paste your policies.</p>
            </div>
          ) : (
            <div className="min-h-[600px] w-full rounded-md border border-slate-200 bg-white p-4">
              <div
                className="prose prose-slate max-w-none
                  prose-headings:text-slate-900
                  prose-p:text-slate-700
                  prose-strong:text-slate-900
                  prose-ul:text-slate-700
                  prose-li:my-1
                  leading-relaxed"
                dangerouslySetInnerHTML={{ __html: plainTextToLegalHtml(supportData.content) }}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-[#F84E04] text-white rounded-lg hover:bg-[#D94203] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Support Content'}
          </button>
        </div>
      </div>
    </div>
  )
}
