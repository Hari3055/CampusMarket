import React from "react";
import { Button } from "@/components/ui/button";
import {
  Book,
  Laptop,
  Sofa,
  Shirt,
  Ticket,
  Dumbbell,
  UtensilsCrossed,
  Sparkles,
  Grid3x3,
} from "lucide-react";

const categories = [
  { id: "all", label: "All", icon: Grid3x3 },
  { id: "textbooks", label: "Textbooks", icon: Book },
  { id: "electronics", label: "Electronics", icon: Laptop },
  { id: "furniture", label: "Furniture", icon: Sofa },
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "sports", label: "Sports", icon: Dumbbell },
  { id: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
  { id: "decor", label: "Decor", icon: Sparkles },
];

export default function CategoryFilter({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selected === category.id;

        return (
          <Button
            key={category.id}
            onClick={() => onChange(category.id)}
            variant={isSelected ? "default" : "outline"}
            className={`flex-shrink-0 gap-2 rounded-full transition-all ${
              isSelected
                ? "bg-green-700 text-white hover:bg-green-800 shadow-lg shadow-green-200"
                : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {category.label}
          </Button>
        );
      })}
    </div>
  );
}


