import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppContactProps {
  phoneNumber: string;
  message?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * WhatsApp contact button that opens WhatsApp with a predefined message
 */
const WhatsAppContact: React.FC<WhatsAppContactProps> = ({
  phoneNumber,
  message = "Hi, I'm interested in BambooMade services and would like to know more.",
  className = "",
  variant = "default",
  size = "default"
}) => {
  // Format phone number (remove any non-digit characters)
  const formattedPhone = phoneNumber.replace(/\D/g, "");
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  
  return (
    <Button
      variant={variant}
      size={size}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
      onClick={() => window.open(whatsappUrl, "_blank")}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Contact on WhatsApp
    </Button>
  );
};

export default WhatsAppContact;