import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

interface DropdownProps {
    categories?: string[];
    selected?: string;
    onSelect?: (val: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ categories = [], selected, onSelect }) => {
    const [localSelected, setLocalSelected] = useState(categories[0]);
    const [open, setOpen] = useState(false);

    const currentSelected = selected !== undefined ? selected : localSelected;

    return (
        <div className="relative md:w-48 w-full mx-1 text-sm">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex justify-between h-full items-center w-full white px-3 py-2 rounded-md bg-white border border-[#d9d9d9] hover:bg-[#f8f9fa] transition-all"
            >
                {currentSelected}
                <ChevronDown
                    size={16}
                    className={`transition-transform batch-200 ${open ? "rotate-180" : "rotate-0"}`}
                />
            </button>

            {/* Dropdown List */}
            <div
                className={`absolute right-0 z-50 mt-2 w-full bg-white rounded-md border border-[#d9d9d9] shadow-lg transition-all batch-200 origin-top transform ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    }`}
            >
                {categories.map((style) => (
                    <button
                        type="button"
                        key={style}
                        onClick={() => {
                            if (onSelect) {
                                onSelect(style);
                            } else {
                                setLocalSelected(style);
                            }
                            setOpen(false);
                        }}
                        className={`w-full flex justify-between items-center px-4 py-2 rounded text-left transition-all batch-300 ${currentSelected === style ? "bg-[#d9d9d9]" : "hover:bg-[#f8f9fa]"
                            }`}
                    >
                        {style}
                        {currentSelected === style && <Check size={16} />}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Dropdown;