import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search for textbooks, electronics, furniture...",
}) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 h-14 text-base bg-white shadow-lg border-0 rounded-2xl"
      />
    </div>
  );
}


