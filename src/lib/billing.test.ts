import { describe, expect, it } from "vitest";

import { SUBSCRIPTIONS, TECHNICAL_FEES } from "@/content/marketing/pricing";
import { en } from "@/i18n/messages/en";
import { fr } from "@/i18n/messages/fr";
import {
  type Statement,
  statementCsvRows,
  sumStatements,
  toBillingMonth,
  toMonthActivity,
  toStatement,
} from "@/lib/billing";
import {
  demoBillingMonth,
  demoClinicPlan,
  demoMonthActivity,
  demoStatement,
} from "@/lib/demo/billing";
import { DEMO_NETWORK } from "@/lib/demo/control";
import { demoPerformance } from "@/lib/demo/performance";
import { toPerformanceMonth } from "@/lib/performance";

/** 28 octobre 2026, 9 h UTC : octobre est ouvert, septembre clos le 3 octobre. */
const NOW = Date.UTC(2026, 9, 28, 9);
const STJ = DEMO_NETWORK[0].id;

const STATEMENT: Statement = {
  clinicId: "c1",
  clinic: "Clinique A",
  month: "2026-09",
  closedAt: new Date("2026-10-03T08:00:00Z"),
  plan: "pro",
  subscription: 25_000,
  lines: [
    {
      feeClass: "radiography",
      routine: 2,
      urgent: 1,
      routineFee: 300,
      urgentFee: 600,
      amount: 1_200,
    },
    {
      feeClass: "ct",
      routine: 1,
      urgent: 0,
      routineFee: 2_500,
      urgentFee: 3_000,
      amount: 2_500,
    },
  ],
  outOfGrid: [{ group: "ultrasound", routine: 2, urgent: 0 }],
  acts: 4,
  unreported: 1,
  radiologists: [{ id: "r1", name: "Dr Afi Mensah", routine: 3, urgent: 1 }],
  technicalTotal: 3_700,
  total: 28_700,
};

