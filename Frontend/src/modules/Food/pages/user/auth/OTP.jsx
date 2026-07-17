import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, AlertCircle, Smartphone, Shield, Lock } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Input } from "@food/components/ui/input"
import { Button } from "@food/components/ui/button"
import apiClient, { authAPI } from "@food/api"
import { setAuthData as setUserAuthData } from "@food/utils/auth"
import { motion, AnimatePresence } from "framer-motion"
import loginBanner from "@food/assets/loginbanner.png"

const FULL_NAME_REGEX = /^[A-Za-z ]+$/

export default function OTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(["", "", "", ""]) // exactly 4 digits
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [authData, setAuthData] = useState(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [verifiedData, setVerifiedData] = useState(null)
  const [contactInfo, setContactInfo] = useState("")
  const [contactType, setContactType] = useState("phone")
  const [deviceToken, setDeviceToken] = useState(null)
  const [activePlatform, setActivePlatform] = useState("web")
  const inputRefs = useRef([])
  const submittingRef = useRef(false)

  useEffect(() => {
    // Redirect to home if already authenticated
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true"
    if (isAuthenticated) {
      navigate("/food/user", { replace: true })
      return
    }

    // Get auth data from sessionStorage
    const stored = sessionStorage.getItem("userAuthData")
    if (!stored) {
      navigate("/food/user/auth/login", { replace: true })
      return
    }
    const data = JSON.parse(stored)
    setAuthData(data)

    if (data.method === "email" && data.email) {
      setContactType("email")
      setContactInfo(data.email)
    } else if (data.phone) {
      setContactType("phone")
      const phoneMatch = data.phone?.match(/(\+\d+)\s*(.+)/)
      if (phoneMatch) {
        setContactInfo(`${phoneMatch[1]}-${phoneMatch[2].replace(/\D/g, "")}`)
      } else {
        setContactInfo(data.phone || "")
      }
    }

    setResendTimer(60)
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  useEffect(() => {
    if (inputRefs.current[0] && !showNameInput) {
      inputRefs.current[0].focus()
    }
  }, [showNameInput])

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (!showNameInput && newOtp.slice(0, 4).every((digit) => digit !== "")) {
      handleVerify(newOtp.slice(0, 4).join(""))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ""
        setOtp(newOtp)
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const digits = pastedData.replace(/\D/g, "").slice(0, 4).split("")
    const newOtp = [...otp]
    digits.forEach((digit, i) => {
      if (i < 4) newOtp[i] = digit
    })
    setOtp(newOtp)
    if (!showNameInput && digits.length === 4) {
      handleVerify(newOtp.slice(0, 4).join(""))
    } else {
      inputRefs.current[Math.min(digits.length, 3)]?.focus()
    }
  }

  const handleVerify = async (otpValue = null) => {
    if (showNameInput) return
    if (submittingRef.current) return

    const code = (otpValue || otp.join("")).replace(/\D/g, "")
    const code4 = code.slice(0, 4)
    if (code4.length !== 4) {
      setError("OTP must be exactly 4 digits")
      return
    }

    submittingRef.current = true
    setIsLoading(true)
    setError("")

    try {
      const phone = authData?.method === "phone" ? authData.phone : null
      const email = authData?.method === "email" ? authData.email : null
      const purpose = authData?.isSignUp ? "register" : "login"
      const providedName = authData?.isSignUp ? authData?.name || null : null
      const referralCode = authData?.referralCode || null

      let fcmToken = null;
      let platform = "web";
      try {
        if (typeof window !== "undefined") {
          if (window.flutter_inappwebview) {
            platform = "mobile";
            const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"];
            for (const handlerName of handlerNames) {
              try {
                const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "user" });
                if (t && typeof t === "string" && t.length > 20) {
                  fcmToken = t.trim();
                  break;
                }
              } catch (e) {}
            }
          } else {
            fcmToken = localStorage.getItem("fcm_web_registered_token_user") || null;
          }
        }
      } catch (e) {
        console.warn("Failed to get FCM token during login", e);
      }

      setDeviceToken(fcmToken);
      setActivePlatform(platform);

      const response = await authAPI.verifyOTP(
        phone, code4, purpose, providedName, email, "user", null, referralCode, fcmToken, platform
      )
      const data = response?.data?.data || response?.data || {}
      const accessToken = data.accessToken
      const refreshToken = data.refreshToken ?? null
      const user = data.user

      if (!accessToken || !user || !refreshToken) {
        throw new Error("Invalid response from server")
      }

      const hasName = user.name && String(user.name).trim().length > 0 && String(user.name).toLowerCase() !== "null";
      const needsName = data.isNewUser === true || !hasName;

      if (needsName) {
        setVerifiedData(data)
        setShowNameInput(true)
        setIsLoading(false)
        submittingRef.current = false
        return
      }

      sessionStorage.removeItem("userAuthData")
      setUserAuthData("user", accessToken, user, refreshToken)
      window.dispatchEvent(new Event("userAuthChanged"))
      setSuccess(true)
      setTimeout(() => navigate("/food/user"), 600)
    } catch (err) {
      const status = err?.response?.status
      let message = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Verification failed."
      if (status === 401) message = "Invalid or expired code."
      setError(message)
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  const handleSubmitName = async () => {
    const normalizedName = String(name || "").replace(/\s+/g, " ").trim()
    if (!normalizedName || normalizedName.length < 2) {
      setNameError("Please enter a valid name")
      return
    }
    if (!FULL_NAME_REGEX.test(normalizedName)) {
      setNameError("Name can contain only letters and spaces")
      return
    }

    setIsLoading(true)
    setError("")
    setNameError("")

    try {
      const { accessToken, refreshToken, user } = verifiedData

      // Update name via profile API
      try {
        await apiClient.patch("/food/user/profile", 
          { name: normalizedName },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
      } catch (e) {
        console.error("Failed to update name on backend, but proceeding with login", e)
      }

      sessionStorage.removeItem("userAuthData")
      setUserAuthData("user", accessToken, { ...user, name: normalizedName }, refreshToken)
      window.dispatchEvent(new Event("userAuthChanged"))
      setSuccess(true)
      setTimeout(() => navigate("/food/user"), 600)
    } catch (err) {
      setError("Failed to complete registration. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || isLoading) return
    setIsLoading(true)
    setError("")
    try {
      const phone = authData?.method === "phone" ? authData.phone : null
      const email = authData?.method === "email" ? authData.email : null
      const purpose = authData?.isSignUp ? "register" : "login"
      await authAPI.sendOTP(phone, purpose, email)
      setResendTimer(60)
    } catch (err) {
      setError("Failed to resend OTP.")
    } finally {
      setIsLoading(false)
    }
    setOtp(["", "", "", ""])
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          {/* Top Actions Row: Back Button & Secure Login */}
          <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
            <button
              onClick={() => navigate("/food/user/auth/login")}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-colors"
              title="Back to Login"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide uppercase">
              <Lock className="h-3 w-3" />
              <span>Secure Login</span>
            </div>
          </div>

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

        {/* Content Form Section */}
        <section className="px-6 -mt-16 relative z-20 flex flex-col items-center flex-grow" data-purpose="login-form">
          <AnimatePresence mode="wait">
            {!showNameInput ? (
              <motion.div
                key="otp-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full flex flex-col items-center"
              >
                {/* Shield Verification Icon Circle */}
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Shield className="h-8 w-8 text-[#FF5E00]" />
                </div>
                
                <h1 className="text-xl font-bold text-gray-800 text-center">Verify OTP</h1>
                <p className="text-gray-500 text-center mt-1 text-sm max-w-[280px] leading-snug">
                  Sent to <span className="font-extrabold text-gray-800">{contactInfo}</span>
                </p>

                {/* OTP Inputs */}
                <div className="w-full mt-6 space-y-4">
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <div key={index} className="relative">
                        <input
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          disabled={isLoading}
                          className="w-14 h-16 text-center text-3xl font-black bg-zinc-50 border border-gray-200 focus:border-[#FF5E00] focus:ring-1 focus:ring-[#FF5E00]/20 rounded-2xl text-gray-800 transition-all outline-none shadow-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-xs font-bold text-[#FF5E00] bg-orange-50/50 py-3 px-4 rounded-xl border border-orange-100"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Expiry Timer Indicator */}
                  <div className="text-center mt-2">
                    <p className="text-xs font-bold text-gray-400">
                      OTP will expire in <span className="text-[#FF5E00] font-extrabold">{formatTimer(resendTimer)}</span>
                    </p>
                  </div>

                  {/* Primary Verify Button */}
                  <button 
                    onClick={() => handleVerify()}
                    disabled={isLoading || otp.some(digit => digit === "")}
                    className="w-full py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all bg-[#FF5E00] hover:bg-[#FF4D00] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-100 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <span className="text-white font-extrabold text-lg">Verify & Continue</span>
                    )}
                  </button>

                  {/* Resend & Edit actions */}
                  <div className="flex flex-col items-center mt-4 space-y-3.5">
                    {resendTimer === 0 ? (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading}
                        className="text-sm font-extrabold text-[#FF5E00] hover:underline"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <div className="h-5"></div>
                    )}
                    
                    <button
                      onClick={() => navigate("/food/user/auth/login")}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Change Mobile Number
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="name-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full flex flex-col items-center"
              >
                {/* Visual User Profile Icon Circle */}
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-8 h-8 text-[#FF5E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <h1 className="text-xl font-bold text-gray-800 text-center">One Last Step</h1>
                <p className="text-gray-500 text-center mt-1 text-sm max-w-[260px] leading-snug">
                  Tell us your name to complete your profile
                </p>

                <div className="w-full mt-6 space-y-4">
                  {/* Name Input Field Container */}
                  <div className="w-full flex items-center border border-gray-200 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white focus-within:border-[#FF5E00]/50 transition-colors">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^A-Za-z ]/g, "")
                        setName(sanitized)
                        if (nameError) setNameError("")
                      }}
                      disabled={isLoading}
                      placeholder="Enter your full name"
                      className="flex-grow border-none focus:ring-0 py-4 px-5 text-gray-800 placeholder-gray-400 font-bold text-lg outline-none"
                    />
                  </div>
                  
                  {nameError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-bold text-[#FF5E00] pl-2"
                    >
                      {nameError}
                    </motion.p>
                  )}

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-bold text-[#FF5E00] pl-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Complete Button */}
                  <button 
                    onClick={handleSubmitName}
                    disabled={isLoading || name.trim().length < 2}
                    className="w-full py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all bg-[#FF5E00] hover:bg-[#FF4D00] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-100 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Saving Profile...</span>
                      </div>
                    ) : (
                      <span className="text-white font-extrabold text-lg">Complete Setup</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
