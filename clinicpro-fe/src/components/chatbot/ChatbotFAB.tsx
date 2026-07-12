"use client";

import { useState } from "react";
import { FAB } from "@/components/ui/fab";
import { ChatbotWidget } from "./ChatbotWidget";

export function ChatbotFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <FAB onClick={handleToggle} />
      <ChatbotWidget isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
