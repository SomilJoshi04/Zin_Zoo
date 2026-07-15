import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Clock, MapPin, Heart, Star } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import Footer from "@food/components/user/Footer"
import ScrollReveal from "@food/components/user/ScrollReveal"
import TextReveal from "@food/components/user/TextReveal"
import { Card, CardTitle, CardContent } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import { RestaurantGridSkeleton } from "@food/components/ui/loading-skeletons"
import { useProfile } from "@food/context/ProfileContext"
import { useZone } from "@food/hooks/useZone"
import { useLocation } from "@food/hooks/useLocation"
import { restaurantAPI } from "@food/api"
import { API_BASE_URL } from "@food/api/config"
import { useDelayedLoading } from "@food/hooks/useDelayedLoading"

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api.*$/, "")

const normalizeImageUrl = (imageUrl) => {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) return ""
  const trimmed = imageUrl.trim()
  if (/^(https?:)?\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed
  }
  return trimmed.startsWith("/")
    ? `${BACKEND_ORIGIN}${trimmed}`
    : `${BACKEND_ORIGIN}/${trimmed}`
}

const pickRestaurantImage = (restaurant) => {
  const candidates = [
    restaurant?.coverImage?.url,
    restaurant?.coverImage,
    ...(Array.isArray(restaurant?.coverImages) ? restaurant.coverImages.map((img) => img?.url || img) : []),
    ...(Array.isArray(restaurant?.menuImages) ? restaurant.menuImages.map((img) => img?.url || img) : []),
    restaurant?.profileImage?.url,
    restaurant?.profileImage,
  ]
  const firstValid = candidates.find((value) => typeof value === "string" && value.trim())
  return normalizeImageUrl(firstValid || "")
}

export default function Restaurants() {
  const { addFavorite, removeFavorite, isFavorite } = useProfile()
  const { location: userLocation } = useLocation()
  const { zoneId } = useZone(userLocation)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const showRestaurantsSkeleton = useDelayedLoading(loading)

  useEffect(() => {
    let cancelled = false

    const fetchRestaurants = async () => {
      try {
        setLoading(true)
        const params = { limit: 300, _ts: Date.now() }
        if (zoneId) {
          params.zoneId = zoneId
        }
        const response = await restaurantAPI.getRestaurants(params, { noCache: true })
        const list =
          response?.data?.data?.restaurants ||
          response?.data?.restaurants ||
          []
        if (cancelled) return

        const transformed = list.map((restaurant) => {
          const slug =
            restaurant?.slug ||
            String(restaurant?.name || "")
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "-")
          const cuisine = Array.isArray(restaurant?.cuisines) && restaurant.cuisines.length > 0
            ? restaurant.cuisines[0]
            : "Multi-cuisine"
          return {
            id: restaurant?._id || restaurant?.restaurantId || slug,
            slug,
            name: restaurant?.name || "Unknown Restaurant",
            cuisine,
            rating: Number(restaurant?.rating || 0) || 4.5,
            deliveryTime: restaurant?.estimatedDeliveryTime || (restaurant?.estimatedDeliveryTimeMinutes ? `${restaurant.estimatedDeliveryTimeMinutes} mins` : "25-30 mins"),
            distance: restaurant?.distance ? (typeof restaurant.distance === 'number' ? `${restaurant.distance.toFixed(1)} km` : restaurant.distance) : "1.2 km",
            priceRange: restaurant?.priceRange || "$$",
            image: pickRestaurantImage(restaurant),
          }
        })

        setRestaurants(transformed)
      } catch (error) {
        if (!cancelled) {
          setRestaurants([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchRestaurants()
    return () => {
      cancelled = true
    }
  }, [zoneId])

  const hasRestaurants = useMemo(() => restaurants.length > 0, [restaurants.length])

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 dark:from-[#0a0a0a] via-white dark:via-[#0a0a0a] to-orange-50/20 dark:to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 space-y-4 sm:space-y-6 lg:space-y-8">
        <ScrollReveal>
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-4 lg:mb-6">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-900 dark:text-gray-100" />
              </Button>
            </Link>
            <TextReveal className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white">
                All Restaurants
              </h1>
            </TextReveal>
          </div>
        </ScrollReveal>

        {showRestaurantsSkeleton ? (
          <RestaurantGridSkeleton count={4} />
        ) : !hasRestaurants ? (
          <div className="py-16 text-center text-sm text-gray-500">No restaurants available right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 pt-2 sm:pt-3 lg:pt-4">
            {restaurants.map((restaurant, index) => {
              const favorite = isFavorite(restaurant.slug)

              const handleToggleFavorite = (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (favorite) {
                  removeFavorite(restaurant.slug)
                } else {
                  addFavorite({
                    slug: restaurant.slug,
                    name: restaurant.name,
                    cuisine: restaurant.cuisine,
                    rating: restaurant.rating,
                    deliveryTime: restaurant.deliveryTime,
                    distance: restaurant.distance,
                    priceRange: restaurant.priceRange,
                    image: restaurant.image,
                  })
                }
              }

              return (
                <ScrollReveal key={restaurant.id} delay={index * 0.05}>
                  <Link to={`/food/user/restaurants/${restaurant.slug}`} className="h-full flex">
                    <div className="bg-white dark:bg-[#151515] rounded-[20px] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800 group hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col h-full w-full relative">
                      {/* Restaurant Image */}
                      <div className="relative h-36 sm:h-40 md:h-44 w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                        <img
                          src={restaurant.image || "https://via.placeholder.com/400x300?text=Restaurant"}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Rating Badge */}
                        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-lg ${Number(restaurant.rating) > 0 ? "bg-black/85 backdrop-blur-md text-white font-black" : "bg-gray-800/90 text-white font-bold"} text-[10px] xs:text-xs shadow-lg border border-white/10 flex items-center gap-1`}>
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {Number(restaurant.rating) > 0 ? Number(restaurant.rating).toFixed(1) : "NEW"}
                        </div>
                        
                        {/* Favorite Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 dark:hover:bg-black/40 transition-colors ${favorite ? "text-red-500" : "text-white"}`}
                          onClick={handleToggleFavorite}
                        >
                          <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${favorite ? "fill-red-500" : ""}`} />
                        </Button>
                      </div>

                      {/* Details */}
                      <div className="p-3.5 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white tracking-tight line-clamp-1 flex-1">
                            {restaurant.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5 line-clamp-1 font-medium">
                          {restaurant.cuisine}
                        </p>

                        <div className="mt-auto pt-2.5 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] font-medium">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F84E04]" />
                            <span>{restaurant.deliveryTime}</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] font-medium">
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F84E04]" />
                            <span>{restaurant.distance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </AnimatedPage>
  )
}

