import { useState, useEffect, useRef } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
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
    countryCode: "+91", // required; default +91 for India
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
      navigate("/food/user/auth/otp")
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
    <AnimatedPage className="min-h-[100dvh] bg-gray-100 flex items-center justify-center font-sans overflow-x-hidden">
      {/* Mobile Frame Container */}
      <main className="w-full max-w-[450px] min-h-[100dvh] bg-white flex flex-col justify-between relative shadow-2xl overflow-x-hidden">
        
        {/* Curved Orange Header Background */}
        <section className="relative h-64 overflow-hidden" data-purpose="header-section">
          <div 
            className="absolute top-0 left-0 right-0 h-[120px] z-0"
            style={{
              background: "linear-gradient(135deg, #FF5E00 0%, #FF8A00 100%)",
              borderBottomLeftRadius: "100% 40px"
            }}
          />
          {/* Food Emojis Pattern */}
          <div className="absolute inset-0 flex justify-around items-start pt-8 opacity-20 pointer-events-none z-10">
            <span className="text-3xl">🍔</span>
            <span className="text-3xl translate-y-8">🍎</span>
            <span className="text-3xl translate-x-12">🥤</span>
            <span className="text-3xl -translate-y-4">🍕</span>
          </div>

          {/* Main Logo Area */}
          <div className="relative z-10 flex flex-col items-center pt-16">
            <div className="flex items-center space-x-1">
              <span className="text-4xl font-extrabold tracking-tighter text-black">ZÎN ZOO-</span>
              <span className="text-5xl font-black italic text-[#FF5E00]" style={{ transform: "skewX(-10deg)" }}>X</span>
            </div>
            <div className="flex items-center mt-2 w-full max-w-[200px]">
              <div className="h-[2px] flex-grow bg-[#FF5E00]"></div>
              <span className="px-2 text-[10px] font-bold tracking-[0.2em] text-black whitespace-nowrap">FOOD. GROCERY & MORE</span>
              <div className="h-[2px] flex-grow bg-[#FF5E00]"></div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="px-6 -mt-16 relative z-20 flex flex-col items-center flex-grow" data-purpose="login-form">
          {/* Icon Circle */}
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-[#FF5E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
          
          <h1 className="text-xl font-bold text-gray-800 text-center">Enter Your Mobile Number</h1>
          <p className="text-gray-500 text-center mt-1 text-sm max-w-[260px] leading-snug">
            We will send you a One Time Password to verify your number
          </p>

          <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
            {/* Input Field Container */}
            <div className="w-full flex items-center border border-gray-200 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white focus-within:border-[#FF5E00]/50 transition-colors">
              {/* Country Selector */}
              <div className="flex items-center px-4 py-4 space-x-2 border-r border-gray-100">
                <svg className="w-5 h-5 text-[#FF5E00]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 004.87 4.87l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                </svg>
                <span className="font-extrabold text-gray-800">+91</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              
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
                className="flex-grow border-none focus:ring-0 py-4 px-4 text-gray-800 placeholder-gray-400 font-bold text-lg outline-none tracking-wider"
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
              className="w-full py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all bg-[#FF5E00] hover:bg-[#FF4D00] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-100 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <span className="text-white font-extrabold text-lg">Send OTP</span>
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Illustration and Features Section */}
        <section className="relative mt-4" data-purpose="feature-section">
          {/* Background Curve for Features Area */}
          <div className="absolute bottom-0 left-0 right-0 h-[380px] bg-white z-0">
            {/* Cityscape Silhouette */}
            <div className="absolute bottom-0 w-full h-32 opacity-[0.04] pointer-events-none flex items-end justify-between px-4">
              <div className="h-16 w-10 bg-gray-600 rounded-t-lg"></div>
              <div className="h-28 w-14 bg-gray-600 rounded-t-lg"></div>
              <div className="h-20 w-12 bg-gray-600 rounded-t-lg"></div>
              <div className="h-24 w-10 bg-gray-600 rounded-t-lg"></div>
            </div>
          </div>

          <div className="relative z-10 px-6 pt-4 flex pb-2 items-end">
            {/* Rider Illustration */}
            <div className="w-[45%] pr-2 translate-y-6">
              <img 
                alt="Delivery Rider" 
                className="w-full h-auto object-contain max-h-[160px]" 
                data-purpose="rider-illustration" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJKGTVcnQ792lwZbHSIVyZ8Zje2CusGOz4UuAU6JPdFnz8e7mHkvUHjCsqBed_guEZdTiLOAjIRSpDWwQr3cXA4VirZDyAzj738LrUgPEQOozNglK7RHNV32a2cOk9NrkKIyRYiH8lpoxqg9o7UkpFNRGj91WVZw5ZD82ZxmhPKqTMuYHi2FQ-PHCincP_aliMkk1f3zm0htFCegl3ZZC3uR7nV4UrI-FmjqhoLVDWaz9RHGn8nk23oriwI_z4DeFnad0aj596flE"
              />
            </div>

            {/* Features List */}
            <div className="w-[55%] space-y-3.5 pb-2">
              {/* Item 1 */}
              <div className="flex items-start space-x-2.5">
                <div className="bg-orange-50 p-1.5 rounded-lg shrink-0">
                  <svg className="w-4 h-4 text-[#FF5E00]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h-3v7h3.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V9.414a1 1 0 00-.293-.707l-2.414-2.414A1 1 0 0015.586 6H14z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 text-xs leading-none">Fast Delivery</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">On time every time</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start space-x-2.5">
                <div className="bg-orange-50 p-1.5 rounded-lg shrink-0">
                  <svg className="w-4 h-4 text-[#FF5E00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" clipRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.56 9.29-6.433 11.79l-.214.138a1 1 0 01-1.07 0l-.214-.138C6.22 16.29 3.66 11.946 3.66 7c0-.68.056-1.35.166-2.001z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 text-xs leading-none">Safe & Secure</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Your safety our priority</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start space-x-2.5">
                <div className="bg-orange-50 p-1.5 rounded-lg shrink-0">
                  <svg className="w-4 h-4 text-[#FF5E00]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 text-xs leading-none">Best Quality</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Top quality products</p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start space-x-2.5">
                <div className="bg-orange-50 p-1.5 rounded-lg shrink-0">
                  <svg className="w-4 h-4 text-[#FF5E00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.192-1.229V7a2 2 0 00-2-2H9V3h1v2h1a3 3 0 013 3v2h2zm-4-3v2H8V7a1 1 0 011-1h2a1 1 0 011 1zM7 8H5v2h2V8zm0 4H5v2h2v-2zm9 1.414l1.414-1.414L18.828 15l-1.414 1.414-1.414-1.414z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 text-xs leading-none">Top Support</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">We're here to help you</p>
                </div>
              </div>
            </div>
          </div>

          {/* Road/Path Decoration */}
          <div className="absolute bottom-0 w-full h-24 overflow-hidden pointer-events-none z-0">
            <div className="w-[150%] h-[160px] bg-[#FF5E00] rounded-[100%] absolute top-8 left-1/2 -translate-x-1/2 flex items-center justify-center">
              {/* Road markings */}
              <div className="w-full flex justify-center space-x-8 mt-6 opacity-30">
                <div className="w-10 h-1.5 bg-white rounded-full"></div>
                <div className="w-10 h-1.5 bg-white rounded-full"></div>
                <div className="w-10 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-30 flex items-center justify-center py-4 bg-[#FF5E00]" data-purpose="site-footer">
          <div className="flex items-center space-x-2 text-white">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="text-sm font-extrabold tracking-wide">Your Trust, Our Priority</span>
          </div>
        </footer>
      </main>
    </AnimatedPage>
  )
}
