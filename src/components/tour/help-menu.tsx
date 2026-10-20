"use client";

import { CircleHelp, GraduationCap, Mail, Route } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useSession } from "@/components/providers/session-provider";
import { useTour } from "@/components/tour/tour-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages } from "@/i18n/client";
import { PUBLISHER } from "@/lib/legal";
import { homeFor, isRouteAllowed } from "@/lib/navigation";

/** Adresse de l'espace de formation. */
const TRAINING_HREF = "/formation";

/**
 * Bouton d'aide : la visite de l'écran, la formation, l'équipe.
 *
 * Présent dans la barre supérieure du portail et dans celle de l'écran de
 * lecture, au même endroit d'un écran à l'autre. Sur un écran sans visite,
 * il propose celle de l'accueil, et y mène. L'équipe IMAFRIK n'a pas
 * d'équipe à qui écrire : l'entrée de contact lui est épargnée.
 */
export function HelpMenu() {
  const t = useMessages();
  const router = useRouter();
  const { active } = useSession();
  const { screenTour, mainTour, start, request } = useTour();
  // Une visite lancée depuis le menu prend le focus : le menu, en se
  // fermant, ne doit pas le reprendre pour son bouton.
  const launching = React.useRef(false);

  const tourEntry = screenTour ? (
    <DropdownMenuItem
      onSelect={() => {
        launching.current = true;
        start(screenTour.id);
      }}
    >
      <Route className="size-3.5 text-tertiary" aria-hidden />
      {t.tour.help.replayHere}
    </DropdownMenuItem>
  ) : mainTour ? (
    <DropdownMenuItem
      onSelect={() => {
        request(mainTour.id);
        router.push(homeFor(active.role));
      }}
    >
      <Route className="size-3.5 text-tertiary" aria-hidden />
      {t.tour.help.tourOfHome}
    </DropdownMenuItem>
  ) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t.tour.help.button}
          data-tour="help"
        >
          <CircleHelp />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
        onCloseAutoFocus={(event) => {
          if (launching.current) {
            launching.current = false;
            event.preventDefault();
          }
        }}
      >
        {tourEntry}
        {isRouteAllowed(active.role, TRAINING_HREF) && (
          <DropdownMenuItem asChild>
            <Link href={TRAINING_HREF}>
              <GraduationCap className="size-3.5 text-tertiary" aria-hidden />
              {t.tour.help.training}
            </Link>
          </DropdownMenuItem>
        )}
        {active.role !== "platform_admin" && (
          <DropdownMenuItem asChild>
            <a href={`mailto:${PUBLISHER.contact}`}>
              <Mail className="size-3.5 text-tertiary" aria-hidden />
              {t.tour.help.contact}
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
