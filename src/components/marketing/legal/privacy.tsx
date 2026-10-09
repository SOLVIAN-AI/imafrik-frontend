import { LegalPage } from "@/components/marketing/legal-page";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";
import {
  AUTHORITIES,
  PUBLISHER,
  RETENTION,
  SUBPROCESSORS,
  lowerFirst,
} from "@/lib/legal";

/** Titre de la page, dans chaque langue. */
export const PRIVACY_TITLE: Record<Locale, string> = {
  fr: "Protection des données",
  en: "Privacy policy",
};

/** Description de la page, dans chaque langue. */
export const PRIVACY_DESCRIPTION: Record<Locale, string> = {
  fr: "Données traitées, finalités, durées de conservation, destinataires et droits des personnes concernées.",
  en: "Data processed, purposes, retention periods, recipients and the rights of data subjects.",
};

/** Ancre de la liste des sous-traitants, dans chaque langue. */
const SUBPROCESSORS_ANCHOR: Record<Locale, string> = {
  fr: "sous-traitants",
  en: "subprocessors",
};

/**
 * Politique de protection des données.
 *
 * ⚠️ **Projet, à faire relire par un conseil avant mise en ligne**, dans
 * les deux langues.
 *
 * Deux traitements y sont distingués, et cette distinction est le cœur du
 * document : les **données de compte** des professionnels, dont IMAFRIK
 * est responsable, et les **données de santé** des patients, pour
 * lesquelles IMAFRIK n’est que sous-traitant de l’établissement. Les
 * confondre reviendrait à s’attribuer une responsabilité qui n’est pas la
 * nôtre, et à priver l’établissement de la sienne.
 *
 * @param locale Langue de la page.
 */
export function Privacy({ locale }: { locale: Locale }) {
  return (
    <LegalPage locale={locale} title={PRIVACY_TITLE[locale]}>
      {locale === "en" ? <English /> : <French />}
    </LegalPage>
  );
}

/** Adresse de contact pour l'exercice des droits. */
function DataContactLink() {
  return (
    <a href={`mailto:${PUBLISHER.dataContact}`}>{PUBLISHER.dataContact}</a>
  );
}

