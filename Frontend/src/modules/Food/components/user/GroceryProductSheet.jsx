import React from "react";
import { X, ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@food/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@food/components/ui/sheet";
import { useCart } from "@food/context/CartContext";

export default function GroceryProductSheet({ selectedProduct, setSelectedProduct }) {
  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();

  const handleAdd = async (e, product) => {
    e.stopPropagation();
    const btnRect = e.target.getBoundingClientRect();
    const sourcePosition = { x: btnRect.left, y: btnRect.top };
    
    await addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      moduleType: 'grocery',
      foodType: product.foodType,
      isVeg: product.isVeg !== undefined ? product.isVeg : product.foodType === 'Veg',
    }, sourcePosition);
  };

  const handleRemove = (e, product) => {
    e.stopPropagation();
    const currentItem = cart.find(i => (i.itemId || i.id) === product._id);
    if (currentItem && currentItem.quantity > 1) {
      updateQuantity(product._id, currentItem.quantity - 1, { x: 0, y: 0 }, { ...product, id: product._id });
    } else {
      removeFromCart(product._id);
    }
  };

  if (!selectedProduct) return null;

  const qty = cart.find(i => (i.itemId || i.id) === selectedProduct._id)?.quantity || 0;

  return (
    <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
      <SheetContent side="bottom" className="h-[80vh] md:h-[90vh] md:w-[500px] md:mx-auto md:mb-4 rounded-t-3xl md:rounded-3xl p-0 flex flex-col overflow-hidden bg-white dark:bg-[#121212] font-outfit border-0 shadow-2xl z-[99999]">
        {/* Image Section */}
        <div className="relative w-full h-[40%] bg-gray-50 dark:bg-gray-800/40 p-8 flex items-center justify-center border-b dark:border-gray-800">
           <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-white/50 backdrop-blur-md dark:bg-gray-900/50 p-2 rounded-full z-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
             <X className="w-5 h-5" />
           </button>
           {selectedProduct.image ? (
             <img src={selectedProduct.image} alt={selectedProduct.name} className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
           ) : (
             <ShoppingCart className="w-20 h-20 text-gray-300" />
           )}
        </div>
        
        {/* Details Section */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                {selectedProduct.category?.name || "Grocery"}
              </span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-md font-bold">
                {selectedProduct.unit || '1 pc'}
              </span>
              {(() => {
                const ft = selectedProduct.foodType || 'Veg';
                const isVeg = /veg/i.test(ft) && !/non/i.test(ft);
                return (
                  <span
                    style={{
                      backgroundColor: isVeg ? '#f0fdf4' : '#fff1f2',
                      color: isVeg ? '#15803d' : '#be123c',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}
                  >
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        border: `2px solid ${isVeg ? '#16a34a' : '#dc2626'}`,
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <div
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: isVeg ? '#16a34a' : '#dc2626'
                        }}
                      />
                    </div>
                    {ft}
                  </span>
                );
              })()}
            </div>
          
          <div>
            <SheetTitle className="text-2xl font-black text-gray-900 dark:text-white leading-tight font-poppins mb-1.5">
              {selectedProduct.name}
            </SheetTitle>
            <div className="flex items-end gap-2 mt-1">
              <span className="font-black text-3xl text-gray-900 dark:text-white font-poppins leading-none">&#8377;{selectedProduct.price}</span>
              <span className="text-sm text-gray-400 line-through font-semibold mb-0.5">&#8377;{Math.round(selectedProduct.price * 1.2)}</span>
              <span className="text-[10px] font-black text-white bg-green-500 px-2 py-0.5 rounded-sm ml-1 mb-1">20% OFF</span>
            </div>
          </div>
                         <div className="mt-1">
            <h5 className="font-bold text-sm mb-1.5 text-gray-900 dark:text-white">Product Description</h5>
            <SheetDescription className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
              {selectedProduct.description || "Farm fresh and carefully selected daily essentials. Delivered safely and securely to your doorstep in 10-15 minutes. Perfect for your everyday needs!"}
            </SheetDescription>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs font-bold">
            {selectedProduct.quantity > 0 && selectedProduct.quantity - qty > 0 ? (
              <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded">
                In Stock ({selectedProduct.quantity - qty} items left)
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded">
                Out of Stock
              </span>
            )}
          </div>
          
          {/* Info Cards */}
          <div className="mt-2 flex gap-3">
             <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 w-full">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5">Delivery</span>
                <span className="text-sm font-black text-blue-700 dark:text-blue-300">{selectedProduct.preparationTime || "10 mins"}</span>
             </div>
          </div>
        </div>

        {/* Bottom Sticky Add to Cart Section */}
        <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-[#1a1a1a] pb-6 md:pb-4 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
          {(() => {
            if (selectedProduct.quantity === 0) {
              return (
                <Button 
                  disabled
                  className="w-full h-14 bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-bold text-lg rounded-xl cursor-not-allowed border border-gray-300/40 dark:border-gray-700/40"
                >
                  Out of Stock
                </Button>
              )
            } else if (qty === 0) {
              return (
                <Button 
                  className="w-full h-14 bg-[var(--module-theme-color)] hover:bg-[var(--module-theme-color)]/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-[var(--module-theme-color)]/30 transition-all hover:scale-[1.02] hover:shadow-[var(--module-theme-color)]/40 active:scale-95"
                  onClick={(e) => handleAdd(e, selectedProduct)}
                >
                  Add to Cart &middot; &#8377;{selectedProduct.price}
                </Button>
              )
            } else {
              return (
                <div className="flex items-center justify-between w-full h-14 bg-white dark:bg-gray-900 border-[2.5px] border-[var(--module-theme-color)] rounded-xl px-2 shadow-sm">
                   <button onClick={(e) => handleRemove(e, selectedProduct)} className="w-14 h-full flex items-center justify-center text-[var(--module-theme-color)] hover:bg-[var(--module-theme-color)]/10 rounded-lg transition-colors active:scale-90">
                     <Minus className="w-6 h-6" strokeWidth={2.5} />
                   </button>
                   <div className="flex flex-col items-center">
                     <input 
                       type="number"
                       min="0"
                       value={qty || 0}
                       onChange={(e) => {
                         const val = e.target.value;
                         const newQuantity = val === "" ? 0 : parseInt(val, 10);
                         if (!isNaN(newQuantity)) {
                           updateQuantity(selectedProduct._id, Math.max(0, newQuantity), { x: 0, y: 0 }, { ...selectedProduct, id: selectedProduct._id });
                         }
                       }}
                       className="w-12 font-black text-lg text-center text-[var(--module-theme-color)] leading-none bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                     />
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">in cart</span>
                   </div>
                   <button onClick={(e) => handleAdd(e, selectedProduct)} className="w-14 h-full flex items-center justify-center text-[var(--module-theme-color)] hover:bg-[var(--module-theme-color)]/10 rounded-lg transition-colors active:scale-90">
                     <Plus className="w-6 h-6" strokeWidth={2.5} />
                   </button>
                </div>
              )
            }
          })()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
