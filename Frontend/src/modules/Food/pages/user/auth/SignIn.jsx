import { useState, useEffect, useRef } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { authAPI } from "@food/api"
import { motion } from "framer-motion"
import { getCachedSettings, getModuleLogoUrl, loadBusinessSettings } from "@food/utils/businessSettings"

const debugLog = (...args) => { }
const debugWarn = (...args) => { }
const debugError = (...args) => { }

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(() => getModuleLogoUrl("user") || null)
  const submittingRef = useRef(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("userAuthData")
    if (!stored) return

    try {
      const data = JSON.parse(stored)
      const fullPhone = String(data.phone || "").trim()
      const phoneDigits = fullPhone.replace(/^\+91\s*/, "").replace(/\D/g, "").slice(0, 10)

      setFormData((prev) => ({
        ...prev,
        phone: phoneDigits || prev.phone,
      }))
    } catch (err) {
      debugError("Error parsing stored auth data:", err)
    }
  }, [])

  useEffect(() => {
    const syncLogo = () => {
      const resolvedLogo = getModuleLogoUrl("user")
      if (resolvedLogo) setLogoUrl(resolvedLogo)
    }

    const loadLogo = async () => {
      try {
        if (!getCachedSettings()) {
          await loadBusinessSettings()
        }
        syncLogo()
      } catch (err) {
        debugError("Error loading user login logo:", err)
      }
    }

    loadLogo()
    window.addEventListener("businessSettingsUpdated", syncLogo)
    return () => window.removeEventListener("businessSettingsUpdated", syncLogo)
  }, [])

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Phone number is required"
    const cleanPhone = phone.replace(/\D/g, "")
    if (!/^\d{10}$/.test(cleanPhone)) return "Phone number must be exactly 10 digits"
    if (!/^[6-9]/.test(cleanPhone)) return "Invalid mobile number"
    return ""
  }

  const handleChange = (e) => {
    const { name } = e.target
    let { value } = e.target

    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10)
      setError(validatePhone(value))
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const phoneError = validatePhone(formData.phone)
    setError(phoneError)
    if (phoneError) return
    if (submittingRef.current) return
    submittingRef.current = true
    setIsLoading(true)
    setError("")

    try {
      const countryCode = formData.countryCode?.trim() || "+91"
      const phoneDigits = String(formData.phone ?? "").replace(/\D/g, "").slice(0, 10)
      if (phoneDigits.length !== 10) {
        setError("Phone number must be exactly 10 digits")
        setIsLoading(false)
        submittingRef.current = false
        return
      }
      const fullPhone = `${countryCode} ${phoneDigits}`
      await authAPI.sendOTP(fullPhone, "login", null)

      const ref = String(searchParams.get("ref") || "").trim()
      const authData = {
        method: "phone",
        phone: fullPhone,
        email: null,
        name: null,
        referralCode: ref || null,
        isSignUp: false,
        module: "user",
      }

      sessionStorage.setItem("userAuthData", JSON.stringify(authData))
      const redirect = searchParams.get("redirect")
      navigate(`/food/user/auth/otp${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`, { replace: true })
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.error ||
        "Failed to send OTP. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <AnimatedPage className="min-h-[100dvh] w-full bg-slate-50 flex items-center justify-center font-sans overflow-x-hidden p-0 sm:p-4 md:p-6 lg:p-8">
      {/* Mobile Frame Container (Responsive aspect on laptops, full viewport on mobile) */}
      <main className="w-full max-w-[450px] min-h-[100dvh] h-[100dvh] sm:min-h-[580px] sm:h-[630px] sm:max-h-[640px] bg-white flex flex-col justify-start relative sm:rounded-[32px] sm:shadow-2xl overflow-hidden border border-transparent sm:border-slate-100/60">

        {/* Fixed Non-Scrollable Container (Guarantees everything fits statically on mobile viewports) */}
        <div className="flex flex-col justify-start items-center flex-grow overflow-hidden relative z-10 w-full h-full bg-white">

          {/* Top Header Segment (Logo & Accent) */}
          <div className="w-full flex flex-col shrink-0 relative z-10">
            {/* Curved Orange Top-Left Corner Accent */}
            <div className="absolute top-0 left-0 w-36 h-36 pointer-events-none z-0">
              <svg viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M0 0H150C100 15 25 65 0 150V0Z" fill="#FF5E00" />
              </svg>
            </div>

            {/* Floating Food Line Art Background */}
            <div className="absolute inset-x-0 top-0 h-80 opacity-[0.06] pointer-events-none z-0 overflow-hidden select-none">
              {/* Burger */}
              <svg className="absolute top-10 left-16 w-14 h-14 text-[#FF5E00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 11c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v1H3v-1z" />
                <rect x="3" y="14" width="18" height="4" rx="2" />
                <path d="M3 12h18" strokeDasharray="2,2" />
              </svg>
              {/* Pizza */}
              <svg className="absolute top-8 right-6 w-16 h-16 text-[#FF5E00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 20C20 9.5 12.5 2 2 2v18h18z" />
                <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                <circle cx="13" cy="16" r="1.5" fill="currentColor" />
                <circle cx="8" cy="7" r="1.5" fill="currentColor" />
                <path d="M2 2l18 18" strokeDasharray="3,3" />
              </svg>
              {/* Shopping bag */}
              <svg className="absolute top-36 left-12 w-12 h-12 text-[#FF5E00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 8V6a6 6 0 0112 0v2" />
                <rect x="3" y="8" width="18" height="12" rx="2" />
              </svg>
              {/* Drink cup */}
              <svg className="absolute top-32 right-12 w-12 h-12 text-[#FF5E00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 8H7l1 10a2 2 0 002 2h4a2 2 0 002-2l1-10z" />
                <path d="M9 8V5l6-2v5" />
                <line x1="6" y1="8" x2="18" y2="8" />
              </svg>
            </div>

            {/* Main Logo Area with Animated Floating Food Icons */}
            <section className="relative z-10 flex flex-col items-center pt-5 pb-1" data-purpose="header-section">
              {/* Floating Animated Burger (Upper Left - Positioned Closer) */}
              <motion.div
                className="absolute left-[24%] top-3 text-[#FF5E00] opacity-85 z-10 pointer-events-none"
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 8, -8, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 11c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v1H3v-1z" fill="rgba(255, 94, 0, 0.1)" />
                  <rect x="3" y="14" width="18" height="3" rx="1.5" />
                  <path d="M3 12h18" strokeDasharray="1,1" />
                </svg>
              </motion.div>

              {/* Floating Animated Shopping Bag (Lower Left - Positioned Closer) */}
              <motion.div
                className="absolute left-[16%] top-12 text-[#FF5E00] opacity-80 z-10 pointer-events-none"
                animate={{
                  y: [0, 4, 0],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8V6a6 6 0 0112 0v2" />
                  <rect x="3" y="8" width="18" height="12" rx="2" fill="rgba(255, 94, 0, 0.1)" />
                </svg>
              </motion.div>

              {/* Floating Animated Pizza Slice (Upper Right - Positioned Closer) */}
              <motion.div
                className="absolute right-[24%] top-3 text-[#FF5E00] opacity-85 z-10 pointer-events-none"
                animate={{
                  y: [0, 5, 0],
                  rotate: [0, -8, 8, 0]
                }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2
                }}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 20C20 9.5 12.5 2 2 2v18h18z" fill="rgba(255, 94, 0, 0.1)" />
                  <circle cx="8" cy="12" r="1" fill="currentColor" />
                  <circle cx="13" cy="16" r="1" fill="currentColor" />
                  <path d="M2 2l18 18" strokeDasharray="2,2" />
                </svg>
              </motion.div>

              {/* Floating Animated Drink Cup (Lower Right - Positioned Closer) */}
              <motion.div
                className="absolute right-[16%] top-12 text-[#FF5E00] opacity-80 z-10 pointer-events-none"
                animate={{
                  y: [0, -4, 0],
                  scale: [1, 1.08, 1]
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.8
                }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 8H7l1 10a2 2 0 002 2h4a2 2 0 002-2l1-10z" fill="rgba(255, 94, 0, 0.1)" />
                  <line x1="6" y1="8" x2="18" y2="8" />
                  <path d="M12 8V4" />
                </svg>
              </motion.div>

              <div className="flex items-center space-x-1.5">
                <span className="text-3xl font-extrabold tracking-tighter text-black">ZÎN ZOO-</span>
                <span className="text-4xl font-black italic text-[#FF5E00]" style={{ transform: "skewX(-10deg)", display: "inline-block" }}>X</span>
              </div>
              <div className="flex items-center mt-1.5 w-full max-w-[190px]">
                <div className="h-[1.5px] flex-grow bg-[#FF5E00]/80"></div>
                <span className="px-2 text-[8px] font-black tracking-[0.2em] text-gray-700 whitespace-nowrap uppercase">FOOD. GROCERY & MORE</span>
                <div className="h-[1.5px] flex-grow bg-[#FF5E00]/80"></div>
              </div>
            </section>
          </div>

          {/* Spacer 1 (Between Logo and Form, dynamically grows on tall viewports) */}
          <div className="flex-grow min-h-[8px] max-h-[24px] w-full" data-purpose="spacer-1" />

          {/* Form Section */}
          <section className="px-6 relative z-10 flex flex-col items-center w-full shrink-0" data-purpose="login-form">
            {/* Speech Bubble Icon Circle */}
            <div className="w-12 h-12 bg-[#FFF2EA] rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-orange-100/50">
              <svg className="h-6 w-6 text-[#FF5E00]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>

            <h1 className="text-lg font-bold text-gray-800 text-center">Enter Your Mobile Number</h1>
            <p className="text-gray-500 text-center mt-1 text-xs max-w-[260px] leading-snug">
              We will send you a One Time Password to verify your number
            </p>

            <form onSubmit={handleSubmit} className="w-full mt-2.5 space-y-2.5">
              {/* Input Field Container */}
              <div className="w-full flex items-center border border-gray-200 rounded-2xl bg-white px-3.5 py-2.5 focus-within:border-[#FF5E00] focus-within:ring-1 focus-within:ring-[#FF5E00] transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                {/* Country Code (NO dropdown arrow) */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <svg className="w-4.5 h-4.5 text-[#FF5E00]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-extrabold text-gray-800 text-sm">+91</span>
                </div>

                {/* Divider Line */}
                <div className="h-5.5 w-[1.5px] bg-gray-200 mx-2.5"></div>

                {/* Phone Input */}
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="flex-grow min-w-0 border-none p-0 focus:ring-0 text-gray-800 placeholder-gray-400 font-semibold text-base outline-none tracking-wider bg-transparent"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#FF5E00] pl-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Send OTP Button */}
              <button
                type="submit"
                disabled={isLoading || formData.phone.length !== 10}
                className="w-full py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all bg-[#FF5E00] hover:bg-[#E05300] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-100 active:scale-[0.98] text-white font-bold text-base"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <svg className="h-4.5 w-4.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Spacer 2 (Between Form and Features, dynamically grows on tall viewports) */}
          <div className="flex-grow min-h-[16px] max-h-[48px] w-full" data-purpose="spacer-2" />

          {/* Bottom segment: Illustration + Features + Road Background + Footer (Stretches to fill remaining viewport) */}
          <div className="relative flex-grow w-full flex flex-col justify-start overflow-hidden" data-purpose="bottom-container">

            {/* Features + Illustration Block (Sits directly under OTP form, locked in height) */}
            <div className="relative z-10 w-full px-6 flex items-end justify-between shrink-0 h-[150px] sm:h-[200px]">
              {/* Rider Illustration (Fully visible, sits exactly on top of the road curve, expanded size & responsive) */}
              <div className="relative w-[55%] shrink-0 pr-1 z-10 translate-y-[2px]">
                <img
                  alt="Delivery Rider"
                  className="w-full h-auto object-contain max-h-[145px] sm:max-h-[195px]"
                  src="/rider.png"
                />
              </div>

              {/* Features List */}
              <div className="w-[45%] space-y-3 pb-2 pl-1.5 relative z-10 sm:space-y-4">
                {/* Fast Delivery */}
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFF2EA] flex items-center justify-center shrink-0 border border-orange-100/50">
                    <svg className="w-3.5 h-3.5 text-[#FF5E00]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-[12px] leading-tight">Fast Delivery</p>
                    <p className="text-[9px] text-gray-400 leading-none">On time every time</p>
                  </div>
                </div>

                {/* Safe & Secure */}
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFF2EA] flex items-center justify-center shrink-0 border border-orange-100/50">
                    <svg className="w-3.5 h-3.5 text-[#FF5E00]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-[12px] leading-tight">Safe & Secure</p>
                    <p className="text-[9px] text-gray-400 leading-none">Your safety our priority</p>
                  </div>
                </div>

                {/* Best Quality */}
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFF2EA] flex items-center justify-center shrink-0 border border-orange-100/50">
                    <svg className="w-3.5 h-3.5 text-[#FF5E00]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-[12px] leading-tight">Best Quality</p>
                    <p className="text-[9px] text-gray-400 leading-none">Top quality products</p>
                  </div>
                </div>

                {/* Top Support */}
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#FFF2EA] flex items-center justify-center shrink-0 border border-orange-100/50">
                    <svg className="w-3.5 h-3.5 text-[#FF5E00]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-[12px] leading-tight">Top Support</p>
                    <p className="text-[9px] text-gray-400 leading-none">We're here to help you</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Curved Road SVG Background (Aligned relative to rider wheels) */}
            <div className="absolute left-0 right-0 w-full h-[230px] translate-y-[45px] sm:translate-y-[95px] pointer-events-none z-0 overflow-hidden">
              <svg viewBox="0 0 500 230" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,105 C150,55 350,105 500,85 L500,230 L0,230 Z" fill="#FF5E00" />
                <path d="M0,135 Q250,95 500,115" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="12,10" opacity="0.35" fill="none" />
              </svg>
            </div>

            {/* Solid Orange Background (Fills rest of screen height) */}
            <div className="absolute inset-x-0 bottom-0 bg-[#FF5E00] z-0 pointer-events-none top-[150px] sm:top-[200px]" />

            {/* Trust and Footer Section (Anchored at the bottom) */}
            <div className="relative w-full flex flex-col justify-start pb-4 pt-4 bg-transparent gap-3 z-10">
              {/* Trust Section */}
              <div className="flex items-center justify-center space-x-2 text-white mt-1">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-extrabold tracking-wide">Your Trust, Our Priority</span>
              </div>

              {/* Footer Section */}
              <footer className="flex flex-col items-center justify-center gap-2" data-purpose="site-footer">
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[10px] font-bold text-white/90 px-4">
                  <Link to="/food/user/profile/terms" className="hover:text-white transition-colors underline-offset-2 hover:underline">Terms & Conditions</Link>
                  <Link to="/food/user/profile/privacy" className="hover:text-white transition-colors underline-offset-2 hover:underline">Privacy Policy</Link>
                  <Link to="/food/user/profile/help-content" className="hover:text-white transition-colors underline-offset-2 hover:underline">Support</Link>
                </div>
              </footer>
            </div>
          </div>

        </div>
      </main>
    </AnimatedPage>
  )
}
