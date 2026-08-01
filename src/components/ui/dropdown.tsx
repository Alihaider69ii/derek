import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownProps {
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    fullWidth?: boolean;
    align?: "left" | "right";
}

export function Dropdown({ value, options, onChange, className, placeholder, fullWidth, align = "right" }: DropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={cn("relative z-50", fullWidth && "w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between h-10 px-3 py-2 bg-bg-input text-sm border border-border rounded-btn text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 transition-[150ms_ease]",
                    fullWidth ? "w-full" : "w-[160px]",
                    isOpen && "ring-2 ring-accent/30"
                )}
            >
                <span className={cn("truncate flex-1 text-left", !selectedOption && "text-text-secondary")}>
                    {selectedOption?.label || placeholder || "Select..."}
                </span>
                <ChevronDown size={14} className={cn("text-text-secondary ml-2 flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div
                    className={cn(
                        "absolute top-full mt-1.5 bg-bg-panel border border-border rounded-btn overflow-hidden shadow-lg max-h-64 overflow-y-auto",
                        "animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-150 origin-top",
                        fullWidth ? "w-full" : "w-[160px]",
                        align === "right" ? "right-0" : "left-0"
                    )}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                        >
                            <span className="truncate">{option.label}</span>
                            {value === option.value && (
                                <Check size={14} className="text-success flex-shrink-0 ml-2" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
