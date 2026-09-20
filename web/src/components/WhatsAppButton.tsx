export function WhatsAppButton({ whatsapp, businessName }: { whatsapp: string; businessName: string }) {
  if (!whatsapp) return null;
  const link = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, quiero más información.")}`;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label={`Escribir a ${businessName} por WhatsApp`}
    >
      <span aria-hidden="true">💬</span>
    </a>
  );
}
