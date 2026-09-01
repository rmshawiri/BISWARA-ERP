import "server-only";

import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { InvoiceDocument, type InvoiceDocProps } from "./invoice";
import { SalesDocument, type SalesDocProps } from "./sales-document";

/**
 * DOCUMENT ENGINE — génère un PDF depuis un modèle.
 * Tous les documents BISWARA passent par ce moteur unique
 * (aucun module ne doit créer son propre système de PDF).
 */
export async function generateInvoicePdf(
  props: InvoiceDocProps
): Promise<Buffer> {
  // Le modèle retourne un <Document> PDF ; le typage strict de renderToBuffer
  // attend un élément DocumentProps, d'où le cast (limitation documentée).
  const element = React.createElement(
    InvoiceDocument,
    props
  ) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

/** Génère le PDF d'un document commercial (devis/bon de commande/livraison/facture/avoir). */
export async function generateSalesDocumentPdf(
  props: SalesDocProps
): Promise<Buffer> {
  const element = React.createElement(
    SalesDocument,
    props
  ) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

export type { InvoiceDocProps } from "./invoice";
export type { SalesDocProps } from "./sales-document";
