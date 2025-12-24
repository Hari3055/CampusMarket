import React, { useState } from "react";

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <div className="relative">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              value,
              onValueChange,
              open,
              setOpen,
              toggle
            })
          : child
      )}
    </div>
  );
}

export function SelectTrigger({
  className = "",
  children,
  toggle,
  ...props
}) {
  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder, value, children }) {
  return (
    <span className="truncate text-gray-700">
      {children || value || (
        <span className="text-gray-400">{placeholder}</span>
      )}
    </span>
  );
}

export function SelectContent({ open, setOpen, children }) {
  if (!open) return null;
  return (
    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              close: () => setOpen(false)
            })
          : child
      )}
    </div>
  );
}

export function SelectItem({ value, onValueChange, close, children }) {
  return (
    <div
      className="flex cursor-pointer items-center px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      onClick={() => {
        onValueChange?.(value);
        close?.();
      }}
    >
      {children}
    </div>
  );
}


