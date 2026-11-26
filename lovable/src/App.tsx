import { useEffect } from "react";

// Which version opens at "/". The V1 · V2 · V3 switch at the bottom of each homepage moves between them.
//   "/site.html" = V1   "/site-v2.html" = V2   "/site-v3.html" = V3
export const HOME = "/site.html";

export default function App() {
  useEffect(() => {
    window.location.replace(HOME + window.location.search + window.location.hash);
  }, []);
  return null;
}
