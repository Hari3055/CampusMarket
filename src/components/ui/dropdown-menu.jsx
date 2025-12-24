import React, { createContext, useContext, useState } from "react";

const DropdownContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children }) {
  const ctx = useContext(DropdownContext);
  const child = React.Children.only(children);

  const triggerProps = {
    onClick: (e) => {
      ctx.setOpen(!ctx.open);
      if (child.props.onClick) child.props.onClick(e);
    }
  };

  if (asChild) {
    return React.cloneElement(child, triggerProps);
  }
  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ className = "", align = "start", children }) {
  const ctx = useContext(DropdownContext);
  if (!ctx.open) return null;

  const alignClass = align === "end" ? "right-0" : "left-0";

  return (
    <div
      className={`absolute z-30 mt-2 min-w-[10rem] rounded-md border border-gray-200 bg-white shadow-lg ${alignClass} ${className}`}
    >
      <div className="py-1 text-sm text-gray-700">{children}</div>
    </div>
  );
}

export function DropdownMenuItem({ asChild, className = "", children, ...props }) {
  const base =
    "flex cursor-pointer select-none items-center px-3 py-1.5 text-sm hover:bg-gray-100";

  if (asChild) {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      className: `${base} ${className} ${child.props.className || ""}`,
      ...props
    });
  }

  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-200" />;
}