function French() {
  return (
    <>
      <p>
        Ce document décrit la manière dont IMAFRIK traite les données
        personnelles. Il distingue trois situations aux régimes différents : les
        professionnels qui utilisent le service, les patients dont les examens
        sont transmis, et les personnes qui nous écrivent depuis le site.
      </p>

      <h2>1. Données des professionnels utilisateurs</h2>
      <p>
        Pour ces données,{" "}
        <strong>{PUBLISHER.name} est responsable de traitement</strong>.
      </p>
      <h3>Données traitées</h3>
      <ul>
        <li>Identité : nom, titre, numéro d’inscription à l’ordre</li>
        <li>Coordonnées : adresse électronique, téléphone professionnel</li>
        <li>Données de compte : mot de passe chiffré, organisation, rôle</li>
        <li>
          Données d’usage : journal des connexions et des accès aux examens
        </li>
        <li>
          Facteur de double authentification : obligatoire pour les radiologues
          et l’équipe IMAFRIK, facultatif pour les établissements
        </li>
      </ul>
      <h3>Finalités et base légale</h3>
      <ul>
        <li>Fournir le service et gérer les accès : exécution du contrat</li>
        <li>
          Assurer la traçabilité des accès aux données de santé : obligation
          légale et intérêt légitime à la sécurité
        </li>
        <li>Facturer et rémunérer les actes : exécution du contrat</li>
      </ul>
      <h3>Durée de conservation</h3>
      <ul>
        <li>{RETENTION.accounts.fr}</li>
        <li>
          Journal des accès aux examens : {lowerFirst(RETENTION.accessLogs.fr)}
        </li>
        <li>Journaux techniques : {lowerFirst(RETENTION.technicalLogs.fr)}</li>
      </ul>

      <h2>2. Données de santé des patients</h2>
      <p>
        Pour ces données,{" "}
        <strong>l’établissement de santé est responsable de traitement</strong>{" "}
        et IMAFRIK agit en qualité de <strong>sous-traitant</strong>, sur
        instruction documentée, dans le cadre de l’annexe de traitement des
        données annexée au contrat.
      </p>
      <ul>
        <li>
          Données traitées : images d’examen et métadonnées DICOM, identité du
          patient, renseignements cliniques transmis, comptes-rendus produits
        </li>
        <li>
          Finalité unique : permettre l’interprétation à distance et la
          production du compte-rendu demandé
        </li>
        <li>
          Aucun autre usage : ni entraînement de modèle, ni réutilisation
          statistique nominative, ni transmission à un tiers non prévu au
          contrat
        </li>
        <li>Durée : {lowerFirst(RETENTION.examinations.fr)}</li>
        <li>
          Restitution : sur simple demande, l’établissement reçoit l’export de
          ses examens : images DICOM, comptes-rendus signés en PDF et manifeste
          d’empreintes
        </li>
      </ul>

      <h2>3. Demandes reçues par le site</h2>
      <p>
        Pour les coordonnées laissées dans le formulaire de contact,{" "}
        <strong>{PUBLISHER.name} est responsable de traitement</strong>. Elles
        servent uniquement à répondre à la demande et à présenter le service
        (intérêt légitime), ne sont transmises à personne, et sont conservées{" "}
        {lowerFirst(RETENTION.prospects.fr)}
      </p>

      <h2>Destinataires</h2>
      <p>
        Les examens ne sont accessibles qu’aux membres de l’établissement
        émetteur et aux radiologues liés à celui-ci par un contrat de service en
        cours. Le cloisonnement est appliqué par la base de données à chaque
        requête.
      </p>

      <h2 id={SUBPROCESSORS_ANCHOR.fr}>Sous-traitants ultérieurs</h2>
      <p>
        Ils sont tenus, par contrat, à des obligations de sécurité et de
        confidentialité équivalentes aux nôtres. Tout changement est notifié aux
        établissements avant de prendre effet.
      </p>
      <ul>
        {SUBPROCESSORS.map((processor) => (
          <li key={processor.name}>
            <strong>{processor.name}</strong> : {lowerFirst(processor.role.fr)}.
            Localisation : {processor.location.fr}.
          </li>
        ))}
      </ul>

      <h2>Transferts hors de l’Union européenne</h2>
      <p>
        Images, comptes-rendus, base de données et sauvegardes sont hébergés
        dans l’Union européenne ; la localisation du stockage et des rapports
        d’erreur est contrôlée à chaque déploiement. Le seul traitement
        susceptible d’avoir lieu hors de l’Union est la coordination du réseau
        privé (Tailscale) : il porte sur les adresses techniques des
        passerelles, jamais sur le contenu des examens, qui circule chiffré de
        bout en bout. Il est encadré par les clauses contractuelles types de la
        Commission européenne.
      </p>

      <h2>Sécurité</h2>
      <p>
        Chiffrement en transit et au repos, cloisonnement par organisation
        appliqué en base, authentification nominative avec double
        authentification, fermeture des sessions inactives, journalisation
        inaltérable depuis l’application, sauvegardes chiffrées et restaurées à
        titre d’exercice chaque semaine. Le détail des mesures figure sur la
        page <a href={localizePath("/securite", "fr")}>Sécurité</a> et, sous
        forme contractuelle, dans l’annexe de traitement des données.
      </p>

      <h2>Vos droits</h2>
      <p>
        Les professionnels utilisateurs disposent des droits d’accès, de
        rectification, d’effacement, de limitation et d’opposition sur leurs
        propres données, exerçables à <DataContactLink />. L’effacement supprime
        aussitôt le compte de connexion (adresse électronique, mot de passe,
        double authentification) ; le nom, le titre et le numéro d’ordre de la
        personne qui a signé un compte-rendu ou accédé à un examen restent
        attachés à ce compte-rendu et au journal d’audit, dont ils font partie,
        aussi longtemps qu’eux. Les patients exercent leurs droits{" "}
        <strong>auprès de l’établissement</strong> qui a réalisé l’examen :
        c’est lui qui est responsable du traitement. IMAFRIK lui apporte son
        concours dans les délais prévus au contrat.
      </p>

      <h2>Réclamation</h2>
      <p>
        Toute personne peut introduire une réclamation auprès de l’autorité de
        protection des données compétente : {AUTHORITIES.fr}.
      </p>
    </>
  );
}

