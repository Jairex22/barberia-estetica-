import { SiteProvider } from "./context/SiteContext";
import { PublicSite } from "./PublicSite";
import { PrivacyPage } from "./pages/PrivacyPage";
import { AdminApp } from "./admin/AdminApp";

export function App() {
  const path = window.location.pathname;

  if (path.startsWith("/admin")) {
    return <AdminApp />;
  }

  return (
    <SiteProvider>
      {path.startsWith("/privacidad") ? <PrivacyPage /> : <PublicSite />}
    </SiteProvider>
  );
}
