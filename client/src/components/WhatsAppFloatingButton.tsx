import { MessageCircle } from "lucide-react";

const WhatsAppFloatingButton = () => {
  const phoneNumber = "918971690163";
  const message = "Hi, I'm interested in BambooMade services and would like to know more.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:scale-110"
      aria-label="Contact us on WhatsApp"
      data-testid="whatsapp-floating-button"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppFloatingButton;
