import React from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Briefcase, Shield, Clock, PhoneCall, Zap, Droplets, Sparkles, Hammer, PaintRoller, Fan, Wrench, ShieldCheck, ArrowLeft } from "lucide-react"
import { servicesPublicAPI } from "@food/api"
import { usePublicSocket } from "@food/hooks/usePublicSocket"

export default function Services() {
  const navigate = useNavigate()
  const [categories, setCategories] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await servicesPublicAPI.getCategories()
      if (res.data?.success) {
        setCategories(res.data.data.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setLoading(false)
    }
  }

  // Real-time updates from admin
  const socketListeners = React.useMemo(() => ({
    'services:category:update': () => {
      console.log('[Services] Category updated via socket, refetching...');
      fetchCategories();
    },
    'services:item:update': () => {
      console.log('[Services] Service updated via socket');
    },
  }), []);
  usePublicSocket(socketListeners);
  
  const coreServices = [
    {
      title: "Electronics Repair",
      description: "Expert repair and installation for ACs, TVs, refrigerators, and washing machines.",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      slug: "electronics-repair",
      badge: "Popular"
    },
    {
      title: "Plumbing Services",
      description: "Quick fixes for leaks, blockages, pipe installations, and bathroom fittings.",
      icon: Droplets,
      color: "from-teal-500 to-emerald-500",
      slug: "plumbing-services",
      badge: "Fast"
    },
    {
      title: "Deep Cleaning",
      description: "Professional deep cleaning services for kitchens, bathrooms, and full home.",
      icon: Sparkles,
      color: "from-amber-500 to-orange-500",
      slug: "deep-cleaning",
      badge: "Premium"
    },
    {
      title: "Carpentry Works",
      description: "Custom woodwork, furniture repair, and professional assembling services.",
      icon: Hammer,
      slug: "carpentry",
      color: "from-rose-500 to-pink-500",
    },
    {
      title: "Painting & Decor",
      description: "Professional interior and exterior painting, waterproofing, and wallpapers.",
      icon: PaintRoller,
      slug: "painting",
      color: "from-purple-500 to-indigo-500",
    },
    {
      title: "Electrical Fittings",
      description: "Wiring, switchboard repairs, inverter installation, and lighting solutions.",
      icon: Fan,
      slug: "electrical",
      color: "from-gray-700 to-gray-900",
    }
  ]

  const upcomingServices = [
    {
      title: "Pest Control",
      description: "Eco-friendly and highly effective pest control services for your entire home.",
      icon: ShieldCheck,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Home Security Setup",
      description: "Installation of CCTV cameras, smart locks, and complete home security systems.",
      icon: Wrench,
      color: "from-indigo-500 to-blue-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a] pt-4 pb-24 md:pt-24 md:pb-12 px-4 max-w-7xl mx-auto relative">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate("/food")} 
        className="absolute top-4 left-4 md:top-8 md:left-8 p-2.5 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-full shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors z-50"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 mt-12 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-4"
        >
          <Briefcase className="h-3 w-3" />
          Our Services
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4 py-1 leading-normal md:leading-normal"
        >
          Expert Services, <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent pb-2">At Your Doorstep</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm md:text-base text-gray-500 dark:text-gray-400"
        >
          From quick plumbing fixes to deep home cleaning, explore our range of verified and professional home services.
        </motion.p>
      </div>

      {/* Core Services Section */}
      <div className="mb-12">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 px-1">
          <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
          Core Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            // Skeleton loaders
            Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))
          ) : categories.length > 0 ? (
            categories.map((category, index) => {
              // Extract a fallback color for the background
              const color = "from-blue-500 to-cyan-500";
              const slug = category.name.toLowerCase().replace(/\s+/g, '-');
              
              return (
                <Link to={`/food/user/services/${slug}?categoryId=${category._id}`} key={category._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="relative h-56 md:h-64 rounded-2xl overflow-hidden group cursor-pointer shadow-lg shadow-gray-200/50 dark:shadow-none"
                  >
                  {/* Background Image */}
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80`} />
                  )}

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Content (Text on top) */}
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end z-10">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm font-medium text-gray-300">
                      {category.subCategories?.length || 0} Sub-categories available
                    </p>
                  </div>
                  </motion.div>
                </Link>
              )
            })
          ) : (
            <p className="col-span-3 text-center text-gray-500 py-10">No core services available right now.</p>
          )}
        </div>
      </div>

      {/* Upcoming Services Section */}
      <div className="mb-12">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 px-1">
          <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingServices.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -4 }}
                className="relative bg-white/60 dark:bg-[#121212]/60 backdrop-blur-sm rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${service.color} text-white opacity-70`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                        {service.title}
                      </h3>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Beta
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Trust & Features Row */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-900">
        <div className="flex flex-col items-center text-center p-3">
          <Shield className="h-5 w-5 text-green-500 mb-2" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Secure Payments</span>
        </div>
        <div className="flex flex-col items-center text-center p-3">
          <Clock className="h-5 w-5 text-blue-500 mb-2" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">24/7 Service</span>
        </div>
        <div className="flex flex-col items-center text-center p-3">
          <PhoneCall className="h-5 w-5 text-purple-500 mb-2" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Instant Help</span>
        </div>
      </div>
    </div>
  )
}
