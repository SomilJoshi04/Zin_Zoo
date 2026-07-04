import { useState, useEffect } from "react"
import { toast } from "sonner"
import { adminAPI } from "@food/api"
import { Textarea } from "@food/components/ui/textarea"
import { legalHtmlToPlainText, plainTextToLegalHtml } from "@food/utils/legalContentFormat"
const debugLog = (...args) => { }
const debugWarn = (...args) => { }
const debugError = (...args) => { }


export default function TermsAndCondition() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState("edit") // "edit" | "preview"
  const [selectedModule, setSelectedModule] = useState("ALL")
  const [termsData, setTermsData] = useState({
    title: 'Terms and Conditions',
    content: ''
  })

  useEffect(() => {
    fetchTermsData()
  }, [selectedModule])

  const fetchTermsData = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPageContent('terms', { module: selectedModule })
      if (response?.data?.success && response?.data?.data) {
        // Convert HTML to plain text for textarea
        const content = response.data.data.content || ''
        const textContent = legalHtmlToPlainText(content)
        setTermsData({
          ...response.data.data,
          content: textContent
        })
      } else {
        setTermsData({
          title: 'Terms and Conditions',
          content: ''
        })
      }
    } catch (error) {
      debugError('Error fetching terms data:', error)
      if (error.response?.status === 404) {
        setTermsData({
          title: 'Terms and Conditions',
          content: ''
        })
      } else {
        toast.error('Failed to load terms and conditions')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Convert plain text/markdown to HTML for storage + user rendering
      const htmlContent = plainTextToLegalHtml(termsData.content)

      const response = await adminAPI.updatePageContent('terms', {
        title: termsData.title,
        content: htmlContent,
        module: selectedModule
      })
      if (response?.data?.success) {
        toast.success('Terms and conditions updated successfully')
        // Convert HTML to plain text for display in textarea
        const content = response.data.data.content || ''
        const textContent = legalHtmlToPlainText(content)
        setTermsData({
          ...response.data.data,
          content: textContent
        })
      }
    } catch (error) {
      debugError('Error saving terms:', error)
      toast.error(error.response?.data?.message || 'Failed to save terms and conditions')
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
            <h1 className="text-2xl font-bold text-slate-900">Terms & Conditions</h1>
            <p className="text-sm text-slate-600 mt-1">Establish legal agreements, rules, and guidelines for your users</p>
          </div>
        </div>

        {/* Text Area */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-sm text-slate-600">
              Write the terms of service agreement for the platform
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
              value={termsData.content}
              onChange={(e) => setTermsData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter terms and conditions content here..."
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
          ) : !termsData.content || !termsData.content.trim() ? (
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
                dangerouslySetInnerHTML={{ __html: plainTextToLegalHtml(termsData.content) }}
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
            {saving ? 'Saving...' : 'Save Terms & Conditions'}
          </button>
        </div>
      </div>
    </div>
  )
}
