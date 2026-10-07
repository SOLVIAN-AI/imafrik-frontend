import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";
import {
  AUTHORITIES,
  LEGAL_UPDATED_AT,
  PUBLISHER,
  RETENTION,
  SUBPROCESSORS,
} from "@/lib/legal";

export const metadata = legalMetadata(
  "Protection des données",
  "Données traitées, finalités, durées de conservation, destinataires et droits des personnes concernées.",
);

/**
 * Politique de protection des données.
 *
 * ⚠️ **Projet, à faire relire par un conseil avant mise en ligne.**
 *
 * Deux traitements y sont distingués, et cette distinction est le cœur du
 * document : les **données de compte** des professionnels, dont IMAFRIK
 * est responsable, et les **données de santé** des patients, pour
 * lesquelles IMAFRIK n’est que sous-traitant de l’établissement. Les
 * confondre reviendrait à s’attribuer une responsabilité qui n’est pas la
 * nôtre, et à priver l’établissement de la sienne.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Protection des données" updatedAt={LEGAL_UPDATED_AT}>
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
        <li>Données de compte : {RETENTION.accounts.toLowerCase()}</li>
        <li>
          Journal des accès aux examens : {RETENTION.accessLogs.toLowerCase()}
        </li>
        <li>Journaux techniques : {RETENTION.technicalLogs.toLowerCase()}</li>
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
        <li>Durée : {RETENTION.examinations.toLowerCase()}</li>
        <li>
          Restitution : sur simple demande, l’établissement reçoit l’export de
          ses examens — images DICOM, comptes-rendus signés en PDF, manifeste
          d’empreintes
        </li>
      </ul>

      <h2>3. Demandes reçues par le site</h2>
      <p>
        Pour les coordonnées laissées dans le formulaire de contact,{" "}
        <strong>{PUBLISHER.name} est responsable de traitement</strong>. Elles
        servent uniquement à répondre à la demande et à présenter le service
        (intérêt légitime), ne sont transmises à personne, et sont conservées{" "}
        {RETENTION.prospects.toLowerCase()}
      </p>

      <h2>Destinataires</h2>
      <p>
        Les examens ne sont accessibles qu’aux membres de l’établissement
        émetteur et aux radiologues liés à celui-ci par un contrat de service en
        cours. Le cloisonnement est appliqué par la base de données à chaque
        requête.
      </p>

      <h2 id="sous-traitants">Sous-traitants ultérieurs</h2>
      <p>
        Ils sont tenus, par contrat, à des obligations de sécurité et de
        confidentialité équivalentes aux nôtres. Tout changement est notifié aux
        établissements avant de prendre effet.
      </p>
      <ul>
        {SUBPROCESSORS.map((processor) => (
          <li key={processor.name}>
            <strong>{processor.name}</strong> — {processor.role}. Localisation :{" "}
            {processor.location}.
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
        page <a href="/securite">Sécurité</a> et, sous forme contractuelle, dans
        l’annexe de traitement des données.
      </p>

      <h2>Vos droits</h2>
      <p>
        Les professionnels utilisateurs disposent des droits d’accès, de
        rectification, d’effacement, de limitation et d’opposition sur leurs
        propres données, exerçables à{" "}
        <a href={`mailto:${PUBLISHER.dataContact}`}>{PUBLISHER.dataContact}</a>.
        Les patients exercent leurs droits{" "}
        <strong>auprès de l’établissement</strong> qui a réalisé l’examen :
        c’est lui qui est responsable du traitement. IMAFRIK lui apporte son
        concours dans les délais prévus au contrat.
      </p>

      <h2>Réclamation</h2>
      <p>
        Toute personne peut introduire une réclamation auprès de l’autorité de
        protection des données compétente : {AUTHORITIES}.
      </p>
    </LegalPage>
  );
}
