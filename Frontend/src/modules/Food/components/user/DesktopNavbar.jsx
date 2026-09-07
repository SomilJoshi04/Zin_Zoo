import { Link, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { ChevronDown, ShoppingCart, Wallet, Search, Mic } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { Switch } from "@food/components/ui/switch"
import { useLocation as useLocationHook } from "@food/hooks/useLocation"
import { useCart } from "@food/context/CartContext"
import { useLocationSelector, useSearchOverlay } from "./UserLayout"
import { useProfile } from "@food/context/ProfileContext"
import { FaLocationDot } from "react-icons/fa6"
import { AnimatePresence, motion } from "framer-motion"
import quickSpicyLogo from "@food/assets/zinzoox-logo.png"
import { getCachedSettings, loadBusinessSettings } from "@food/utils/businessSettings"
import HeaderNotificationBell from "./HeaderNotificationBell"
import { searchAPI } from "@/services/api"
import GroceryProductSheet from "@food/components/user/GroceryProductSheet"
import AccessoriesProductSheet from "@food/components/user/AccessoriesProductSheet"
import { Loader2 } from "lucide-react"

const debugLog = (...args) => { }
const debugWarn = (...args) => { }
const debugError = (...args) => { }


export default function DesktopNavbar({ showLogo = true }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { location: userLocation, loading: locationLoading } = useLocationHook()
    const { getCartCount } = useCart()
    const { openLocationSelector } = useLocationSelector()
    const { setSearchValue, openSearch } = useSearchOverlay()
    const { vegMode, setVegMode } = useProfile()
    const [heroSearch, setHeroSearch] = useState("")
    const [logoUrl, setLogoUrl] = useState(null)
    const [companyName, setCompanyName] = useState(null)
    const [hasScrolledPastBanner, setHasScrolledPastBanner] = useState(false)
    const navRef = useRef(null)
    const searchRef = useRef(null)
    const cartCount = getCartCount()

    // Global Search Dropdown State
    const [searchResults, setSearchResults] = useState({ food: [], grocery: [], accessories: [], services: [] })
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedGroceryProduct, setSelectedGroceryProduct] = useState(null)
    const [selectedAccessoriesProduct, setSelectedAccessoriesProduct] = useState(null)

    // Helper to resolve media URLs consistently
    const getMediaUrl = (url) => {
        if (!url || typeof url !== 'string') return null;
        if (url.startsWith('http')) return url;
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
        const origin = apiBase.split('/api/v1')[0];
        return `${origin}${url.startsWith('/') ? url : '/' + url}`;
    };
    // Show area if available, otherwise show city
    // Priority: area > city > "Select"
    const areaName = userLocation?.area && userLocation?.area.trim() ? userLocation.area.trim() : null
    const cityName = userLocation?.city || null
    const stateName = userLocation?.state || null
    // Main location name: Show area if available, otherwise show city, otherwise "Select"
    const mainLocationName = areaName || cityName || "Select"
    // Secondary location: Show only city when area is available (as per design image)
    const secondaryLocation = areaName
        ? (cityName || "")  // Show only city when area is available
        : (cityName && stateName ? `${cityName}, ${stateName}` : cityName || stateName || "")

    const handleLocationClick = () => {
        // Open location selector overlay
        openLocationSelector()
    }

    // Check active routes - support both /user/* and /* paths
    const isUnder250 = location.pathname === "/food/user/under-250" || location.pathname === "/food/under-250"
    const isProfile = location.pathname.startsWith("/food/user/profile") || location.pathname.startsWith("/food/profile")
    const isServices = location.pathname === "/food/user/services" || location.pathname === "/food/services"
    const isAccessories = location.pathname === "/food/user/accessories" || location.pathname === "/food/accessories"
    const isDelivery = !isUnder250 && !isProfile && !isServices && !isAccessories && (location.pathname === "/food/user" || location.pathname === "/food" || (location.pathname.startsWith("/food/user") && !location.pathname.includes("/under-250") && !location.pathname.includes("/services") && !location.pathname.includes("/profile") && !location.pathname.includes("/accessories")))
    const isBannerRoute =
        location.pathname === "/food/user" ||
        location.pathname === "/food" ||
        location.pathname === "/food/user/under-250" ||
        location.pathname === "/food/under-250" ||
        location.pathname === "/food/user/accessories" ||
        location.pathname === "/food/accessories"

    // Load business settings logo
    useEffect(() => {
        const loadLogo = async () => {
            try {
                const cached = getCachedSettings()
                if (cached) {
                    if (cached.logo?.url) {
                        setLogoUrl(cached.logo.url)
                    }
                    if (cached.companyName) {
                        setCompanyName(cached.companyName)
                    }
                } else {
                    const settings = await loadBusinessSettings()
                    if (settings) {
                        if (settings.logo?.url) {
                            setLogoUrl(settings.logo.url)
                        }
                        if (settings.companyName) {
                            setCompanyName(settings.companyName)
                        }
                    }
                }
            } catch (error) {
                debugError('Error loading logo:', error)
            }
        }
        loadLogo()

        // Listen for business settings updates
        const handleSettingsUpdate = () => {
            const cached = getCachedSettings()
            if (cached) {
                if (cached.logo?.url) {
                    setLogoUrl(cached.logo.url)
                }
                if (cached.companyName) {
                    setCompanyName(cached.companyName)
                }
            }
        }
        window.addEventListener('businessSettingsUpdated', handleSettingsUpdate)

        return () => {
            window.removeEventListener('businessSettingsUpdated', handleSettingsUpdate)
        }
    }, [])

    useEffect(() => {
        if (!isBannerRoute) {
            setHasScrolledPastBanner(true)
            return
        }

        const handleScroll = () => {
            const heroShell =
                document.querySelector('[data-home-hero-shell="true"]') ||
                document.querySelector('[data-banner-shell="true"]')
            const navElement = navRef.current

            if (!heroShell || !navElement) {
                setHasScrolledPastBanner(false)
                return
            }

            const heroRect = heroShell.getBoundingClientRect()
            const navHeight = navElement.getBoundingClientRect().height || 0
            setHasScrolledPastBanner(heroRect.bottom <= navHeight)
        }

        handleScroll()
        window.addEventListener("scroll", handleScroll, { passive: true })
        window.addEventListener("resize", handleScroll)

        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("resize", handleScroll)
        }
    }, [isBannerRoute])

    // Global Search Debounce & Fetch
    useEffect(() => {
        const q = heroSearch.trim();
        if (q.length < 2) {
            setSearchResults({ food: [], grocery: [], accessories: [], services: [] })
            setShowDropdown(false)
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true)
            setShowDropdown(true)
            try {
                const res = await searchAPI.globalSearch({ q, limit: 5 })
                if (res.data?.success) {
                    const data = res.data.data.results;
                    setSearchResults({
                        food: data.food?.slice(0, 5) || [],
                        grocery: data.grocery?.slice(0, 5) || [],
                        accessories: data.accessories?.slice(0, 5) || [],
                        services: data.services?.slice(0, 5) || []
                    })
                }
            } catch (err) {
                debugError("Global Search failed", err)
            } finally {
                setIsSearching(false)
            }
        }, 400);

        return () => clearTimeout(debounceTimer);
    }, [heroSearch]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Escape to close dropdown
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setShowDropdown(false)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    const handleResultClick = (item, type) => {
        setShowDropdown(false)
        if (type === "grocery") {
            setSelectedGroceryProduct(item)
        } else if (type === "accessories") {
            setSelectedAccessoriesProduct(item)
        } else if (type === "food") {
            const isRestaurant = item.matchType === 'restaurant';
            const linkTo = isRestaurant ? `/food/user/restaurants/${item._id}` : `/food/user/restaurants/${item.restaurantSlug || item.restaurantId}?dish=${item._id}`;
            navigate(linkTo)
        } else if (type === "services") {
            navigate(`/food/user/services/details/${item._id}`)
        }
    }

    const hasAnyResults = Object.values(searchResults).some(arr => arr.length > 0)

    return (
        <nav
            ref={navRef}
            className="hidden md:flex flex-col fixed top-0 left-0 right-0 z-50 py-2 transition-all duration-300 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 shadow-sm"
        >
            {/* Top Row: Location - Search - Icons */}
            <div className="w-full border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        {/* Left: Logo & Location */}
                        <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                            {/* Logo */}
                            {showLogo && (
                                <Link to="/food/user" className="flex items-center justify-center flex-shrink-0 mr-4 md:mr-10 lg:mr-16">
                                    {logoUrl || companyName ? (
                                        <img
                                            src={logoUrl || "/zinzoo-logo.png"}
                                            alt={companyName || "Company Logo"}
                                            className="h-16 w-auto md:h-20 lg:h-24 object-contain scale-110 md:scale-[1.6] lg:scale-[1.8] origin-left"
                                            onError={(e) => {
                                                if (e.target.src !== quickSpicyLogo) {
                                                    e.target.src = quickSpicyLogo
                                                }
                                            }}
                                        />
                                    ) : (
                                        <img src={"/zinzoo-logo.png"} alt={companyName || "Logo"} className="h-16 w-auto md:h-20 lg:h-24 object-contain scale-110 md:scale-[1.6] lg:scale-[1.8] origin-left" />
                                    )}
                                </Link>
                            )}

                            {/* Location Selector */}
                            <Button
                                variant="ghost"
                                onClick={handleLocationClick}
                                disabled={locationLoading}
                                className="h-auto px-0 py-0 hover:bg-transparent transition-colors flex-shrink-0"
                            >
                                {locationLoading ? (
                                    <span className="text-sm font-bold text-black dark:text-white">
                                        Loading...
                                    </span>
                                ) : (
                                    <div className="flex flex-col items-start min-w-0">
                                        <div className="flex items-center gap-1.5 lg:gap-2">
                                            <FaLocationDot
                                                className="h-5 w-5 lg:h-6 lg:w-6 text-black dark:text-white flex-shrink-0"
                                                fill="currentColor"
                                                strokeWidth={2}
                                            />
                                            <span className="text-sm lg:text-base font-bold text-black dark:text-white whitespace-nowrap">
                                                {mainLocationName}
                                            </span>
                                            <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 text-black dark:text-white flex-shrink-0" strokeWidth={2.5} />
                                        </div>
                                        {secondaryLocation && (
                                            <span className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-400 mt-0.5 whitespace-nowrap">
                                                {secondaryLocation}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Center: Search Bar & Veg Mode */}
                        <div className="flex-1 max-w-3xl mx-4 flex items-center gap-4">
                            {/* Search Bar */}
                            <div className="relative flex-1" ref={searchRef}>
                                <div className="relative bg-gray-100 dark:bg-[#2a2a2a] rounded-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-[#F84E04] focus-within:bg-white dark:focus-within:bg-[#1a1a1a] border border-transparent focus-within:border-[#F84E04]/20">
                                    <div className="flex items-center px-3 py-2">
                                        <Search className="h-4 w-4 text-gray-500 flex-shrink-0 mr-3" />
                                        <Input
                                            value={heroSearch}
                                            onChange={(e) => {
                                                const nextValue = e.target.value
                                                setHeroSearch(nextValue)
                                                setSearchValue(nextValue)
                                            }}
                                            onClick={() => {
                                                if (heroSearch.trim().length >= 2) setShowDropdown(true)
                                            }}
                                            onKeyDown={(e) => {
                                                // Prevent Enter from navigating directly, let them use dropdown
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="h-6 p-0 border-0 bg-transparent text-sm font-medium placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            placeholder="Search food, grocery, accessories, services..."
                                        />
                                        {heroSearch && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full ml-1"
                                                onClick={() => {
                                                    setHeroSearch("")
                                                    setShowDropdown(false)
                                                }}
                                            >
                                                <span className="sr-only">Clear</span>
                                                <span aria-hidden="true"></span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Search Dropdown */}
                                <AnimatePresence>
                                    {showDropdown && heroSearch.trim().length >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-[60vh] flex flex-col"
                                        >
                                            {isSearching ? (
                                                <div className="flex items-center justify-center p-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-[#F84E04]" />
                                                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                                                </div>
                                            ) : !hasAnyResults ? (
                                                <div className="p-8 text-center">
                                                    <p className="text-sm text-gray-500">No results found for "{heroSearch}"</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-y-auto p-2">
                                                    {/* Grocery Results */}
                                                    {searchResults.grocery.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-green-600 uppercase bg-green-50 dark:bg-green-950/20 rounded-md mb-2">Grocery</div>
                                                            <div className="space-y-1">
                                                                {searchResults.grocery.map(item => (
                                                                    <div 
                                                                        key={`grocery-${item._id}`}
                                                                        onClick={() => handleResultClick(item, 'grocery')}
                                                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                                            <img src={getMediaUrl(item.image)} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
                                                                            <div className="text-xs text-gray-500 truncate">{item.category?.name || "Grocery"}</div>
                                                                        </div>
                                                                        <div className="font-bold text-sm shrink-0">₹{item.price}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Accessories Results */}
                                                    {searchResults.accessories.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 dark:bg-blue-950/20 rounded-md mb-2">Accessories</div>
                                                            <div className="space-y-1">
                                                                {searchResults.accessories.map(item => (
                                                                    <div 
                                                                        key={`acc-${item._id}`}
                                                                        onClick={() => handleResultClick(item, 'accessories')}
                                                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                                            <img src={getMediaUrl(item.image)} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
                                                                            <div className="text-xs text-gray-500 truncate">{item.category?.name || "Accessories"}</div>
                                                                        </div>
                                                                        <div className="font-bold text-sm shrink-0">₹{item.price}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Food Results */}
                                                    {searchResults.food.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-orange-600 uppercase bg-orange-50 dark:bg-orange-950/20 rounded-md mb-2">Food & Restaurants</div>
                                                            <div className="space-y-1">
                                                                {searchResults.food.map(item => (
                                                                    <div 
                                                                        key={`food-${item._id}`}
                                                                        onClick={() => handleResultClick(item, 'food')}
                                                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                                            <img src={getMediaUrl(item.profileImage || item.image)} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.restaurantName || item.name}</h4>
                                                                            <div className="text-xs text-gray-500 truncate capitalize">{item.matchType || "Dish"}</div>
                                                                        </div>
                                                                        {item.price && <div className="font-bold text-sm shrink-0">₹{item.price}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Services Results */}
                                                    {searchResults.services.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-purple-600 uppercase bg-purple-50 dark:bg-purple-950/20 rounded-md mb-2">Services</div>
                                                            <div className="space-y-1">
                                                                {searchResults.services.map(item => (
                                                                    <div 
                                                                        key={`svc-${item._id}`}
                                                                        onClick={() => handleResultClick(item, 'services')}
                                                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                                            <img src={getMediaUrl(item.image)} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
                                                                            <div className="text-xs text-gray-500 truncate">{item.category}</div>
                                                                        </div>
                                                                        {item.basePrice && <div className="font-bold text-sm shrink-0">₹{item.basePrice}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* VEG MODE Toggle - Moved here */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 leading-none">VEG</span>
                                    <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400 leading-none">MODE</span>
                                </div>
                                <Switch
                                    checked={vegMode}
                                    onCheckedChange={setVegMode}
                                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600 h-5 w-9"
                                />
                            </div>
                        </div>

                        {/* Right: Wallet and Cart Icons */}
                        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                            {/* Wallet Icon */}
                            <Link to="/food/user/wallet">
                                <Button
                                    variant="ghost"
                                    className="h-12 w-12 lg:h-14 lg:w-14 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Wallet"
                                >
                                    <Wallet className="!h-5 !w-5 lg:!h-6 lg:!w-6 text-gray-700 dark:text-gray-300" strokeWidth={2} />
                                </Button>
                            </Link>

                            {/* Notification Bell */}
                            <HeaderNotificationBell
                                className="!h-5 !w-5 lg:!h-6 lg:!w-6 text-gray-700 dark:text-gray-300"
                                triggerClass="h-12 w-12 lg:h-14 lg:w-14 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
                            />

                            {/* Cart Icon */}
                            <Link to="/food/user/cart">
                                <Button
                                    variant="ghost"
                                    className="relative h-12 w-12 lg:h-14 lg:w-14 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Cart"
                                >
                                    <ShoppingCart className="!h-5 !w-5 lg:!h-6 lg:!w-6 text-gray-700 dark:text-gray-300" strokeWidth={2} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                                            <span className="text-xs font-bold text-white">{cartCount > 99 ? "99+" : cartCount}</span>
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Navigation Tabs & Veg Mode */}
            <div className="w-full pb-3 bg-white dark:bg-[#1a1a1a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-12">
                        {/* Navigation Tabs - Centered with spacing */}
                        <div className="flex items-center space-x-8 sm:space-x-12 md:space-x-16 lg:space-x-20 xl:space-x-24">
                            {/* Delivery Tab */}
                            <Link
                                to="/food/user"
                                className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors relative group ${isDelivery
                                    ? "text-orange-600 dark:text-orange-500"
                                    : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500"
                                    }`}
                            >
                                <span className="text-sm font-bold tracking-wide uppercase">Food</span>
                                {isDelivery && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute -bottom-3 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </Link>

                            {/* Under 250 Tab */}
                            <Link
                                to="/food/user/under-250"
                                className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors relative group ${isUnder250
                                    ? "text-orange-600 dark:text-orange-500"
                                    : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500"
                                    }`}
                            >
                                <span className="text-sm font-bold tracking-wide uppercase">Grocery</span>
                                {isUnder250 && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute -bottom-3 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </Link>

                            {/* Accessories Tab */}
                            <Link
                                to="/food/user/accessories"
                                className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors relative group ${isAccessories
                                    ? "text-orange-600 dark:text-orange-500"
                                    : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500"
                                    }`}
                            >
                                <span className="text-sm font-bold tracking-wide uppercase">Accessories</span>
                                {isAccessories && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute -bottom-3 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </Link>

                            {/* Services Tab */}
                            <Link
                                to="/food/user/services"
                                className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors relative group ${isServices
                                    ? "text-orange-600 dark:text-orange-500"
                                    : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500"
                                    }`}
                            >
                                <span className="text-sm font-bold tracking-wide uppercase">Services</span>
                                {isServices && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute -bottom-3 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </Link>

                            {/* Profile Tab */}
                            <Link
                                to="/food/user/profile"
                                className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors relative group ${isProfile
                                    ? "text-orange-600 dark:text-orange-500"
                                    : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500"
                                    }`}
                            >
                                <span className="text-sm font-bold tracking-wide uppercase">Profile</span>
                                {isProfile && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute -bottom-3 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sheets */}
            <GroceryProductSheet 
                selectedProduct={selectedGroceryProduct} 
                setSelectedProduct={setSelectedGroceryProduct} 
            />
            <AccessoriesProductSheet 
                selectedProduct={selectedAccessoriesProduct} 
                setSelectedProduct={setSelectedAccessoriesProduct} 
            />
        </nav>
    )
}



