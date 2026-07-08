"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiChatbotApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isMedicalAdvice?: boolean;
  disclaimer?: string;
  systemData?: unknown;
}

interface ChatbotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatbotWidget({ isOpen, onClose }: ChatbotWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI của ClinicPro. Tôi có thể giúp gì cho bạn?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const payload: { message: string; conversationId?: string; userId?: string } = {
        message: userMessage.text,
      };
      if (conversationId) payload.conversationId = conversationId;
      if (user?.id) payload.userId = user.id;

      const { data } = await aiChatbotApi.chat(payload);
      // Expected response shapes documented by backend
      const aiText: string = data?.response ?? "";
      const aiConvId: string | undefined = data?.conversationId;
      const isMedical: boolean | undefined = data?.isMedicalAdvice;
      const disclaimer: string | undefined = data?.disclaimer;
      const systemData: unknown = data?.systemData;

      if (aiConvId && aiConvId !== conversationId) {
        setConversationId(aiConvId);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText || "(Không có phản hồi)",
        isUser: false,
        timestamp: new Date(data?.timestamp || Date.now()),
        isMedicalAdvice: isMedical,
        disclaimer,
        systemData,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, hiện không thể kết nối tới trợ lý AI. Vui lòng thử lại sau.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-26 right-6 z-50 w-[480px] h-[550px] animate-in slide-in-from-bottom-4 duration-300">
      <Card className="h-full py-0 gap-0  border-0 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center px-2.5 justify-between space-y-0 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#0D5E58] text-white">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div>Trợ lý AI ClinicPro</div>
              <div className="text-[9px] font-normal opacity-90">⚠️ Lưu ý: Thông tin tư vấn chỉ mang tính chất tham khảo</div>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 pt-1 flex flex-col h-full overflow-auto">
          <ScrollArea className="flex-1 px-3 ">
            <div className="space-y-6 pt-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!message.isUser && (
                    <div className="w-8 h-8 rounded-full  bg-[#0F766E] flex items-center justify-center flex-shrink-0 ">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ",
                      message.isUser
                        ? " bg-[#0F766E]  text-white"
                        : "bg-gray-50 text-gray-800 border border-gray-200"
                    )}
                  >
                   
                    <div>{message.text}</div>
                    {/* Disclaimer hidden as requested */}
                    {/* Hidden systemData from end users by request */}
                  </div>
                  {message.isUser && (
                    <div className="w-8 h-8 rounded-full  bg-[#134E4A]  flex items-center justify-center flex-shrink-0 ">
                     <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F766E] to-[#0D5E58] flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm border border-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-[#0F766E] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#0F766E] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-1.5 h-1.5 bg-[#0F766E] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn của bạn..."
                className="flex-1 rounded-xl border-gray-200 focus:border-[#0F766E] focus:ring-[#0F766E] bg-white "
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
                className=" bg-[#0F766E] hover:bg-[#0D5E58]  rounded-xl  transition-all duration-200"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

