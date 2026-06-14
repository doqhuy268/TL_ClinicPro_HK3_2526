"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABProps {
  className?: string;
  onClick?: () => void;
}

export function FAB({ className, onClick }: FABProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onClick}
        className={cn(
          "h-11 w-11 rounded-full shadow-2xl  transition-all duration-300",
          "hover:scale-110 active:scale-95",
          "text-white border-0",
          "relative overflow-hidden ",
          className
        )}
        size="icon"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0  transition-opacity  rounded-full" />
        <MessageCircle className="h-6 w-6 relative z-10" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#134E4A] rounded-full flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white " />
        </div>
      </Button>
    </div>
  );
}
