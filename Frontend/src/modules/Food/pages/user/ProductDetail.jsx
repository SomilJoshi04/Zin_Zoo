import { useState, useMemo, useEffect } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"

import { ArrowLeft, Clock, MapPin, ShoppingBag, Plus, Minus, Calendar } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import Footer from "@food/components/user/Footer"
import ScrollReveal from "@food/components/user/ScrollReveal"
import { useCart } from "@food/context/CartContext"
import { useOrders } from "@food/context/OrdersContext"
import { Button } from "@food/components/ui/button"
import { Badge } from "@food/components/ui/badge"
import { Loader2 } from "lucide-react"

import { groceryPublicAPI, accessoriesPublicAPI } from "../../../../services/api/index.js"

const getMediaUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;
};

export default function ProductDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const moduleType = searchParams.get("module") // 'grocery' or 'accessories'
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const { addToCart, isInCart, getCartItem, updateQuantity, removeFromCart } = useCart()
  const { getAllOrders } = useOrders()
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !moduleType) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setNotFound(false)

      try {
        let res
        if (moduleType === 'grocery') {
          res = await groceryPublicAPI.getProductById(id)
        } else if (moduleType === 'accessories') {
          res = await accessoriesPublicAPI.getProductById(id)
        } else {
          setError("Invalid product type.")
          setLoading(false)
          return
        }

        if (res?.data?.success && res?.data?.data?.product) {
          setProduct(res.data.data.product)
        } else {
          setNotFound(true)
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        if (err.response?.status === 404 || err.response?.status === 400) {
          setNotFound(true)
        } else {
          setError("Unable to load product. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, moduleType])

  const inCart = product ? isInCart(product._id) : false
  const cartItem = product ? getCartItem(product._id) : null
  const orders = getAllOrders()

  // Get order history for this product
  const orderHistory = useMemo(() => {
    if (!product) return []
    return orders.filter(order =>
      order.items?.some(item => (item.id === product._id || item.itemId === product._id))
    ).slice(0, 5) // Show last 5 orders
  }, [orders, product])

  const handleAddToCart = () => {
    if (product) {
      // Respect existing cart structure
      const cartItemObj = {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        moduleType: moduleType,
      }
      
      if (moduleType === 'grocery') {
        cartItemObj.foodType = product.foodType
        cartItemObj.isVeg = product.isVeg !== undefined ? product.isVeg : product.foodType === 'Veg'
      }

      for (let i = 0; i < quantity; i++) {
        const result = addToCart(cartItemObj)
        if (result?.ok === false) {
          alert(result.error || "Cannot add item. Please check your cart.")
          break
        }
      }
    }
  }

  const handleIncrease = () => {
    if (inCart && cartItem) {
      updateQuantity(product._id, cartItem.quantity + 1)
    } else {
      setQuantity(prev => prev + 1)
    }
  }

  const handleDecrease = () => {
    if (inCart && cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(product._id, cartItem.quantity - 1)
      } else {
        removeFromCart(product._id)
      }
    } else {
      setQuantity(prev => Math.max(1, prev - 1))
    }
  }

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center">
           <Loader2 className="h-10 w-10 animate-spin text-primary-orange mb-4" />
           <p className="text-gray-500 font-medium">Loading product details...</p>
        </div>
      </AnimatedPage>
    )
  }

  if (error) {
    return (
      <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">{error}</h1>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </AnimatedPage>
    )
  }

  if (notFound || !product) {
    return (
      <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </AnimatedPage>
    )
  }

  const displayPrice = product.price || 0;
  const displayImage = getMediaUrl(product.image || (Array.isArray(product.images) && product.images[0]) || "/placeholder-dish.jpg");
  const isOutOfStock = product.stock !== undefined ? product.stock <= 0 : false;

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">

        {/* Hero Image Section */}
        <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] overflow-hidden rounded-lg md:rounded-xl lg:rounded-2xl mt-4 md:mt-6 lg:mt-8 bg-slate-100 dark:bg-zinc-800">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover object-center" 
            onError={(e) => (e.target.src = "/placeholder-dish.jpg")}
          />

          {/* Back Button - Overlay on Image */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
            >
              <ArrowLeft className="h-5 w-5 text-gray-800" />
            </Button>
          </div>

          {/* Product Info Card Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a1a1a] rounded-t-3xl p-4 sm:p-5 md:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6 lg:gap-8">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                    {product.name}
                  </h1>
                </div>
                {product.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-2 md:mb-3 line-clamp-2 lg:line-clamp-3">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-3 md:gap-4 flex-wrap mt-3">
                  <Badge variant="outline" className="text-xs sm:text-sm md:text-base uppercase">
                    {moduleType}
                  </Badge>
                  {(product.categoryName || product.categoryId?.name) && (
                    <Badge variant="secondary" className="text-xs sm:text-sm md:text-base">
                      {product.categoryName || product.categoryId?.name}
                    </Badge>
                  )}
                  {isOutOfStock && (
                     <Badge variant="destructive" className="text-xs sm:text-sm md:text-base">
                       Out of Stock
                     </Badge>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-left md:text-right">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary-orange">
                  ₹{displayPrice}
                </div>
                {product.unit && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">per {product.unit}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 lg:py-12 space-y-6 md:space-y-8 lg:space-y-10">
          
          {/* Breadcrumb */}
          <ScrollReveal>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <Link to="/food" className="hover:text-primary-orange transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate capitalize">{moduleType}</span>
              <span>/</span>
              <span className="text-foreground font-medium truncate">{product.name}</span>
            </div>
          </ScrollReveal>

          {/* Add to Cart Section */}
          <ScrollReveal delay={0.1}>
            <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold">Order</h2>
              {isOutOfStock ? (
                 <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium text-center">
                    This item is currently out of stock.
                 </div>
              ) : inCart ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-[#F84E04] rounded-lg bg-white dark:bg-black">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-[#FFF2EB] dark:hover:bg-zinc-800"
                      onClick={handleDecrease}
                    >
                      <Minus className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    </Button>
                    <div className="w-16 px-1 text-lg font-semibold text-center select-none text-gray-900 dark:text-white">
                      {cartItem?.quantity || 0}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-[#FFF2EB] dark:hover:bg-zinc-800"
                      onClick={handleIncrease}
                    >
                      <Plus className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Total for item</p>
                    <p className="text-lg font-bold text-primary-orange">
                      ₹{(displayPrice * (cartItem?.quantity || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg bg-white dark:bg-black">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    >
                      <Minus className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    </Button>
                    <div className="w-16 px-1 text-lg font-semibold text-center select-none text-gray-900 dark:text-white">
                      {quantity}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={() => setQuantity(prev => prev + 1)}
                    >
                      <Plus className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Button
                      onClick={handleAddToCart}
                      className="bg-primary-orange hover:opacity-90 text-white w-full sm:w-auto px-8"
                      size="lg"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Add to Cart &middot; ₹{(displayPrice * quantity).toFixed(2)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Product Details Section */}
          <ScrollReveal delay={0.2}>
            <div className="space-y-4 md:space-y-6 pb-4 md:pb-6 border-b border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm md:text-base">
                {product.brand && (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Brand</p>
                    <p className="font-semibold">{product.brand}</p>
                  </div>
                )}
                {product.unit && (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Unit Size</p>
                    <p className="font-semibold">{product.unit}</p>
                  </div>
                )}
                {product.foodType && (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Type</p>
                    <p className="font-semibold flex items-center gap-1">
                       <span className={`w-3 h-3 rounded-full border ${product.foodType === 'Veg' ? 'border-green-600 bg-green-100' : 'border-red-600 bg-red-100'} flex items-center justify-center`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${product.foodType === 'Veg' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                       </span>
                       {product.foodType}
                    </p>
                  </div>
                )}
                {product.preparationTime && (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Prep Time</p>
                    <p className="font-semibold">{product.preparationTime}</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Order History */}
          {orderHistory.length > 0 && (
            <ScrollReveal delay={0.3}>
              <div className="space-y-4 pb-4">
                <h2 className="text-xl font-bold">Your Past Orders</h2>
                <div className="space-y-3">
                  {orderHistory.map((order) => (
                    <div key={order._id || order.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                      <div>
                        <p className="font-semibold">Order #{String(order._id || order.id).slice(-6)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{order.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

        </div>
      </div>
      <Footer />
    </AnimatedPage>
  )
}
