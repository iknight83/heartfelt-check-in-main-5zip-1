import { useEffect, useRef, useState } from "react";

interface PayPalButtonsDirectProps {
  clientId: string;
  plan: string;
  userId: string;
  onSuccess: (result: { plan: string }) => void;
  onError: (err: unknown) => void;
  onCancel: () => void;
}

const PayPalButtonsDirect = ({ clientId, plan, userId, onSuccess, onError, onCancel }: PayPalButtonsDirectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const buttonsInstanceRef = useRef<{ close: () => Promise<void> } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPayPal = async () => {
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        existingScript.remove();
        delete (window as any).paypal;
      }

      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
      script.async = true;

      script.onload = () => {
        if (cancelled || !containerRef.current) return;
        const paypalSdk = (window as any).paypal;
        if (!paypalSdk) return;
        setLoading(false);

        try {
          const buttons = paypalSdk.Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
              tagline: false,
            },
            createOrder: async () => {
              const res = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, plan }),
              });
              const data = await res.json();
              if (data.orderId) return data.orderId;
              throw new Error(data.message || "Failed to create order");
            },
            onApprove: async (data: { orderID: string }) => {
              try {
                const res = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.orderID }),
                });
                const result = await res.json();
                if (result.success) {
                  onSuccess({ plan: result.plan });
                } else {
                  onError(new Error(result.message || "Payment could not be verified"));
                }
              } catch (err) {
                onError(err);
              }
            },
            onError: (err: unknown) => {
              onError(err);
            },
            onCancel: () => {
              onCancel();
            },
          });

          buttonsInstanceRef.current = buttons;
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
            buttons.render(containerRef.current);
          }
        } catch (err) {
          setError("Failed to initialize payment buttons");
          console.error("PayPal render error:", err);
        }
      };

      script.onerror = () => {
        if (!cancelled) {
          setLoading(false);
          setError("Failed to load payment system. Please try again.");
        }
      };

      document.body.appendChild(script);
    };

    loadPayPal();

    return () => {
      cancelled = true;
      if (buttonsInstanceRef.current) {
        try { buttonsInstanceRef.current.close(); } catch {}
      }
    };
  }, [clientId, plan, userId]);

  if (error) {
    return <p className="text-red-400 text-sm text-center py-4">{error}</p>;
  }

  return (
    <div>
      {loading && (
        <div className="flex flex-col items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading payment options...</p>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
};

export default PayPalButtonsDirect;
