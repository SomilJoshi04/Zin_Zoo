import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@food/context/CartContext";
import { useActiveModule } from "@food/hooks/useActiveModule";

export default function HeaderCartIcon() {
  const { cart } = useCart();
  const activeModuleId = useActiveModule();
  
  const moduleCart = cart.filter(item => item.moduleType === activeModuleId);
  const totalItems = moduleCart.reduce((total, item) => total + (item.quantity || 1), 0);

  return (
    <Link to={`/food/user/cart?module=${activeModuleId}`} className="relative group">
      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 border border-white/10 cursor-pointer active:scale-90 transition-all dark:bg-gray-800/50 dark:border-gray-700">
        <ShoppingCart className="h-4 w-4 text-white/90 drop-shadow-sm group-hover:text-[var(--module-theme-color)] transition-colors" />
        {totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[var(--module-theme-color, #FA0272)] text-white text-[9px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full font-bold px-0.5 border border-white dark:border-[#1a1a1a]">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </div>
    </Link>
  );
}
