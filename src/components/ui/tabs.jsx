import React from "react";

export function Tabs({ value, onValueChange, children }) {
  return (
    <div data-value={value} data-type="tabs">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { value, onValueChange })
          : child
      )}
    </div>
  );
}

export function TabsList({ className = "", children }) {
  return (
    <div
      className={`inline-flex rounded-full bg-gray-100 p-1 text-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  onValueChange,
  children,
  className = "",
  ...props
}) {
  const isActive = props.value === value;
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(props.value)}
      className={`mx-0.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        isActive
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:text-gray-900"
      } ${className}`}
    >
      {children}
    </button>
  );
}


