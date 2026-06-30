import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@food/components/ui/popover";
import { MODULES, useActiveModule } from "@food/hooks/useActiveModule";

export default function ModuleSwitcher({ variant = "light" }) {
  const activeModuleId = useActiveModule();
  const [isOpen, setIsOpen] = useState(false);

  // Filter out the currently active module
  const availableModules = MODULES.filter(mod => mod.id !== activeModuleId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-all ${
          variant === "dark" 
            ? "bg-gray-100 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 hover:bg-gray-200" 
            : "bg-white/10 border border-white/10 dark:bg-gray-800/50 dark:border-gray-700"
        }`}>
          <Menu className={`h-4 w-4 drop-shadow-sm ${variant === "dark" ? "text-gray-700 dark:text-gray-300" : "text-white/90"}`} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 overflow-hidden border-none shadow-2xl rounded-xl mt-2" align="end">
        <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Switch Service</span>
          </div>
          <div className="flex flex-col p-1">
            {availableModules.map((module) => (
              <Link
                key={module.id}
                to={module.path}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[var(--module-theme-color,#FA0272)] rounded-md transition-colors flex items-center"
              >
                {module.label}
              </Link>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
