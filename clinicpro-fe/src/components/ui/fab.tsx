"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABProps {
  className?: string;
  onClick?: () => void;
}

export function FAB({ className, onClick }: FABProps) {
  const [showLabel, setShowLabel] = useState(true);

  // Ẩn label sau 8 giây hoặc khi người dùng click
  useEffect(() => {
    const timer = setTimeout(() => setShowLabel(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setShowLabel(false);
    onClick?.();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Label hướng dẫn */}
      {showLabel && (
        <div className="hidden sm:flex items-center gap-2 bg-white shadow-lg rounded-2xl px-4 py-2.5 border border-teal-200 animate-in slide-in-from-right-8 duration-500">
          <Sparkles className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Hỏi AI tư vấn sức khỏe
          </span>
          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
        </div>
      )}
      <Button
        onClick={handleClick}
        className={cn(
          "h-11 w-11 rounded-full shadow-2xl transition-all duration-300",
          "hover:scale-110 active:scale-95",
          "text-white border-0",
          "relative overflow-hidden",
          "bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500",
          className
        )}
        size="icon"
        title="Trợ lý AI ClinicPro - Hỏi đáp sức khỏe"
      >
        <MessageCircle className="h-6 w-6 relative z-10" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </Button>
    </div>
  );
}
