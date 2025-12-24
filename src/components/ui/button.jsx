import React from "react";

const baseClasses =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  default: "bg-green-700 text-white hover:bg-green-800",
  outline:
    "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700"
};

const sizes = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  lg: "h-12 px-6",
  icon: "h-9 w-9"
};

export const Button = React.forwardRef(
  (
    { className = "", variant = "default", size = "md", children, ...props },
    ref
  ) => {
    const v = variants[variant] || variants.default;
    const s = sizes[size] || sizes.md;
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${v} ${s} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";


