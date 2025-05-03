import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import PaymentSuccess from "@/components/PaymentSuccess";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse query parameters from the URL
    const searchParams = new URLSearchParams(window.location.search);
    const sessionIdParam = searchParams.get("sessionId");
    const paymentIdParam = searchParams.get("paymentId") || searchParams.get("txnId") || searchParams.get("razorpay_payment_id");
    
    if (!sessionIdParam) {
      setError("Missing session ID in URL");
      setLoading(false);
      return;
    }

    if (!paymentIdParam) {
      setError("Missing payment ID in URL");
      setLoading(false);
      return;
    }

    // Convert session ID to number
    const parsedSessionId = parseInt(sessionIdParam, 10);
    if (isNaN(parsedSessionId)) {
      setError("Invalid session ID");
      setLoading(false);
      return;
    }

    setSessionId(parsedSessionId);
    setPaymentId(paymentIdParam);
    setLoading(false);
  }, [location]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-green-500 mb-4" />
        <p className="text-green-600 dark:text-green-400 text-xl">Processing your payment...</p>
      </div>
    );
  }

  if (error || !sessionId || !paymentId) {
    return (
      <Card className="max-w-lg mx-auto mt-8 bg-gray-900 border-red-800/30">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Payment Information Error</h2>
            <p className="text-gray-300 mb-4">
              {error || "We couldn't retrieve your payment information. Please contact us for assistance."}
            </p>
            <div className="text-left mt-6 border-t border-gray-800 pt-4">
              <h3 className="text-lg font-medium text-green-400 mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Email:</span>
                  <a href="mailto:projects@bamboomade.in" className="text-green-400 hover:underline">
                    projects@bamboomade.in
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Phone:</span>
                  <a href="tel:+918971690163" className="text-green-400 hover:underline">
                    +91 8971690163
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">WhatsApp:</span>
                  <a href="https://wa.me/918971690163" className="text-green-400 hover:underline">
                    +91 8971690163
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-green-500">Payment Successful!</h1>
        <h2 className="text-xl mb-8 text-center text-gray-300">We will send your Google Meet link within 4 hours</h2>
        <PaymentSuccess paymentId={paymentId} sessionId={sessionId} />
      </div>
    </div>
  );
}