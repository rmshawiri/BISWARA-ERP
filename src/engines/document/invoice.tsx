import "server-only";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ------------------------------------------------------------
// Modèle PDF facture — identité visuelle BISWARA (charte)
// ------------------------------------------------------------
const brand = {
  blue: "#003366",
  gold: "#FFD700",
  green: "#00A859",
  gray: "#6b7280",
  light: "#F2F2F2",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  company: { fontSize: 16, fontWeight: "bold", color: brand.blue },
  companyMeta: { fontSize: 8, color: brand.gray, marginTop: 4 },
  docTitle: { fontSize: 22, fontWeight: "bold", color: brand.blue },
  docType: { fontSize: 9, color: brand.gray, textAlign: "right" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  blockTitle: { fontSize: 8, textTransform: "uppercase", color: brand.gray },
  blockValue: { fontSize: 11, marginTop: 4 },
  table: { marginTop: 12 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: brand.blue,
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeadCell: { fontSize: 8, fontWeight: "bold", flex: 1 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: brand.light,
  },
  tableCell: { fontSize: 9, flex: 1 },
  totals: { marginTop: 16, right: 0, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end" },
  totalLabel: { fontSize: 9, color: brand.gray, marginRight: 12 },
  totalValue: { fontSize: 9, width: 90, textAlign: "right" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: brand.gold,
  },
  grandLabel: { fontSize: 11, fontWeight: "bold", marginRight: 12 },
  grandValue: { fontSize: 11, fontWeight: "bold", width: 90, textAlign: "right", color: brand.green },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    color: brand.gray,
    fontSize: 8,
  },
});

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface InvoiceDocProps {
  docNumber: string;
  date: string;
  dueDate?: string | null;
  customer: { company?: string | null; name: string; address?: string | null };
  company: { name: string; address?: string | null; phone?: string | null; email?: string | null; nif?: string | null };
  lines: InvoiceLine[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string | null;
  logoUrl?: string | null;
}

export function InvoiceDocument(props: InvoiceDocProps) {
  const { company, customer, lines } = props;
  return (
    <Document
      title={`Facture ${props.docNumber}`}
      author="BISWARA"
      creator="BISWARA ERP OS"
    >
      <Page size="A4" style={styles.page}>
        {/* En-tête : entreprise + titre doc */}
        <View style={styles.header}>
          <View>
            {props.logoUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text -- Image est un composant react-pdf (pas un <img> HTML)
              <Image src={props.logoUrl} style={{ width: 48, height: 48 }} />
            )}
            <Text style={styles.company}>{company.name}</Text>
            <Text style={styles.companyMeta}>
              {company.address} {company.phone && `· ${company.phone}`}{" "}
              {company.email && `· ${company.email}`}
              {company.nif && ` · NIF ${company.nif}`}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>FACTURE</Text>
            <Text style={styles.docType}>N° {props.docNumber}</Text>
            <Text style={styles.docType}>Date : {props.date}</Text>
            {props.dueDate && <Text style={styles.docType}>Échéance : {props.dueDate}</Text>}
          </View>
        </View>

        {/* Client */}
        <View style={styles.sectionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockTitle}>Facturé à</Text>
            <Text style={styles.blockValue}>
              {customer.company ? `${customer.company} — ${customer.name}` : customer.name}
            </Text>
            {customer.address && <Text style={styles.blockValue}>{customer.address}</Text>}
          </View>
          <View style={{ width: 200 }} />
        </View>

        {/* Lignes */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.tableHeadCell}>Désignation</Text>
            <Text style={[styles.tableHeadCell, { flex: 0.5 }]}>Qté</Text>
            <Text style={[styles.tableHeadCell, { flex: 0.8 }]}>PU HT</Text>
            <Text style={[styles.tableHeadCell, { flex: 0.8 }]}>TVA</Text>
            <Text style={[styles.tableHeadCell, { flex: 1 }]}>Total</Text>
          </View>
          {lines.map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{l.description}</Text>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>{l.quantity}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{l.unitPrice.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{l.taxRate}%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{l.lineTotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{props.subtotal.toFixed(2)} {props.currency}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Remise</Text>
            <Text style={styles.totalValue}>- {props.discount.toFixed(2)} {props.currency}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TVA</Text>
            <Text style={styles.totalValue}>{props.taxTotal.toFixed(2)} {props.currency}</Text>
          </View>
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total TTC</Text>
            <Text style={styles.grandValue}>{props.total.toFixed(2)} {props.currency}</Text>
          </View>
        </View>

        {props.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.blockTitle}>Notes</Text>
            <Text style={{ fontSize: 9, color: brand.gray, marginTop: 4 }}>{props.notes}</Text>
          </View>
        )}

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>{company.name}</Text>
          <Text>Document généré par BISWARA ERP OS</Text>
          <Text>{props.docNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
