import { useLocation } from "react-router-dom";

export const MODULES = [
  { id: "food", label: "Food", path: "/food/user" },
  { id: "grocery", label: "Grocery", path: "/food/user/under-250" },
  { id: "accessories", label: "Accessories", path: "/food/user/accessories" },
  { id: "services", label: "Services", path: "/food/user/services" },
  { id: "car-booking", label: "Car Booking", path: "/food/user/car-booking" },
];

export function useActiveModule() {
  const location = useLocation();
  const pathname = location.pathname;

  // Determine active module based on path
  if (pathname.includes("/under-250")) return "grocery";
  if (pathname.includes("/services")) return "services";
  if (pathname.includes("/accessories")) return "accessories";
  if (pathname.includes("/car-booking")) return "car-booking";
  
  // Default to food for root or other paths within food
  return "food";
}
