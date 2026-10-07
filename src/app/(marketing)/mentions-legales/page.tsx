import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";
import {
  LEGAL_UPDATED_AT,
  PUBLISHER,
  SUBPROCESSORS,
  missingLegalFacts,
} from "@/lib/legal";

export const metadata = legalMetadata(
  "Mentions légales",
  "Éditeur, directeur de publication, hébergeurs et contact du service IMAFRIK.",
);

/**
 * Mentions légales.
 *
 * ⚠️ **À faire relire par un conseil avant mise en ligne.** Les faits de
 * l'éditeur viennent de `lib/legal.ts` : ceux qui ne sont pas encore
 * fournis sont omis, et un avis sobre le dit — jamais un « [à compléter] »
 * affiché au public. `missingLegalFacts()` liste ce qui manque.
 */
export default function LegalNoticePage() {
  const missing = missingLegalFacts();
  const hosts = SUBPROCESSORS.filter((processor) => processor.address);

  return (
    <LegalPage title="Mentions légales" updatedAt={LEGAL_UPDATED_AT}>
      <h2>Éditeur du service</h2>
      <p>
        Le service IMAFRIK est édité par <strong>{PUBLISHER.name}</strong>
        {PUBLISHER.legalForm && <>, {PUBLISHER.legalForm}</>}
        {PUBLISHER.registration && (
          <>, immatriculée sous le numéro {PUBLISHER.registration}</>
        )}
        {PUBLISHER.address && (
          <>, dont le siège est situé {PUBLISHER.address}</>
        )}
        .
      </p>
      <ul>
        {PUBLISHER.representative && (
          <li>Représentant légal : {PUBLISHER.representative}</li>
        )}
        {PUBLISHER.publicationDirector && (
          <li>Directeur de la publication : {PUBLISHER.publicationDirector}</li>
        )}
        <li>
          Contact :{" "}
          <a href={`mailto:${PUBLISHER.contact}`}>{PUBLISHER.contact}</a>
        </li>
      </ul>
      {missing.length > 0 && (
        <p>
          Les informations d’immatriculation complètes de l’éditeur sont
          communiquées sur simple demande à{" "}
          <a href={`mailto:${PUBLISHER.contact}`}>{PUBLISHER.contact}</a>, et
          figurent au contrat de service.
        </p>
      )}

      <h2>Hébergement</h2>
      <ul>
        {hosts.map((host) => (
          <li key={host.name}>
            <strong>{host.name}</strong> —{" "}
            {host.role.charAt(0).toLowerCase() + host.role.slice(1)} ;{" "}
            {host.address}.
          </li>
        ))}
      </ul>
      <p>
        Les images médicales, les comptes-rendus et les sauvegardes sont
        hébergés dans l’Union européenne. La liste complète des sous-traitants
        figure dans la page{" "}
        <a href="/confidentialite#sous-traitants">Protection des données</a> et
        dans l’annexe de traitement des données jointe au contrat.
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
        L’ensemble des éléments composant le service — code, interface, marques,
        documentation — demeure la propriété de {PUBLISHER.name} ou de ses
        concédants. Les examens transmis et les comptes-rendus produits restent
        la propriété de l’établissement client et de ses patients, dans les
        conditions prévues au contrat.
      </p>

      <h2>Signalement</h2>
      <p>
        Tout contenu manifestement illicite ou tout dysfonctionnement peut être
        signalé à{" "}
        <a href={`mailto:${PUBLISHER.contact}`}>{PUBLISHER.contact}</a>. Les
        incidents de sécurité relèvent de la procédure décrite dans l’annexe de
        traitement des données.
      </p>
    </LegalPage>
  );
}
