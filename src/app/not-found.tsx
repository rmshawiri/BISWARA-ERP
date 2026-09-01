import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BiswaraLogo } from "@/components/brand/biswara-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <BiswaraLogo variant="dark" showSlogan />
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-muted-foreground">
        Cette page n'existe pas ou n'est plus disponible.
      </p>
      <Link href="/">
        <Button>Retour à l'accueil</Button>
      </Link>
    </div>
  );
}
