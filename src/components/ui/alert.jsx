import React from "react";

export function Alert({ className = "", children, ...props }) {
  return (
    <div
      className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className = "", children, ...props }) {
  return (
    <div className={`font-semibold ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertDescription({ className = "", children, ...props }) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}


