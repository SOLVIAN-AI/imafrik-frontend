import { LegalPage } from "@/components/marketing/legal-page";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";
import {
  PUBLISHER,
  SUBPROCESSORS,
  lowerFirst,
  missingLegalFacts,
} from "@/lib/legal";

/** Titre de la page, dans chaque langue. */
export const LEGAL_NOTICE_TITLE: Record<Locale, string> = {
  fr: "Mentions légales",
  en: "Legal notice",
};

/** Description de la page, dans chaque langue. */
export const LEGAL_NOTICE_DESCRIPTION: Record<Locale, string> = {
  fr: "Éditeur, directeur de publication, hébergeurs et contact du service IMAFRIK.",
  en: "Publisher, publication director, hosting providers and contact details for the IMAFRIK service.",
};

/**
 * Mentions légales.
 *
 * ⚠️ **À faire relire par un conseil avant mise en ligne**, dans les deux
 * langues. Les faits de l'éditeur viennent de `lib/legal.ts` : ceux qui ne
 * sont pas encore fournis sont omis, et un avis sobre le dit, jamais un
 * « [à compléter] » affiché au public. `missingLegalFacts()` liste ce qui
 * manque.
 *
 * @param locale Langue de la page.
 */
export function LegalNotice({ locale }: { locale: Locale }) {
  return (
    <LegalPage locale={locale} title={LEGAL_NOTICE_TITLE[locale]}>
      {locale === "en" ? <English /> : <French />}
    </LegalPage>
  );
}

/** Lien vers l'adresse de contact. */
function ContactLink() {
  return <a href={`mailto:${PUBLISHER.contact}`}>{PUBLISHER.contact}</a>;
}

function French() {
  const missing = missingLegalFacts();
  const hosts = SUBPROCESSORS.filter((processor) => processor.address);
  return (
    <>
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
          Contact : <ContactLink />
        </li>
      </ul>
      {missing.length > 0 && (
        <p>
          Les informations d’immatriculation complètes de l’éditeur sont
          communiquées sur simple demande à <ContactLink />, et figurent au
          contrat de service.
        </p>
      )}

      <h2>Hébergement</h2>
      <ul>
        {hosts.map((host) => (
          <li key={host.name}>
            <strong>{host.name}</strong> : {lowerFirst(host.role.fr)} ;{" "}
            {host.address?.fr}.
          </li>
        ))}
      </ul>
      <p>
        Les images médicales, les comptes-rendus et les sauvegardes sont
        hébergés dans l’Union européenne. La liste complète des sous-traitants
        figure dans la page{" "}
        <a href={localizePath("/confidentialite", "fr") + "#sous-traitants"}>
          Protection des données
        </a>{" "}
        et dans l’annexe de traitement des données jointe au contrat.
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
        L’ensemble des éléments composant le service (code, interface, marques,
        documentation) demeure la propriété de {PUBLISHER.name} ou de ses
        concédants. Les examens transmis et les comptes-rendus produits restent
        la propriété de l’établissement client et de ses patients, dans les
        conditions prévues au contrat.
      </p>

      <h2>Signalement</h2>
      <p>
        Tout contenu manifestement illicite ou tout dysfonctionnement peut être
        signalé à <ContactLink />. Les incidents de sécurité relèvent de la
        procédure décrite dans l’annexe de traitement des données.
      </p>
    </>
  );
}

function English() {
  const missing = missingLegalFacts();
  const hosts = SUBPROCESSORS.filter((processor) => processor.address);
  return (
    <>
      <h2>Publisher</h2>
      <p>
        The IMAFRIK service is published by <strong>{PUBLISHER.name}</strong>
        {PUBLISHER.legalForm && <>, {PUBLISHER.legalForm}</>}
        {PUBLISHER.registration && (
          <>, registered under number {PUBLISHER.registration}</>
        )}
        {PUBLISHER.address && (
          <>, with its registered office at {PUBLISHER.address}</>
        )}
        .
      </p>
      <ul>
        {PUBLISHER.representative && (
          <li>Legal representative: {PUBLISHER.representative}</li>
        )}
        {PUBLISHER.publicationDirector && (
          <li>Publication director: {PUBLISHER.publicationDirector}</li>
        )}
        <li>
          Contact: <ContactLink />
        </li>
      </ul>
      {missing.length > 0 && (
        <p>
          The publisher’s full registration details are available on request
          from <ContactLink /> and are set out in the service contract.
        </p>
      )}

      <h2>Hosting</h2>
      <ul>
        {hosts.map((host) => (
          <li key={host.name}>
            <strong>{host.name}</strong>: {lowerFirst(host.role.en)};{" "}
            {host.address?.en}.
          </li>
        ))}
      </ul>
      <p>
        Medical images, reports and backups are hosted in the European Union.
        The full list of sub-processors is given on the{" "}
        <a href={localizePath("/confidentialite", "en") + "#subprocessors"}>
          Privacy policy
        </a>{" "}
        page and in the data processing agreement attached to the contract.
      </p>

      <h2>Nature of the service</h2>
      <p>
        IMAFRIK is a technical platform for transmitting medical imaging
        examinations and producing reports. Examinations are interpreted by
        independent radiologists registered with a professional medical council,
        who are solely responsible for the medical content of the documents they
        sign. IMAFRIK does not provide healthcare services and does not take the
        place of the referring physician.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All components of the service (software, interface, trademarks,
        documentation) remain the property of {PUBLISHER.name} or its licensors.
        The examinations transmitted and the reports produced remain the
        property of the client facility and its patients, under the terms set
        out in the contract.
      </p>

      <h2>Reporting</h2>
      <p>
        Any manifestly unlawful content or any malfunction may be reported to{" "}
        <ContactLink />. Security incidents are handled under the procedure
        described in the data processing agreement.
      </p>
    </>
  );
}
