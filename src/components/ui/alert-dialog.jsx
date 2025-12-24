import React from "react";

export function AlertDialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="relative min-w-[320px] max-w-md rounded-xl bg-white p-4 shadow-xl">
        {children}
        <button
          type="button"
          className="absolute right-3 top-2 text-sm text-gray-400"
          onClick={() => onOpenChange?.(false)}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function AlertDialogContent({ children }) {
  return <div>{children}</div>;
}

export function AlertDialogHeader({ children }) {
  return <div className="mb-3 space-y-1">{children}</div>;
}

export function AlertDialogTitle({ children }) {
  return <h2 className="text-lg font-semibold text-gray-900">{children}</h2>;
}

export function AlertDialogDescription({ children }) {
  return <p className="text-sm text-gray-600">{children}</p>;
}

export function AlertDialogFooter({ children }) {
  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
      {children}
    </div>
  );
}

export function AlertDialogCancel({ children, ...props }) {
  return (
    <button
      type="button"
      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}


