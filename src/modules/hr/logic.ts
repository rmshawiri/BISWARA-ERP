/**
 * Ressources Humaines — logique métier pure (testable).
 */

export interface LeaveRequest {
  entitlement: number; // jours acquis
  taken: number; // jours déjà pris
  requested: number; // jours demandés
}

export interface LeaveBalanceResult {
  available: number; // solde avant la demande
  remainingAfter: number; // solde après la demande
  overLimit: boolean;
}

/** Calcule le solde de congés et valide la demande. */
export function leaveBalance(req: LeaveRequest): LeaveBalanceResult {
  const entitlement = req.entitlement;
  const taken = req.taken;
  const requested = req.requested;
  const available = entitlement - taken;
  const remainingAfter = available - requested;
  return {
    available,
    remainingAfter,
    overLimit: requested > available,
  };
}

/** Statut de présence : présent / retard / absent selon l'heure d'arrivée. */
export function attendanceStatus(
  startHour: string,
  arrivalHour: string
): "present" | "late" | "absent" {
  const toMin = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return (hh || 0) * 60 + (mm || 0);
  };
  const start = toMin(startHour);
  const arrival = toMin(arrivalHour);
  if (arrival > start + 120) return "absent";
  if (arrival > start) return "late";
  return "present";
}
