import React from "react";

export function Avatar({ className = "", children, ...props }) {
  return (
    <div
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({ className = "", children, ...props }) {
  return (
    <span className={`flex h-full w-full items-center justify-center ${className}`} {...props}>
      {children}
    </span>
  );
}


