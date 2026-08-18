import { redirect } from "next/navigation";

/**
 * La racine oriente vers la connexion.
 *
 * Tant que la vitrine publique n'existe pas, quelqu'un qui arrive sur le
 * domaine cherche à entrer : l'envoyer directement au formulaire évite
 * un écran vide. Une fois la session Supabase en place, cette
 * redirection deviendra conditionnelle — vers le portail si le jeton est
 * valide, vers la connexion sinon — puis cédera la place à la page
 * d'accueil publique.
 */
export default function Home() {
  redirect("/connexion");
}