function English() {
  return (
    <>
      <p>
        This policy describes how IMAFRIK processes personal data. It
        distinguishes three situations, each governed by different rules: the
        professionals who use the service, the patients whose examinations are
        transmitted, and the people who contact us through this website.
      </p>

      <h2>1. Data relating to professional users</h2>
      <p>
        For this data, <strong>{PUBLISHER.name} is the controller</strong>.
      </p>
      <h3>Data processed</h3>
      <ul>
        <li>Identity: name, title, professional council registration number</li>
        <li>Contact details: email address, work telephone number</li>
        <li>Account data: encrypted password, organisation, role</li>
        <li>Usage data: log of sign-ins and of access to examinations</li>
        <li>
          Second authentication factor: mandatory for radiologists and the
          IMAFRIK team, optional for facilities
        </li>
      </ul>
      <h3>Purposes and legal basis</h3>
      <ul>
        <li>
          Providing the service and managing access: performance of the contract
        </li>
        <li>
          Ensuring the traceability of access to health data: legal obligation
          and legitimate interest in security
        </li>
        <li>
          Invoicing and paying for examinations read: performance of the
          contract
        </li>
      </ul>
      <h3>Retention period</h3>
      <ul>
        <li>{RETENTION.accounts.en}</li>
        <li>
          Log of access to examinations: {lowerFirst(RETENTION.accessLogs.en)}
        </li>
        <li>Technical logs: {lowerFirst(RETENTION.technicalLogs.en)}</li>
      </ul>

      <h2>2. Patients’ health data</h2>
      <p>
        For this data,{" "}
        <strong>the healthcare facility is the controller</strong> and IMAFRIK
        acts as a <strong>processor</strong>, on documented instructions, under
        the data processing agreement annexed to the contract.
      </p>
      <ul>
        <li>
          Data processed: examination images and DICOM metadata, patient
          identity, clinical information provided, reports produced
        </li>
        <li>
          Sole purpose: enabling remote interpretation and producing the
          requested report
        </li>
        <li>
          No other use: no model training, no identifiable statistical reuse,
          and no disclosure to any third party not provided for in the contract
        </li>
        <li>Retention: {lowerFirst(RETENTION.examinations.en)}</li>
        <li>
          Return of data: on request, the facility receives an export of its
          examinations, comprising DICOM images, signed PDF reports and a
          manifest of checksums
        </li>
      </ul>

      <h2>3. Enquiries received through the website</h2>
      <p>
        For the contact details submitted through the contact form,{" "}
        <strong>{PUBLISHER.name} is the controller</strong>. They are used
        solely to respond to the enquiry and to present the service (legitimate
        interest), are not shared with anyone, and are kept for{" "}
        {lowerFirst(RETENTION.prospects.en)}
      </p>

      <h2>Recipients</h2>
      <p>
        Examinations are accessible only to members of the facility that sent
        them and to radiologists bound to that facility by a current service
        contract. Isolation is enforced by the database on every request.
      </p>

      <h2 id={SUBPROCESSORS_ANCHOR.en}>Sub-processors</h2>
      <p>
        Sub-processors are contractually bound by security and confidentiality
        obligations equivalent to our own. Facilities are notified of any change
        before it takes effect.
      </p>
      <ul>
        {SUBPROCESSORS.map((processor) => (
          <li key={processor.name}>
            <strong>{processor.name}</strong>: {lowerFirst(processor.role.en)}.
            Location: {processor.location.en}.
          </li>
        ))}
      </ul>

      <h2>Transfers outside the European Union</h2>
      <p>
        Images, reports, the database and backups are hosted in the European
        Union; the location of storage and of error reports is checked at every
        deployment. The only processing that may take place outside the Union is
        the coordination of the private network (Tailscale): it concerns the
        technical addresses of the gateways, never the content of examinations,
        which travels encrypted end to end. This processing is governed by the
        European Commission’s standard contractual clauses.
      </p>

      <h2>Security</h2>
      <p>
        Encryption in transit and at rest, isolation between organisations
        enforced in the database, named accounts with two-factor authentication,
        automatic termination of inactive sessions, logs that cannot be altered
        from the application, and encrypted backups with a test restore every
        week. The measures are described in detail on the{" "}
        <a href={localizePath("/securite", "en")}>Security</a> page and, in
        contractual form, in the data processing agreement.
      </p>

      <h2>Your rights</h2>
      <p>
        Professional users have the rights of access, rectification, erasure,
        restriction and objection in respect of their own data, which they may
        exercise by writing to <DataContactLink />. Erasure deletes the login
        account immediately (email address, password, two-factor
        authentication); the name, title and registration number of a person who
        signed a report or accessed an examination remain attached to that
        report and to the audit log, of which they form part, for as long as
        these are kept. Patients exercise their rights{" "}
        <strong>with the facility</strong> that performed the examination, as it
        is the controller. IMAFRIK assists the facility within the time limits
        set out in the contract.
      </p>

      <h2>Complaints</h2>
      <p>
        Anyone may lodge a complaint with the competent data protection
        authority: {AUTHORITIES.en}.
      </p>
    </>
  );
}
