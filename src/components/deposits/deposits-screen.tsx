import { FileArchive } from "lucide-react";

import { ClinicPicker } from "@/components/deposits/clinic-picker";
import { DepositList, interruptedOf } from "@/components/deposits/deposit-list";
import { DepositWorkspace } from "@/components/deposits/deposit-uploader";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { type ClinicConsultation, clinicViewPath } from "@/lib/clinic-view";
import { listOrganizations } from "@/lib/data/admin";
import {
  type Deposit,
  getDepositLimits,
  listDeposits,
  listTeamDeposits,
} from "@/lib/data/deposits";
import { DEPOSIT_STATES } from "@/lib/deposits";
import { isDemoMode } from "@/lib/demo/mode";
import { type BarDimension, PERIODS } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { periodsOf } from "@/lib/filters/periods";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { hasFilters, readFilters } from "@/lib/filters/url";
import type { SearchParamsRecord } from "@/lib/pagination";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/**
 * Dépôts d'images : déposer une archive ZIP, et suivre ses dépôts.
 *
 * Chez le responsable (`/examens/depots`), l'envoi au nom de sa clinique
 * et « Mes dépôts ». Dans la console (`/admin/depots`), la clinique se
 * choisit d'abord (elle filtre aussi la liste), puis l'envoi part en son
 * nom ; la liste couvre tout le réseau. Dans la vue des cliniques
 * (`/admin/vue-clinique/{clinique}/examens/depots`), la clinique est celle
 * de l'écran : l'équipe y dépose en son nom, par ses propres routes, et la
 * liste est la sienne.
 *
 * La liste est filtrée sur la page, avec la barre commune : état,
 * période, et la clinique dans la console. Elle tient en 500 dépôts au plus.
 *
 * @param team         `true` pour l'équipe IMAFRIK (console ou vue des cliniques).
 * @param consultation Clinique consultée, dans la vue des cliniques.
 * @param params       Paramètres de l'adresse : filtres, clinique choisie.
 */
export async function DepositsScreen({
  team,
  consultation = null,
  params,
}: {
  team: boolean;
  consultation?: ClinicConsultation | null;
  params: SearchParamsRecord;
}) {
  const session = await requireSession();
  const { t, locale } = await getMessages();
  const text = t.deposits;
  // La console couvre le réseau ; la vue des cliniques, une clinique.
  const network = team && consultation === null;
  const [list, limits, organizations] = await Promise.all([
    team ? listTeamDeposits(consultation?.clinicId) : listDeposits(),
    getDepositLimits(team),
    network ? listOrganizations() : Promise.resolve([]),
  ]);
  const clinics = organizations
    .filter(
      (organization) => organization.kind === "clinic" && organization.active,
    )
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  const keys = network ? LIST_FILTERS["depots-equipe"] : LIST_FILTERS.depots;
  const known = network
    ? {
        clinic: [
          ...new Set([
            ...clinics.map((clinic) => clinic.id),
            ...list.deposits.map((deposit) => deposit.clinicId),
          ]),
        ],
      }
    : {};
  const filters = readFilters(params, keys, known);
  const values: RowValues<Deposit> = {
    clinic: (deposit) => [deposit.clinicId],
    depositState: (deposit) => [deposit.state],
    period: (deposit) => periodsOf(deposit.createdAt),
  };
  const rows = filterRows(list.deposits, values, filters);

  const clinic = consultation
    ? { id: consultation.clinicId, name: consultation.name }
    : team
      ? (clinics.find((item) => item.id === filters.clinic) ?? null)
      : {
          id: session.active.organizationId,
          name: session.active.organizationName,
        };
  // Une clinique suspendue ne reçoit plus d'examen : le service refuserait
  // le dépôt, l'écran le dit avant.
  const closed =
    consultation && !consultation.isActive ? text.uploader.clinicClosed : null;
  // La clinique choisie, ou celles qui ont des dépôts : de quoi filtrer.
  const filterClinics = new Map(
    list.deposits.map((deposit) => [deposit.clinicId, deposit.clinicName]),
  );
  if (clinic) filterClinics.set(clinic.id, clinic.name);
  const bar: BarDimension[] = [
    ...(network
      ? [
          {
            key: "clinic" as const,
            ...countOptions(
              list.deposits,
              values,
              filters,
              "clinic",
              [...filterClinics].map(([value, label]) => ({ value, label })),
            ),
          },
        ]
      : []),
    {
      key: "depositState",
      ...countOptions(
        list.deposits,
        values,
        filters,
        "depositState",
        DEPOSIT_STATES.map((value) => ({ value })),
      ),
    },
    {
      key: "period",
      ...countOptions(
        list.deposits,
        values,
        filters,
        "period",
        PERIODS.map((value) => ({ value })),
      ),
    },
  ];
  // Les envois interrompus de la clinique choisie : le même fichier les reprend.
  const interrupted = list.deposits
    .filter(
      (deposit) =>
        deposit.status === "uploading" && deposit.clinicId === clinic?.id,
    )
    .map(interruptedOf);
  const reportBase = consultation
    ? clinicViewPath(consultation.clinicId, "/examens/depots")
    : team
      ? "/admin/depots"
      : "/examens/depots";

  return (
    <>
      <PageHeader
        title={text.title}
        description={
          consultation
            ? text.clinicViewDescription(consultation.name)
            : team
              ? text.teamDescription
              : text.description(session.active.organizationName)
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 sm:px-6 [&>*]:shrink-0">
        <DepositWorkspace
          clinic={clinic}
          team={team}
          limits={limits}
          interrupted={interrupted}
          reportBase={reportBase}
          demo={isDemoMode()}
          closed={closed}
          clinicPicker={
            network ? (
              <ClinicPicker clinics={clinics} selected={clinic?.id ?? null} />
            ) : undefined
          }
        >
          <Panel className="overflow-hidden">
            <h2 className="label-eyebrow flex h-11 items-center gap-2 border-b border-border-subtle px-4">
              {consultation
                ? text.list.clinicViewTitle
                : team
                  ? text.list.teamTitle
                  : text.list.title}
            </h2>
            <FilterBar
              dimensions={bar}
              active={filters}
              result={{ count: rows.length, noun: "deposits" }}
              className="px-4 py-3"
            />
            {rows.length === 0 && hasFilters(filters) ? (
              <FilteredEmpty
                dimensions={bar}
                active={filters}
                noun="deposits"
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={FileArchive}
                title={
                  consultation
                    ? text.list.clinicViewEmpty
                    : team
                      ? text.list.teamEmpty
                      : text.list.empty
                }
                detail={text.list.emptyDetail}
              />
            ) : (
              <DepositList
                deposits={rows}
                t={t}
                locale={locale}
                reportBase={reportBase}
                team={team}
                showClinic={network}
              />
            )}
            {list.limited && (
              <p className="border-t border-border-subtle px-4 py-2 text-2xs text-tertiary">
                {text.list.limited}
              </p>
            )}
          </Panel>
        </DepositWorkspace>
      </div>
    </>
  );
}
