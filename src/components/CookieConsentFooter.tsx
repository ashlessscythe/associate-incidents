import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  hasCookieConsentChoice,
  setCookieConsentChoice,
} from "@/lib/cookieConsent";

const CookieConsentFooter: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsentChoice());
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.style.paddingBottom = "5.5rem";
    } else {
      document.body.style.paddingBottom = "";
    }
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  const acceptNecessary = () => {
    setCookieConsentChoice("necessary");
    setVisible(false);
  };

  const acceptAll = () => {
    setCookieConsentChoice("all");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <footer
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm shadow-lg"
    >
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-muted-foreground sm:max-w-2xl">
          We use local storage for sign-in sessions and your theme preference.
          These are required for the app to work. We do not use advertising or
          third-party tracking cookies. Choose how you want to proceed.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" size="sm" onClick={acceptNecessary}>
            Allow necessary
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Don&apos;t care
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default CookieConsentFooter;
