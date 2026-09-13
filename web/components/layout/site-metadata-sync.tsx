"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useSiteName } from "@/hooks/use-site-name";
import displayCopy from "@/lib/config/display-copy.json";

function replaceSiteName(value: string, previousName: string, siteName: string) {
  if (value.includes(siteName)) return value;
  if (value.includes(previousName)) return value.replaceAll(previousName, siteName);
  if (value.includes(displayCopy.siteName)) return value.replaceAll(displayCopy.siteName, siteName);
  return value;
}

export function SiteMetadataSync() {
  const pathname = usePathname();
  const siteName = useSiteName();
  const previousName = useRef(displayCopy.siteName);

  useEffect(() => {
    const from = previousName.current;
    const apply = () => {
      const nextTitle = replaceSiteName(document.title, from, siteName);
      if (nextTitle !== document.title) document.title = nextTitle;

      for (const selector of ['meta[property="og:site_name"]', 'meta[property="og:title"]']) {
        for (const element of document.head.querySelectorAll<HTMLMetaElement>(selector)) {
          const nextContent = replaceSiteName(element.content, from, siteName);
          if (nextContent !== element.content) element.content = nextContent;
        }
      }
    };

    apply();
    previousName.current = siteName;

    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      attributes: true,
      attributeFilter: ["content"],
      childList: true,
      characterData: true,
      subtree: true,
    });
    const timer = window.setTimeout(apply, 0);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname, siteName]);

  return null;
}
