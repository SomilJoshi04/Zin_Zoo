import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { 
  ArrowLeft, Search, Loader2, Store, Star, BadgePercent, Clock, X
} from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { searchAPI } from "@/services/api"
import { motion, AnimatePresence } from "framer-motion"

// Helper to resolve media URLs consistently
const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http')) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  const origin = apiBase.split('/api/v1')[0];
  return `${origin}${url.startsWith('/') ? url : '/' + url}`;
};

export default function GlobalSearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const navigate = useNavigate()
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState({ food: [], grocery: [], accessories: [], services: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")

  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      setResults({ food: [], grocery: [], accessories: [], services: [] })
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const res = await searchAPI.globalSearch({
        q: searchTerm.trim(),
        limit: 20
      })
      
      if (res.data?.success) {
        const data = res.data.data.results;
        setResults({
          food: data.food || [],
          grocery: data.grocery || [],
          accessories: data.accessories || [],
          services: data.services || []
        })

        // Auto-select primary tab based on highest count if coming from empty or 'all'
        const counts = {
            food: data.food?.length || 0,
            grocery: data.grocery?.length || 0,
            accessories: data.accessories?.length || 0,
            services: data.services?.length || 0
        };
        const maxCategory = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        if (counts[maxCategory] > 0) {
            setActiveTab(maxCategory);
        } else {
            setActiveTab("all");
        }
      }
    } catch (err) {
      console.error("Global Search failed", err)
      setError("Unable to load search results. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Execute search on mount and when query param changes
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) {
      setQuery(q)
      performSearch(q)
    }
  }, [searchParams.get("q"), performSearch])

  const handleClear = () => {
    setQuery("")
    setSearchParams({})
    setResults({ food: [], grocery: [], accessories: [], services: [] })
    setActiveTab("all")
  }

  // Derived filtered results
  const displayResults = useMemo(() => {
    if (activeTab === "all") {
        return results;
    }
    return {
        food: activeTab === "food" ? results.food : [],
        grocery: activeTab === "grocery" ? results.grocery : [],
        accessories: activeTab === "accessories" ? results.accessories : [],
        services: activeTab === "services" ? results.services : []
    };
  }, [results, activeTab]);

  const hasAnyResults = Object.values(results).some(arr => arr.length > 0);
  const totalResultsCount = Object.values(results).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Header (Desktop style, similar to mobile but isolated) */}
      <div className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 py-3 shadow-sm hidden md:block">
         <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/food/user");
              }
            }} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === "Enter" && query.trim()) {
                     setSearchParams({ q: query.trim() })
                 }
              }}
              className="pl-12 pr-12 h-12 w-full bg-slate-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-rose-500 rounded-full text-base"
              placeholder="Search across Food, Grocery, Accessories, Services..."
            />
            {query && (
              <button onClick={handleClear} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 hidden md:block">
        
        {/* Error State */}
        {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 flex items-center justify-center font-medium">
                {error}
            </div>
        )}

        {/* Loading Spinner */}
        <AnimatePresence>
          {loading && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center py-32"
            >
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
              <p className="text-slate-400 text-sm font-medium">Searching everywhere for you...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && searchParams.get("q") && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {hasAnyResults ? (
                <>
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-zinc-800 pb-4 mb-8">
                        <Button 
                            variant={activeTab === "all" ? "default" : "outline"}
                            className={activeTab === "all" ? "bg-rose-500 hover:bg-rose-600 rounded-full" : "rounded-full"}
                            onClick={() => setActiveTab("all")}
                        >
                            All ({totalResultsCount})
                        </Button>
                        <Button 
                            variant={activeTab === "food" ? "default" : "outline"}
                            className={activeTab === "food" ? "bg-orange-500 hover:bg-orange-600 rounded-full" : "rounded-full"}
                            onClick={() => setActiveTab("food")}
                        >
                            Food ({results.food.length})
                        </Button>
                        <Button 
                            variant={activeTab === "grocery" ? "default" : "outline"}
                            className={activeTab === "grocery" ? "bg-green-500 hover:bg-green-600 rounded-full" : "rounded-full"}
                            onClick={() => setActiveTab("grocery")}
                        >
                            Grocery ({results.grocery.length})
                        </Button>
                        <Button 
                            variant={activeTab === "accessories" ? "default" : "outline"}
                            className={activeTab === "accessories" ? "bg-blue-500 hover:bg-blue-600 rounded-full" : "rounded-full"}
                            onClick={() => setActiveTab("accessories")}
                        >
                            Accessories ({results.accessories.length})
                        </Button>
                        <Button 
                            variant={activeTab === "services" ? "default" : "outline"}
                            className={activeTab === "services" ? "bg-purple-500 hover:bg-purple-600 rounded-full" : "rounded-full"}
                            onClick={() => setActiveTab("services")}
                        >
                            Services ({results.services.length})
                        </Button>
                    </div>

                    <div className="grid gap-8">
                        {/* Food Section */}
                        {displayResults.food.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                            <h2 className="text-xl font-bold dark:text-white">Food & Restaurants</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayResults.food.map((r, i) => {
                                const isRestaurant = r.matchType === 'restaurant';
                                const linkTo = isRestaurant ? `/food/user/restaurants/${r._id}` : `/food/user/restaurants/${r.restaurantSlug || r.restaurantId}?dish=${r._id}`;
                                return (
                                <Link to={linkTo} key={`${r._id}-${i}`} className="block group">
                                    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] mb-3 bg-slate-200 shadow-sm border border-slate-100 dark:border-zinc-800">
                                        <img 
                                            src={getMediaUrl(r.profileImage || r.image || (Array.isArray(r.images) && r.images[0]))} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => (e.target.src = "/placeholder-restaurant.jpg")}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-0.5 line-clamp-1">{r.restaurantName || r.name}</h3>
                                                <p className="text-white/80 text-xs line-clamp-1">
                                                    {isRestaurant ? r.cuisines?.join(", ") : r.restaurantName}
                                                </p>
                                            </div>
                                            {(r.rating || r.restaurantRating) && (
                                                <div className="bg-white/20 backdrop-blur-md border border-white/30 px-2 py-1 rounded-lg flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-white fill-white" />
                                                    <span className="text-white text-xs font-bold">{r.rating || r.restaurantRating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                            {r.price && <span className="font-bold text-slate-700 dark:text-zinc-300">₹{r.price}</span>}
                                            {r.price && <span>•</span>}
                                            <span className="capitalize">{isRestaurant ? "Restaurant" : "Dish"}</span>
                                        </div>
                                    </div>
                                </Link>
                                )
                            })}
                            </div>
                        </section>
                        )}

                        {/* Grocery Section */}
                        {displayResults.grocery.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                            <h2 className="text-xl font-bold dark:text-white">Grocery</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {displayResults.grocery.map((r, i) => (
                                <Link to={`/food/user/product/${r._id}?module=grocery`} key={`g-${r._id}-${i}`} className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-zinc-800 hover:shadow-md transition-shadow group flex flex-col h-full">
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center">
                                        <img 
                                            src={getMediaUrl(r.image || (Array.isArray(r.images) && r.images[0]))} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 mix-blend-multiply dark:mix-blend-normal"
                                            onError={(e) => (e.target.src = "/placeholder-dish.jpg")}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="text-xs text-slate-400 mb-1">{r.brand}</div>
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2 mb-2 leading-tight flex-1">{r.name}</h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="font-bold text-slate-900 dark:text-white">₹{r.price || r.mrp}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            </div>
                        </section>
                        )}

                        {/* Accessories Section */}
                        {displayResults.accessories.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            <h2 className="text-xl font-bold dark:text-white">Accessories</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {displayResults.accessories.map((r, i) => (
                                <Link to={`/food/user/product/${r._id}?module=accessories`} key={`a-${r._id}-${i}`} className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-zinc-800 hover:shadow-md transition-shadow group flex flex-col h-full">
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center">
                                        <img 
                                            src={getMediaUrl(r.image || (Array.isArray(r.images) && r.images[0]))} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 mix-blend-multiply dark:mix-blend-normal"
                                            onError={(e) => (e.target.src = "/placeholder-dish.jpg")}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="text-xs text-slate-400 mb-1">{r.brand}</div>
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2 mb-2 leading-tight flex-1">{r.name}</h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="font-bold text-slate-900 dark:text-white">₹{r.price || r.mrp}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            </div>
                        </section>
                        )}

                        {/* Services Section */}
                        {displayResults.services.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                            <h2 className="text-xl font-bold dark:text-white">Services</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayResults.services.map((r, i) => (
                                <Link to={`/food/user/services/details/${r._id}`} key={`s-${r._id}-${i}`} className="flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 hover:shadow-md transition-shadow group items-center">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                        <img 
                                            src={getMediaUrl(r.image)} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                            onError={(e) => (e.target.src = "/placeholder-dish.jpg")}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-lg mb-1">{r.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                            <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{r.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-right pl-2 border-l border-slate-100 dark:border-zinc-800">
                                        <div className="text-xs text-slate-500 font-medium mb-1">Starts at</div>
                                        <div className="font-black text-slate-900 dark:text-white text-lg">₹{r.basePrice}</div>
                                    </div>
                                </Link>
                            ))}
                            </div>
                        </section>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Results Found</h2>
                    <p className="text-slate-500 max-w-sm text-base">We couldn't find any results for "{searchParams.get("q")}". Try checking the spelling or using a different keyword.</p>
                    <Button variant="outline" onClick={handleClear} className="mt-8 rounded-full border-rose-500 text-rose-500 hover:bg-rose-50 px-8">
                        Clear Search
                    </Button>
                </div>
            )}
          </div>
        )}

        {!searchParams.get("q") && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What are you looking for?</h2>
                <p className="text-slate-500 max-w-sm text-base">Search across all our offerings including food, grocery, accessories, and services.</p>
            </div>
        )}
      </div>

      {/* Hide on mobile with a message or fallback */}
      <div className="md:hidden flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-rose-500">
              <Search className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Desktop Only Feature</h2>
          <p className="text-slate-500 text-sm">The global search feature is currently optimized for desktop viewing. Please use the mobile search from the home screen.</p>
          <Button onClick={() => navigate("/food/user")} className="mt-6 bg-rose-500 rounded-full">
              Go to Home
          </Button>
      </div>
    </div>
  )
}
