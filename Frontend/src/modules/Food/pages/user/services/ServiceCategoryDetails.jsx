import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Clock, ShieldCheck, IndianRupee, Briefcase, ArrowLeft } from "lucide-react"
import { Button } from "@food/components/ui/button"
import ServiceBookingForm from "./ServiceBookingForm"
import { servicesPublicAPI } from "@food/api"
import { useSearchParams } from "react-router-dom"
import { usePublicSocket } from "@food/hooks/usePublicSocket"

export default function ServiceCategoryDetails() {
  const { serviceSlug } = useParams()
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('categoryId')
  const navigate = useNavigate()

  const [category, setCategory] = useState(null)
  const [allServices, setAllServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [activeSubCategory, setActiveSubCategory] = useState(null) // null = show sub-category list

  const handleOpenBooking = (svc) => {
    setSelectedService(svc)
    setIsBookingOpen(true)
  }

  const handleCloseBooking = () => {
    setIsBookingOpen(false)
    setSelectedService(null)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('serviceName')
    navigate({ search: newParams.toString() }, { replace: true })
  }

  useEffect(() => {
    const serviceNameToOpen = searchParams.get('serviceName')
    if (serviceNameToOpen && allServices.length > 0 && !selectedService) {
      const matched = allServices.find(
        svc => svc.name.toLowerCase().trim() === serviceNameToOpen.toLowerCase().trim()
      )
      if (matched) {
        handleOpenBooking(matched)
      }
    }
  }, [searchParams, allServices, selectedService])

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true)
      const zoneId = localStorage.getItem("userZoneId")

      // Fetch category info (with sub-categories)
      let foundCategory = null
      const catRes = await servicesPublicAPI.getCategories({ zoneId })
      if (catRes.data?.success) {
        const categories = catRes.data.data.categories || []
        foundCategory = categories.find(c => c._id === categoryId) || null
      }

      // Fallback name from slug
      if (!foundCategory) {
        foundCategory = {
          name: serviceSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          subCategories: [],
          image: ''
        }
      }

      // Fetch all services for this category
      let servicesList = []
      if (foundCategory.name) {
        const svcRes = await servicesPublicAPI.getServices({ category: foundCategory.name, zoneId })
        if (svcRes.data?.success) {
          servicesList = svcRes.data.data.services || []
        }
      }

      setCategory(foundCategory)
      setAllServices(servicesList)
    } catch (error) {
      console.error("Error fetching service details:", error)
    } finally {
      setLoading(false)
    }
  }, [serviceSlug, categoryId])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  // Real-time updates from admin
  const socketListeners = useMemo(() => ({
    'services:item:update': () => {
      console.log('[ServiceDetails] Service updated via socket, refetching...');
      fetchDetails();
    },
    'services:category:update': () => {
      console.log('[ServiceDetails] Category updated via socket, refetching...');
      fetchDetails();
    },
  }), [fetchDetails]);
  usePublicSocket(socketListeners);

  // Group services by sub-category
  const subCategories = useMemo(() => {
    if (!category) return []
    const subs = (category.subCategories || []).map(sub => {
      const subName = typeof sub === 'string' ? sub : sub.name
      const subImage = typeof sub === 'string' ? '' : (sub.image || '')
      const services = allServices.filter(s => s.subCategory === subName)
      return { name: subName, image: subImage, services }
    })
    return subs
  }, [category, allServices])

  // Services that don't belong to any sub-category
  const uncategorizedServices = useMemo(() => {
    if (!category) return []
    const subNames = (category.subCategories || []).map(s => typeof s === 'string' ? s : s.name)
    return allServices.filter(s => !s.subCategory || !subNames.includes(s.subCategory))
  }, [category, allServices])

  // Get the active sub-category's services
  const activeSubData = useMemo(() => {
    if (!activeSubCategory) return null
    return subCategories.find(s => s.name === activeSubCategory) || null
  }, [activeSubCategory, subCategories])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0a0a0a] dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading services...</p>
        </div>
      </div>
    )
  }

  const categoryTitle = category?.name || ''
  const categoryImage = category?.image || ''
  const hasSubCategories = subCategories.length > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24">
      {/* Header Banner */}
      <div className="relative pt-16 pb-12 px-4 overflow-hidden">
        {/* Background Image or Gradient */}
        {categoryImage ? (
          <>
            <img src={categoryImage} alt={categoryTitle} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500" />
        )}

        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-10">
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="2" fill="currentColor"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern)"/>
           </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/food/user/services")}
            className="rounded-full bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white mb-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-white mb-3"
          >
            {categoryTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-sm md:text-base max-w-md"
          >
            Professional home service at your doorstep.
          </motion.p>

          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm text-xs font-medium text-white">
              <ShieldCheck className="h-4 w-4" /> Verified Pros
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm text-xs font-medium text-white">
              <Star className="h-4 w-4 text-yellow-300" fill="currentColor" /> Top Rated
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-t-3xl p-4 md:p-6 shadow-xl border border-gray-100 dark:border-gray-800 min-h-[500px]">

          <AnimatePresence mode="wait">
            {/* ===== VIEW 1: Sub-Category Cards ===== */}
            {!activeSubCategory && hasSubCategories && (
              <motion.div
                key="subcategory-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Choose a Sub-Category</h2>
                
                <div className="flex flex-col gap-3">
                  {subCategories.map((sub, idx) => (
                    <motion.div
                      key={sub.name}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => setActiveSubCategory(sub.name)}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-900/40 hover:shadow-lg hover:shadow-orange-100/30 dark:hover:shadow-none cursor-pointer transition-all duration-200 bg-white dark:bg-[#1a1a1a]"
                    >
                      {/* Sub-category image */}
                      {sub.image ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700 shadow-sm">
                          <img src={sub.image} alt={sub.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 flex items-center justify-center flex-shrink-0 border border-orange-100 dark:border-orange-900/30">
                          <Briefcase className="w-6 h-6 text-orange-500" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-[#F84E04] transition-colors">{sub.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {sub.services.length > 0 
                            ? `${sub.services.length} ${sub.services.length === 1 ? 'service' : 'services'} available`
                            : 'Coming soon'
                          }
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#F84E04] group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>

                {/* Uncategorized services below sub-categories */}
                {uncategorizedServices.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Other Services</h2>
                    <div className="flex flex-col gap-4">
                      {uncategorizedServices.map((svc, idx) => (
                        <ServiceCard key={svc._id || idx} svc={svc} idx={idx} onBook={handleOpenBooking} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== VIEW 2: Services for Selected Sub-Category ===== */}
            {activeSubCategory && activeSubData && (
              <motion.div
                key="services-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Back button + sub-category header */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setActiveSubCategory(null)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  {activeSubData.image ? (
                    <img src={activeSubData.image} className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-orange-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeSubData.name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activeSubData.services.length} {activeSubData.services.length === 1 ? 'service' : 'services'} available
                    </p>
                  </div>
                </div>

                {activeSubData.services.length === 0 ? (
                  /* No services for this sub-category */
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-2">Coming Soon!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                      Services for <span className="font-semibold text-gray-700 dark:text-gray-300">{activeSubData.name}</span> will be available shortly. Stay tuned! ✨
                    </p>
                    <button
                      onClick={() => setActiveSubCategory(null)}
                      className="mt-6 px-5 py-2 rounded-full text-sm font-bold text-[#F84E04] bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
                    >
                      ← Browse Other Sub-Categories
                    </button>
                  </div>
                ) : (
                  /* Services List with Add buttons */
                  <div className="flex flex-col gap-4">
                    {activeSubData.services.map((svc, idx) => (
                      <ServiceCard key={svc._id || idx} svc={svc} idx={idx} onBook={handleOpenBooking} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== VIEW 3: No sub-categories — show flat services list ===== */}
            {!hasSubCategories && (
              <motion.div
                key="flat-services"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {allServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mb-4">
                      <Briefcase className="w-7 h-7 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Services Available Yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                      We're working on adding services to this category. Please check back soon — great things are on the way! 🚀
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Select a Service</h2>
                    <div className="flex flex-col gap-4">
                      {allServices.map((svc, idx) => (
                        <ServiceCard key={svc._id || idx} svc={svc} idx={idx} onBook={handleOpenBooking} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <ServiceBookingForm
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        service={selectedService}
        categoryTitle={categoryTitle}
      />
    </div>
  )
}

/* Reusable service card */
function ServiceCard({ svc, idx, onBook }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-gray-700 hover:shadow-md transition-all gap-4"
    >
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {svc.image && (
          <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 rounded-xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800">
            <img src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 py-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{svc.name}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-md">
              <Star className="h-3 w-3" fill="currentColor" /> 4.8
            </span>
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
              <Clock className="h-3 w-3" /> {svc.availableFrom} - {svc.availableTo}
            </span>
            {svc.visitingCharge > 0 && (
              <span className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md font-medium">
                Visit: ₹{svc.visitingCharge}
              </span>
            )}
          </div>
          {svc.description && (
            <p className="mt-3 text-xs md:text-sm text-gray-500 line-clamp-2 leading-relaxed">{svc.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center sm:flex-col justify-between sm:justify-center gap-3">
        <div className="text-lg font-black text-gray-900 dark:text-white flex items-center">
          <IndianRupee className="h-4 w-4" />{svc.basePrice}
        </div>
        <button
          className="rounded-full font-bold px-6 py-2 text-white shadow-md text-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(to right, #F84E04, #D40261)' }}
          onClick={() => onBook(svc)}
        >
          Add
        </button>
      </div>
    </motion.div>
  )
}
