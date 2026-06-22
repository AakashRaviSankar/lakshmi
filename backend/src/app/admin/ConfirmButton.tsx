"use client";

import React from "react";

interface ConfirmButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
  children: React.ReactNode;
}

export function ConfirmButton({
  message = "Are you sure you want to perform this action?",
  children,
  type = "submit",
  onClick,
  ...props
}: ConfirmButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(message)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button type={type} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
