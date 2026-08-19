import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

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
    <LegalPage title="Protection des données" updatedAt="18 août 2026">
      <p>
        Ce document décrit la manière dont IMAFRIK traite les données
        personnelles. Il distingue deux situations aux régimes différents.
      </p>

      <h2>1. Données des professionnels utilisateurs</h2>
      <p>
        Pour ces données,{" "}
        <strong>SOLVIAN AI LLC est responsable de traitement</strong>.
      </p>
      <h3>Données traitées</h3>
      <ul>
        <li>Identité : nom, titre, numéro d’inscription à l’ordre</li>
        <li>Coordonnées : adresse électronique, téléphone professionnel</li>
        <li>Données de compte : mot de passe chiffré, organisation, rôle</li>
        <li>
          Données d’usage : journal des connexions et des accès aux examens
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
      <p>
        Les données de compte sont conservées pendant la durée de la relation
        contractuelle, puis [durée] à des fins de preuve. Les journaux d’accès
        sont conservés [durée], durée qui ne peut être inférieure à celle
        qu’impose la réglementation applicable aux données de santé.
      </p>

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
        <li>
          Durée : fixée par l’établissement au contrat ; suppression du stockage
          actif et des sauvegardes selon le calendrier convenu
        </li>
      </ul>

      <h2>Destinataires</h2>
      <p>
        Les examens ne sont accessibles qu’aux membres de l’établissement
        émetteur et aux radiologues liés à celui-ci par un contrat de service en
        cours. Le cloisonnement est appliqué par la base de données à chaque
        requête. Les sous-traitants ultérieurs — hébergement applicatif,
        stockage des images, service d’authentification — sont listés dans
        l’annexe de traitement des données et sont eux-mêmes soumis à des
        obligations équivalentes.
      </p>

      <h2>Transferts hors de l’Union européenne</h2>
      <p>
        Les images et l’index sont hébergés dans l’Union européenne. [Préciser
        le cas échéant les transferts et les garanties applicables.]
      </p>

      <h2>Sécurité</h2>
      <p>
        Chiffrement en transit et au repos, cloisonnement par organisation
        appliqué en base, authentification nominative, journalisation
        inaltérable depuis l’application, sauvegardes chiffrées. Le détail des
        mesures figure sur la page <a href="/securite">Sécurité</a> et, sous
        forme contractuelle, dans l’annexe de traitement des données.
      </p>

      <h2>Vos droits</h2>
      <p>
        Les professionnels utilisateurs disposent des droits d’accès, de
        rectification, d’effacement, de limitation et d’opposition sur leurs
        propres données, exerçables à{" "}
        <a href="mailto:donnees@imafrik.com">donnees@imafrik.com</a>. Les
        patients exercent leurs droits{" "}
        <strong>auprès de l’établissement</strong> qui a réalisé l’examen :
        c’est lui qui est responsable du traitement. IMAFRIK lui apporte son
        concours dans les délais prévus au contrat.
      </p>

      <h2>Réclamation</h2>
      <p>
        Toute personne peut introduire une réclamation auprès de l’autorité de
        protection des données compétente : [autorité et coordonnées].
      </p>
    </LegalPage>
  );
}
