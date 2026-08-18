import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

export const metadata = legalMetadata(
  "Mentions légales",
  "Éditeur, directeur de publication, hébergeur et contact du service IMAFRIK.",
);

/**
 * Mentions légales.
 *
 * ⚠️ **Projet, à faire relire par un conseil avant mise en ligne.** Les
 * mentions entre crochets sont des faits que seul l’éditeur connaît —
 * numéro d’immatriculation, adresse du siège, coordonnées de
 * l’hébergeur. Elles sont laissées visibles à dessein : une page légale
 * incomplète mise en ligne par inadvertance est un risque, un crochet
 * dans le texte se remarque au premier coup d’œil.
 */
export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="18 août 2026">
      <h2>Éditeur du service</h2>
      <p>
        Le service IMAFRIK est édité par <strong>SOLVIAN AI LLC</strong>,
        société de droit [forme juridique et État d’immatriculation],
        immatriculée sous le numéro [numéro d’immatriculation], dont le siège
        est situé [adresse complète du siège].
      </p>
      <ul>
        <li>Représentant légal : [nom et qualité]</li>
        <li>Directeur de la publication : [nom]</li>
        <li>
          Contact : <a href="mailto:contact@imafrik.com">contact@imafrik.com</a>
        </li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        L’application est hébergée par [nom de l’hébergeur applicatif], [adresse].
        Les images médicales et les données associées sont hébergées par
        [nom de l’hébergeur de données], sur des infrastructures situées dans
        l’Union européenne. La liste à jour des sous-traitants figure dans
        l’annexe de traitement des données annexée au contrat de service.
      </p>

      <h2>Nature du service</h2>
      <p>
        IMAFRIK est une plateforme technique de transmission d’examens
        d’imagerie médicale et de production de comptes-rendus. Les
        interprétations sont réalisées par des médecins radiologues
        indépendants, inscrits à un ordre professionnel, seuls responsables du
        contenu médical des documents qu’ils signent. IMAFRIK n’exerce aucune
        activité de soins et ne se substitue pas au médecin prescripteur.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments composant le service — code, interface,
        marques, documentation — demeure la propriété de SOLVIAN AI LLC ou de
        ses concédants. Les examens transmis et les comptes-rendus produits
        restent la propriété de l’établissement client et de ses patients,
        dans les conditions prévues au contrat.
      </p>

      <h2>Signalement</h2>
      <p>
        Tout contenu manifestement illicite ou tout dysfonctionnement peut
        être signalé à{" "}
        <a href="mailto:contact@imafrik.com">contact@imafrik.com</a>. Les
        incidents de sécurité relèvent de la procédure décrite dans l’annexe de
        traitement des données.
      </p>
    </LegalPage>
  );
}
