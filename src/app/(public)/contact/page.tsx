import type { Metadata } from "next";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buildWhatsAppLink, demoMessage } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact — BISWARA ERP",
  description: "Contactez l'équipe BISWARA (MORA Shawiri).",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
        <p className="mt-4 text-muted-foreground">
          Une question, une démonstration ? Nous sommes à votre écoute.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="rounded-lg bg-biswara-blue/10 p-2.5 text-biswara-blue">
              <Phone className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Téléphone</p>
            <p className="text-sm text-muted-foreground">+269 430 63 06</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="rounded-lg bg-biswara-green/10 p-2.5 text-biswara-green">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">WhatsApp</p>
            <a
              href={buildWhatsAppLink(demoMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Écrire sur WhatsApp
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="rounded-lg bg-biswara-gold/10 p-2.5 text-biswara-gold-700">
              <Mail className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">E-mail</p>
            <p className="text-sm text-muted-foreground">contact@biswara.app</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 flex justify-center">
        <a href={buildWhatsAppLink(demoMessage())} target="_blank" rel="noopener noreferrer">
          <Button>Demander une démonstration</Button>
        </a>
      </div>
    </div>
  );
}
