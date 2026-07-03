import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { UtensilsCrossed, ShoppingCart, ShoppingBag, Briefcase, Car } from "lucide-react";
import { MODULES, useActiveModule } from "@food/hooks/useActiveModule";

const iconMap = {
  "food": UtensilsCrossed,
  "grocery": ShoppingCart,
  "accessories": ShoppingBag,
  "services": Briefcase,
  "car-booking": Car
};

export default function ModuleNavbar({ className = "" }) {
  const activeModuleId = useActiveModule();
  const scrollRef = useRef(null);

  // Auto-scroll to active item on mount
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        // Scroll element into view smoothly and horizontally center it
        const container = scrollRef.current;
        const scrollLeft = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeModuleId]);

  return (
    <div className={`w-full py-2 bg-transparent ${className}`}>
      <div 
        ref={scrollRef}
        className="flex justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {MODULES.map((module) => {
          const Icon = iconMap[module.id] || ShoppingBag;
          const isActive = module.id === activeModuleId;
          
          return (
            <Link
              key={module.id}
              to={module.path}
              data-active={isActive}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[70px] sm:min-w-[80px] group transition-all`}
            >
              <div 
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-sm
                  ${isActive 
                    ? "bg-[var(--module-theme-color,#F84E04)] text-white shadow-md transform scale-105" 
                    : "bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? "text-white" : "group-hover:text-gray-700 dark:group-hover:text-gray-200"}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span 
                className={`text-[10px] sm:text-[11px] font-semibold tracking-tight text-center truncate w-full px-1
                  ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`}
              >
                {module.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
