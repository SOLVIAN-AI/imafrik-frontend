import {
  Building2,
  FileLock2,
  History,
  KeyRound,
  RefreshCcw,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

/**
 * Ce que la page doit établir, dans l'ordre où on le vérifie.
 *
 * L'ordre n'est pas thématique mais chronologique : on suit la donnée —
 * elle arrive, elle est rangée, elle est consultée, elle est conservée,
 * puis rendue ou supprimée. Un directeur d'établissement vérifie dans cet
 * ordre parce que c'est celui de sa responsabilité.
 */
const CHAPTERS = [
  {
    icon: FileLock2,
    title: "En transit",
    detail:
      "Les envois DICOM et toutes les requêtes du portail passent par des canaux chiffrés. Aucun examen ne circule en clair, y compris entre nos propres services.",
  },
  {
    icon: KeyRound,
    title: "Au repos",
    detail:
      "Les images sont chiffrées côté serveur dans un stockage objet dédié, distinct de la base de données. Un accès à l’un ne donne pas accès à l’autre.",
  },
  {
    icon: Users,
    title: "Cloisonnement",
    detail:
      "Chaque organisation ne voit que ses examens. L’isolation est appliquée par la base elle-même, à chaque requête, et non par le code applicatif : une erreur de programmation ne peut pas l’ouvrir.",
  },
  {
    icon: ScrollText,
    title: "Traçabilité",
    detail:
      "Ouverture d’un examen, consultation d’images, rédaction, signature, téléchargement : chaque geste est horodaté et rattaché à une personne nommée, dans un journal que personne ne peut modifier depuis l’application.",
  },
  {
    icon: Building2,
    title: "Hébergement",
    detail:
      "Images et index hébergés dans l’Union européenne. La localisation figure au contrat et ne change pas sans avenant.",
  },
  {
    icon: History,
    title: "Conservation",
    detail:
      "La durée de conservation est fixée au contrat. À son terme, les examens sont supprimés du stockage actif et des sauvegardes selon un calendrier écrit.",
  },
  {
    icon: RefreshCcw,
    title: "Réversibilité",
    detail:
      "L’établissement peut demander à tout moment l’export de ses examens et de ses comptes-rendus, au format DICOM et PDF. Ses données lui appartiennent.",
  },
  {
    icon: ShieldAlert,
    title: "Incidents",
    detail:
      "En cas de violation de données, l’établissement est informé sans délai injustifié, avec la nature de l’incident, les données concernées et les mesures prises.",
  },
] as const;

export const metadata: Metadata = {
  title: "Sécurité et conformité",
  description:
    "Chiffrement, cloisonnement par établissement, journal d’accès, hébergement européen, réversibilité : les garanties d’IMAFRIK sur les données de santé.",
  robots: { index: true, follow: true },
};

/**
 * Page « sécurité et conformité ».
 *
 * **Elle s'adresse à un décideur, pas à un ingénieur.** Chaque garantie
 * est formulée par ce qu'elle empêche, pas par la technologie qui la
 * met en œuvre — « une erreur de programmation ne peut pas ouvrir le
 * cloisonnement » dit quelque chose ; « politiques RLS PostgreSQL » ne
 * dit rien à qui signe le contrat.
 */
export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="max-w-2xl">
        <p className="label-eyebrow text-accent">Sécurité</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
          Ce que nous garantissons sur vos données
        </h1>
        <p className="mt-5 text-base leading-relaxed text-secondary">
          Confier les examens de ses patients à un tiers engage la
          responsabilité de l’établissement. Cette page dit précisément ce qu’il
          advient d’une image entre le moment où elle quitte votre console et
          celui où elle est supprimée.
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2">
        {CHAPTERS.map((chapter) => (
          <section key={chapter.title} className="bg-surface-raised p-7">
            <chapter.icon className="size-5 text-accent" aria-hidden />
            <h2 className="mt-4 text-base font-semibold">{chapter.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {chapter.detail}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-14 rounded-2xl border border-border-subtle bg-surface-raised p-8">
        <h2 className="text-lg font-semibold">Vos obligations, les nôtres</h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary">
          L’établissement reste responsable du traitement des données de ses
          patients ; IMAFRIK agit comme sous-traitant, sur instruction et dans
          le cadre défini au contrat. Cette répartition, les mesures de sécurité
          et la liste des sous-traitants ultérieurs figurent dans une annexe de
          traitement des données, jointe à toute proposition.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-secondary">
          Aucun examen n’est utilisé à d’autres fins que la production du
          compte-rendu demandé : ni entraînement de modèle, ni statistique
          nominative, ni transmission à un tiers non prévu au contrat.
        </p>
      </section>
    </div>
  );
}
