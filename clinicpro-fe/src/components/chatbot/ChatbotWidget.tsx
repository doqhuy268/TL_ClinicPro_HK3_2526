"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot, User, Stethoscope, Calendar, Pill, HelpCircle, Sparkles } from "lucide-react";
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

// Các câu hỏi gợi ý cho người dùng mới — có thể click để gửi ngay
const WELCOME_SUGGESTIONS = [
  { icon: Stethoscope, label: "Tư vấn triệu chứng", text: "Tôi bị đau đầu và chóng mặt, nên đi khám khoa nào?" },
  { icon: Calendar, label: "Đặt lịch khám", text: "Tôi muốn đặt lịch khám tổng quát thì làm thế nào?" },
  { icon: Pill, label: "Hỏi về thuốc", text: "Uống thuốc kháng sinh cần lưu ý những gì?" },
  { icon: HelpCircle, label: "Sức khỏe tổng quát", text: "Cho tôi 5 lời khuyên để sống khỏe mỗi ngày" },
];

// Câu hỏi follow-up xuất hiện sau khi AI đã trả lời
const FOLLOW_UP_SUGGESTIONS = [
  "Tôi cần chuẩn bị gì trước khi đi khám?",
  "Phòng khám có bác sĩ chuyên khoa này không?",
  "Chi phí khám khoảng bao nhiêu?",
];

export function ChatbotWidget({ isOpen, onClose }: ChatbotWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! 👋 Tôi là **Trợ lý AI y tế** của ClinicPro. Tôi có thể giúp bạn:\n\n🩺 Tư vấn triệu chứng & gợi ý chuyên khoa phù hợp\n📅 Hướng dẫn đặt lịch khám & thông tin dịch vụ\n💊 Giải đáp thắc mắc về thuốc & cách dùng\n❤️ Tư vấn lối sống lành mạnh & phòng bệnh\n\n⚠️ *Tôi không chẩn đoán bệnh — hãy gặp bác sĩ để được thăm khám chính xác.*\n\n👉 Chọn một câu hỏi gợi ý bên dưới hoặc nhập câu hỏi của bạn nhé!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [showSuggestions, setShowSuggestions] = useState(true);
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

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowSuggestions(false);
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

  const handleSuggestionClick = (text: string) => {
    handleSendMessage(text);
  };

  if (!isOpen) return null;

  const isFirstMessage = messages.length === 1 && messages[0].id === "welcome";

  return (
    <div className="fixed bottom-26 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[550px] animate-in slide-in-from-bottom-4 duration-300">
      <Card className="h-full py-0 gap-0  border-0 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center px-3 justify-between space-y-0 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                Trợ lý AI Y tế
                <span className="inline-flex items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                  Online
                </span>
              </div>
              <div className="text-[9px] font-normal opacity-80">Tư vấn sức khỏe • Không chẩn đoán bệnh</div>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
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
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-teal-700" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      message.isUser
                        ? "bg-teal-600 text-white rounded-br-md"
                        : "bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-md"
                    )}
                  >
                    <div className="whitespace-pre-line">
                      {message.text.split('\n').map((line, i) => {
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <span key={i}>
                            {parts.map((part, j) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j}>{part.slice(2, -2)}</strong>;
                              }
                              return <span key={j}>{part}</span>;
                            })}
                            {i < message.text.split('\n').length - 1 && <br />}
                          </span>
                        );
                      })}
                    </div>
                    {message.disclaimer && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-amber-600 flex items-start gap-1">
                        <span>⚠️</span>
                        <span>{message.disclaimer}</span>
                      </div>
                    )}
                  </div>
                  {message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-teal-700" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestion Chips — hiển thị khi chưa có tin nhắn nào từ user */}
          {showSuggestions && isFirstMessage && (
            <div className="px-3 pb-2">
              <p className="text-[11px] text-gray-400 mb-2 px-1">💡 Chọn câu hỏi gợi ý:</p>
              <div className="flex flex-wrap gap-2">
                {WELCOME_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    disabled={isTyping}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <suggestion.icon className="h-3.5 w-3.5 text-teal-500" />
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up suggestions — xuất hiện sau khi AI đã trả lời */}
          {!isFirstMessage && !isTyping && messages.length >= 2 && (
            <div className="px-3 pb-2">
              <p className="text-[11px] text-gray-400 mb-2 px-1">Bạn có thể hỏi thêm:</p>
              <div className="flex flex-wrap gap-1.5">
                {FOLLOW_UP_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isTyping}
                    className="inline-flex items-center px-2.5 py-1.5 bg-gray-50 border border-gray-150 rounded-full text-[11px] text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi sức khỏe của bạn..."
                className="flex-1 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 bg-white text-sm h-10"
                disabled={isTyping}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
                className="h-10 w-10 bg-teal-600 hover:bg-teal-700 rounded-xl transition-all duration-200 shadow-sm"
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