describe("export CSV d'un relevé", () => {
  it("écrit l'abonnement, les forfaits, le hors grille, le non facturé, les honoraires et le total", () => {
    const rows = statementCsvRows(
      STATEMENT,
      fr.clinic.activity.billing,
      fr.assignment.modalities,
    );
    expect(rows).toEqual([
      ["2026-09", "Abonnement", "Formule Pro", null, null, null, null, 25000],
      ["2026-09", "Forfait technique", "Radiographie", 3, 1, 300, 600, 1200],
      ["2026-09", "Forfait technique", "Scanner", 1, 0, 2500, 3000, 2500],
      ["2026-09", "Hors grille", "Échographie", 2, 0, null, null, null],
      [
        "2026-09",
        "Non facturé",
        "Sans compte-rendu signé",
        1,
        null,
        null,
        null,
        null,
      ],
      ["2026-09", "Honoraires", "Dr Afi Mensah", 4, 1, null, null, null],
      ["2026-09", "Total", null, 4, null, null, null, 28700],
    ]);
    // Une ligne par intitulé de colonne.
    for (const row of rows) {
      expect(row).toHaveLength(fr.clinic.activity.billing.csvHeaders.length);
    }
  });

  it("dit l'absence de formule, sans montant d'abonnement ni total", () => {
    const rows = statementCsvRows(
      { ...STATEMENT, plan: null, subscription: null, total: null },
      en.clinic.activity.billing,
      en.assignment.modalities,
    );
    expect(rows[0]).toEqual([
      "2026-09",
      "Subscription",
      "Plan not set",
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(rows.at(-1)?.at(-1)).toBeNull();
  });

  it("préfixe chaque ligne de la clinique pour l'export de l'équipe", () => {
    const rows = statementCsvRows(
      STATEMENT,
      fr.clinic.activity.billing,
      fr.assignment.modalities,
      true,
    );
    for (const row of rows) {
      expect(row.slice(0, 2)).toEqual(["2026-09", "Clinique A"]);
      expect(row).toHaveLength(fr.admin.billing.csvHeaders.length);
    }
  });
});

describe("totaux d'un mois", () => {
  it("additionne les relevés et compte les cliniques sans formule", () => {
    expect(
      sumStatements([
        STATEMENT,
        { ...STATEMENT, plan: null, subscription: null, total: null },
      ]),
    ).toEqual({
      acts: 8,
      unreported: 2,
      technical: 7_400,
      total: 28_700,
      missingPlans: 1,
    });
  });
});

describe("relevés de démonstration", () => {
  it("chiffre chaque acte au tarif de base de la grille publiée", () => {
    const statement = toStatement(demoStatement(STJ, "2026-10", NOW));
    expect(statement.lines.length).toBeGreaterThan(0);
    for (const line of statement.lines) {
      const fee = {
        radiography: TECHNICAL_FEES.radiography,
        ct: TECHNICAL_FEES.ct,
        mri: TECHNICAL_FEES.mri,
      }[line.feeClass as "radiography" | "ct" | "mri"];
      expect(fee).toBeDefined();
      expect([line.routineFee, line.urgentFee]).toEqual([
        fee.normal,
        fee.urgent,
      ]);
      expect(line.amount).toBe(
        line.routine * line.routineFee + line.urgent * line.urgentFee,
      );
    }
    expect(statement.technicalTotal).toBe(
      statement.lines.reduce((sum, line) => sum + line.amount, 0),
    );
    expect(statement.subscription).toBe(SUBSCRIPTIONS.pro.monthly);
    expect(statement.total).toBe(
      SUBSCRIPTIONS.pro.monthly + statement.technicalTotal,
    );
    expect(statement.closedAt).toBeNull();
  });

  it("compte les mêmes examens que l'activité, et montre le même relevé à l'équipe", () => {
    const activity = toMonthActivity(demoMonthActivity(STJ, "2026-09", NOW));
    const statement = toStatement(demoStatement(STJ, "2026-09", NOW));
    const outOfGrid = statement.outOfGrid.reduce(
      (sum, row) => sum + row.routine + row.urgent,
      0,
    );
    expect(statement.acts + outOfGrid + statement.unreported).toBe(
      activity.received,
    );
    expect(activity.signed).toBe(statement.acts + outOfGrid);
    // Les actes signés par radiologue sont ceux des performances du mois.
    const performance = toPerformanceMonth(
      demoPerformance("2026-09", STJ, NOW),
    );
    expect(
      performance.radiologists.reduce(
        (sum, row) => sum + row.signedRoutine + row.signedUrgent,
        0,
      ),
    ).toBe(activity.signed);
    expect(
      Object.fromEntries(
        statement.radiologists.map((row) => [
          row.name,
          row.routine + row.urgent,
        ]),
      ),
    ).toEqual(
      Object.fromEntries(
        performance.radiologists.map((row) => [
          row.name,
          row.signedRoutine + row.signedUrgent,
        ]),
      ),
    );

    const month = toBillingMonth(demoBillingMonth("2026-09", NOW));
    expect(month.closedAt).toEqual(new Date("2026-10-03T08:00:00Z"));
    expect(month.closable).toBe(false);
    expect(month.statements.find((row) => row.clinicId === STJ)).toEqual(
      statement,
    );
  });

  it("laisse le mois en cours ouvert et un mois fini à clore", () => {
    expect(demoBillingMonth("2026-10", NOW).closable).toBe(false);
    const justOver = Date.UTC(2026, 10, 1, 9);
    const october = demoBillingMonth("2026-10", justOver);
    expect([october.closed_at, october.closable]).toEqual([null, true]);
  });

  it("n'a pas de formule pour toutes les cliniques", () => {
    expect(demoClinicPlan(STJ)?.plan).toBe("pro");
    expect(demoClinicPlan("org-lum")).toBeNull();
    const month = demoBillingMonth("2026-10", NOW);
    expect(sumStatements(month.statements.map(toStatement)).missingPlans).toBe(
      month.statements.filter((row) => row.plan === null).length,
    );
  });
});
