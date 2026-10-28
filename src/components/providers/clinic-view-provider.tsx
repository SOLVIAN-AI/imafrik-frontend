"use client";

import * as React from "react";

import { type ClinicConsultation, clinicHref } from "@/lib/clinic-view";

const ClinicViewContext = React.createContext<ClinicConsultation | null>(null);

/**
 * La clinique consultée par l'équipe IMAFRIK, pour les composants des
 * écrans du responsable.
 *
 * Posé par la disposition de la vue des cliniques ; absent chez le
 * responsable. Les composants partagés (liste des examens, tableau de
 * bord, comptes-rendus) y lisent où mènent leurs liens, au nom de quelle
 * clinique ils s'affichent, et quel portail attribue : celui de l'équipe.
 */
export function ClinicViewProvider({
  consultation,
  children,
}: {
  consultation: ClinicConsultation;
  children: React.ReactNode;
}) {
  return (
    <ClinicViewContext.Provider value={consultation}>
      {children}
    </ClinicViewContext.Provider>
  );
}

/** La clinique consultée, ou `null` chez son responsable. */
export function useClinicView(): ClinicConsultation | null {
  return React.useContext(ClinicViewContext);
}

/**
 * Adresse d'un écran du responsable, replacée sous la clinique consultée
 * dans la vue des cliniques.
 */
export function useClinicHref(): (path: string) => string {
  const consultation = useClinicView();
  return React.useCallback(
    (path: string) => clinicHref(consultation, path),
    [consultation],
  );
}
