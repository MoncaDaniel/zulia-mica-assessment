import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-slate-900 border border-slate-800 rounded-xl", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-slate-800", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn("px-6 py-4 border-t border-slate-800", className)}>
      {children}
    </div>
  );
}
