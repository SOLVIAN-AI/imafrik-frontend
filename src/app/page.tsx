import { redirect } from "next/navigation";

/**
 * La racine n'affiche rien : elle oriente vers la file de travail.
 *
 * Une page d'accueil dans un outil professionnel est un écran de plus à
 * traverser chaque matin. L'orientation par rôle — clinique ou
 * radiologue — sera décidée d'après les claims du jeton.
 */
export default function Home() {
  redirect("/worklist");
}
