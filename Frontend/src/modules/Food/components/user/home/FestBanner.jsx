import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightCircle, Leaf, Flame, Sparkles } from 'lucide-react';
import quickSpicyLogo from "@food/assets/quicky-spicy-logo.png";

// Images for different modes - Extended pool for rotation
const images = {
  nonVeg: [
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=500&fit=crop", // Taco
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=500&fit=crop", // Platter
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop", // Burger
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&fit=crop", // Grilled Chicken
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&h=500&fit=crop", // Kebabs
  ],
  veg: [
    "https://images.unsplash.com/photo-1585238341267-1cfec2046a55?w=500&h=500&fit=crop", // Veg Taco
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop", // Salad/Platter
    "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=500&fit=crop", // Paneer/Veg
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop", // Healthy Bowl
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop", // Veg Pizza
  ]
};

export default function FestBanner({ isVegMode, videoUrl = "", hideFoodImages = false }) {
  const [imgIndex, setImgIndex] = useState(0);
  const currentPool = isVegMode ? images.veg : images.nonVeg;
  const hasVideo = typeof videoUrl === "string" && videoUrl.trim().length > 0;
  
  // Dynamic rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setImgIndex(prev => (prev + 1) % currentPool.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentPool.length]);

  // Reset index when mode changes
  useEffect(() => {
    setImgIndex(0);
  }, [isVegMode]);

  // Get 3 images starting from current index
  const displayImages = [
    currentPool[(imgIndex) % currentPool.length],
    currentPool[(imgIndex + 1) % currentPool.length],
    currentPool[(imgIndex + 2) % currentPool.length]
  ];

  return (
      <motion.div 
      initial={false}
      className={`relative px-4 pt-1.5 pb-2 overflow-hidden min-h-[150px] sm:min-h-[200px] transition-all duration-700 bg-transparent rounded-b-[2rem]`}
    >
      {hasVideo && (
        <div className="absolute inset-0 z-0">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
    </motion.div>
  );
}
