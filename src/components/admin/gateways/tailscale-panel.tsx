"use client";

import { AlertTriangle, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DateTime } from "@/components/domain/date-time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import {
  type TailscaleTestResult,
  comparePolicy,
  pushTailscalePolicy,
  removeTailscaleConnection,
  saveTailscaleConnection,
  testTailscaleConnection,
} from "@/lib/actions/gateways";
import { cn } from "@/lib/utils";

/** Console Tailscale, où se gèrent les clients OAuth et leurs portées. */
const TAILSCALE_OAUTH_CONSOLE =
  "https://login.tailscale.com/admin/settings/oauth";

/** Connexion Tailscale, sans son secret, telle que la page la transmet. */
export interface ConnectionInfo {
  source: "console" | "environment" | null;
  clientId: string | null;
  secretLast4: string | null;
  /** ISO 8601. */
  configuredAt: string | null;
  configuredBy: string | null;
  scopes: string[];
  requiredScopes: string[];
  encryptionAvailable: boolean;
  policyFileAvailable: boolean;
}

/** Comparaison de la politique d'accès, telle que la page la transmet. */
export interface PolicyInfo {
  repositoryAvailable: boolean;
  tailnetAvailable: boolean;
  inSync: boolean | null;
  diff: string;
  etag: string | null;
  error: string | null;
}

/** Une portée est accordée si elle l'est nommément, ou par `all`. */
const granted = (scopes: string[], scope: string) =>
  scopes.some(
    (candidate) =>
      candidate === "all" ||
      candidate === scope ||
      // `devices:core` est aussi accordée par la portée large `devices`.
      candidate === scope.split(":")[0],
  );

/**
 * Connexion Tailscale de la plateforme, dans les réglages.
 *
 * Le client OAuth crée les clés d'adhésion des passerelles, retrouve
 * leurs nœuds et les supprime à la révocation. Ce panneau en montre
 * l'état sans jamais le secret (ses quatre derniers signes, la date et
 * l'auteur de la saisie), l'éprouve à la demande, et le remplace ou le
 * retire.
 *
 * Enregistrer, retirer, et pousser la politique d'accès exigent le code
 * de l'application d'authentification : la preuve d'une authentification
 * récente, que le vol d'une session ne donne pas.
 *
 * @param connection État de la connexion.
 * @param policy     Comparaison de la politique d'accès versionnée.
 */
export function TailscalePanel({
  connection,
  policy,
}: {
  connection: ConnectionInfo;
  policy: PolicyInfo;
}) {
  const t = useMessages();
  const text = t.gateways.tailscale;
  const [test, setTest] = React.useState<TailscaleTestResult | null>(null);
  const [testError, setTestError] = React.useState<string | null>(null);
  const [testing, startTest] = React.useTransition();

  const missing = connection.requiredScopes.filter(
    (scope) => !granted(connection.scopes, scope),
  );
  const policyScope = granted(connection.scopes, "policy_file");

  const runTest = () => {
    setTestError(null);
    startTest(async () => {
      const result = await testTailscaleConnection();
      if (result.ok) setTest(result.data);
      else setTestError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="sr-only">{text.title}</dt>
          <dd className="flex items-center gap-2 text-sm font-medium">
            <span
              className={cn(
                "size-2 rounded-full",
                connection.source === null
                  ? "bg-urgent"
                  : missing.length > 0
                    ? "bg-progress"
                    : "bg-done",
              )}
              aria-hidden
            />
            {connection.source === "console"
              ? text.sourceConsole
              : connection.source === "environment"
                ? text.sourceEnvironment
                : text.sourceNone}
          </dd>
        </div>
        {connection.clientId && (
          <div>
            <dt className="text-2xs text-tertiary">{text.clientId}</dt>
            <dd className="font-mono text-2xs break-all">
              {connection.clientId}
            </dd>
          </div>
        )}
        {connection.secretLast4 && (
          <div>
            <dt className="text-2xs text-tertiary">{text.secret}</dt>
            <dd className="font-mono text-2xs">
              {text.secretEnding(connection.secretLast4)}
            </dd>
          </div>
        )}
        {connection.configuredAt && (
          <div>
            <dt className="text-2xs text-tertiary">{text.configuredOn}</dt>
            <dd>
              <DateTime date={new Date(connection.configuredAt)} />
              {connection.configuredBy && (
                <span className="text-tertiary">
                  {" "}
                  {text.configuredBy(connection.configuredBy)}
                </span>
              )}
            </dd>
          </div>
        )}
        {connection.source !== null && (
          <div className="sm:col-span-2">
            <dt className="text-2xs text-tertiary">{text.scopes}</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              <ScopeList
                scopes={connection.scopes}
                required={connection.requiredScopes}
              />
            </dd>
          </div>
        )}
      </dl>

      {connection.source !== null && missing.length > 0 && (
        <MissingScopes missing={missing} />
      )}

      {!connection.encryptionAvailable && (
        <p
          role="note"
          className="flex gap-2 rounded-lg bg-progress-muted px-3 py-2.5 text-xs leading-relaxed text-progress"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {text.encryptionMissing}
        </p>
      )}

      {test && <TestOutcome result={test} />}
      {testError && (
        <p role="alert" className="text-xs text-urgent">
          {testError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {connection.source !== null && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={runTest}
            loading={testing}
          >
            <ShieldCheck aria-hidden />
            {text.test}
          </Button>
        )}
        <ConfigureDialog
          replace={connection.source !== null}
          disabled={!connection.encryptionAvailable}
          onTested={setTest}
        />
        {connection.source === "console" && <RemoveDialog />}
      </div>

      {/* Clé : une comparaison relue par le serveur remplace l'état local. */}
      <PolicySection
        key={`${policy.etag ?? ""}:${String(policy.inSync)}`}
        policy={policy}
        canPush={policyScope && connection.source !== null}
      />
    </div>
  );
}

/** Portées accordées, les indispensables marquées. */
function ScopeList({
  scopes,
  required,
}: {
  scopes: string[];
  required: string[];
}) {
  const text = useMessages().gateways.tailscale;
  if (scopes.length === 0) return <span className="text-tertiary">—</span>;
  return (
    <>
      {scopes.map((scope) => (
        <span
          key={scope}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs",
            required.includes(scope)
              ? "border-done/30 bg-done-muted text-done"
              : "border-border-default text-secondary",
          )}
        >
          {required.includes(scope) && <Check className="size-3" aria-hidden />}
          {text.scopeLabels[scope] ?? scope}
        </span>
      ))}
    </>
  );
}

/** Portées manquantes, et le lien vers la console Tailscale où les ajouter. */
function MissingScopes({ missing }: { missing: string[] }) {
  const text = useMessages().gateways.tailscale;
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs leading-relaxed text-urgent"
    >
      <p className="flex gap-2">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {text.missingScopes(
          missing.map((scope) => text.scopeLabels[scope] ?? scope).join(", "),
        )}
      </p>
      <a
        href={TAILSCALE_OAUTH_CONSOLE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start font-medium underline"
      >
        {text.consoleLink}
        <ExternalLink className="size-3" aria-hidden />
      </a>
    </div>
  );
}

/** Résultat d'un test : succès, ou motif et portées manquantes. */
function TestOutcome({ result }: { result: TailscaleTestResult }) {
  const text = useMessages().gateways.tailscale;
  if (result.ok && result.missingScopes.length === 0) {
    return (
      <p
        role="status"
        className="flex gap-2 rounded-lg bg-done-muted px-3 py-2.5 text-xs text-done"
      >
        <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {text.testOk}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {result.error && (
        <p
          role="alert"
          className="flex gap-2 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs text-urgent"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {result.error}
        </p>
      )}
      {result.missingScopes.length > 0 && (
        <MissingScopes missing={result.missingScopes} />
      )}
    </div>
  );
}

/**
 * Champ du code de l'application d'authentification.
 *
 * `one-time-code` : le navigateur ou le gestionnaire de mots de passe
 * peut le proposer d'office.
 */
function OtpField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const text = useMessages().gateways.tailscale;
  return (
    <Field id={id} label={text.otp} hint={text.otpHint}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        className="h-9 w-40 font-mono tracking-widest"
      />
    </Field>
  );
}

/**
 * Saisie d'une connexion : identifiant, secret, et code du second facteur.
 *
 * Le service éprouve la connexion avant de l'enregistrer : un secret faux
 * ou une portée manquante n'écrase jamais une connexion qui marche.
 */
function ConfigureDialog({
  replace,
  disabled,
  onTested,
}: {
  replace: boolean;
  disabled: boolean;
  onTested: (result: TailscaleTestResult) => void;
}) {
  const t = useMessages();
  const text = t.gateways.tailscale;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [refused, setRefused] = React.useState<TailscaleTestResult | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    setClientId("");
    setSecret("");
    setOtp("");
    setError(null);
    setRefused(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setRefused(null);
    startTransition(async () => {
      const result = await saveTailscaleConnection({
        clientId,
        clientSecret: secret,
        otp,
      });
      // Le code ne sert qu'une fois : il est effacé quoi qu'il arrive.
      setOtp("");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!result.data.ok || result.data.missingScopes.length > 0) {
        setRefused(result.data);
        return;
      }
      onTested(result.data);
      toast.success(text.saved);
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={replace ? "ghost" : "primary"}
          disabled={disabled}
        >
          {replace ? text.replace : text.configure}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={submit} autoComplete="off">
          <DialogHeader>
            <DialogTitle>{replace ? text.replace : text.configure}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-5 pb-5">
            <Field id="tailscale-client-id" label={text.clientId}>
              <Input
                id="tailscale-client-id"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                maxLength={200}
                required
                className="h-9 font-mono"
              />
            </Field>
            <Field
              id="tailscale-secret"
              label={text.secret}
              hint={text.secretHint}
            >
              <Input
                id="tailscale-secret"
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                autoComplete="new-password"
                spellCheck={false}
                maxLength={500}
                required
                className="h-9 font-mono"
              />
            </Field>
            <OtpField id="tailscale-otp" value={otp} onChange={setOtp} />

            {refused && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium">{text.notSaved}</p>
                <TestOutcome result={refused} />
              </div>
            )}
            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              {t.common.actions.cancel}
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {replace ? text.replace : text.configure}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Retrait de la connexion saisie en console. */
function RemoveDialog() {
  const t = useMessages();
  const text = t.gateways.tailscale;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await removeTailscaleConnection(otp);
      setOtp("");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.removed);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) {
          setOtp("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost">
          {text.remove}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.remove}</DialogTitle>
            <DialogDescription>{text.removeDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-5 pb-5">
            <OtpField id="tailscale-remove-otp" value={otp} onChange={setOtp} />
            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button type="submit" size="sm" variant="danger" loading={pending}>
              {text.remove}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Politique d'accès : comparaison avec celle du réseau, écart lisible, et
 * poussée confirmée quand la connexion en a la portée.
 */
function PolicySection({
  policy: initial,
  canPush,
}: {
  policy: PolicyInfo;
  canPush: boolean;
}) {
  const t = useMessages();
  const text = t.gateways.tailscale.policy;
  const [policy, setPolicy] = React.useState(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [comparing, startCompare] = React.useTransition();

  const compare = () => {
    setError(null);
    startCompare(async () => {
      const result = await comparePolicy();
      if (result.ok) setPolicy(result.data);
      else setError(result.error);
    });
  };

  const comparable = policy.repositoryAvailable && policy.tailnetAvailable;

  return (
    <section
      aria-labelledby="tailscale-policy-title"
      className="flex flex-col gap-3 border-t border-border-subtle pt-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id="tailscale-policy-title" className="text-sm font-medium">
            {text.title}
          </h3>
          <p className="text-2xs text-tertiary">{text.description}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={compare}
          loading={comparing}
        >
          {text.compare}
        </Button>
      </div>

      {!comparable || policy.inSync === null ? (
        <p className="text-xs text-progress">
          {text.unavailable}
          {policy.error && (
            <span className="block text-2xs text-tertiary">{policy.error}</span>
          )}
        </p>
      ) : policy.inSync ? (
        <p role="status" className="flex items-center gap-2 text-xs text-done">
          <Check className="size-3.5" aria-hidden />
          {text.inSync}
        </p>
      ) : (
        <>
          <p className="text-xs font-medium text-progress">{text.differs}</p>
          <div className="flex flex-col gap-1">
            <p className="text-2xs text-tertiary">{text.diff}</p>
            <pre
              className="max-h-72 overflow-auto rounded-md border border-border-subtle bg-surface-sunken p-3 font-mono text-2xs leading-relaxed"
              data-testid="policy-diff"
            >
              <code>
                {policy.diff.split("\n").map((line, index) => (
                  <span
                    // L'écart ne change qu'avec la comparaison entière :
                    // la position de la ligne suffit à l'identifier.
                    key={index}
                    className={cn(
                      "block",
                      line.startsWith("+") && !line.startsWith("+++")
                        ? "text-done"
                        : line.startsWith("-") && !line.startsWith("---")
                          ? "text-urgent"
                          : "text-secondary",
                    )}
                  >
                    {line || " "}
                  </span>
                ))}
              </code>
            </pre>
          </div>
          {canPush && policy.etag ? (
            <PushDialog etag={policy.etag} onPushed={setPolicy} />
          ) : (
            <p className="text-2xs leading-relaxed text-tertiary">
              {text.noScope}
            </p>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}
    </section>
  );
}

/** Poussée de la politique versionnée, confirmée par le second facteur. */
function PushDialog({
  etag,
  onPushed,
}: {
  etag: string;
  onPushed: (policy: PolicyInfo) => void;
}) {
  const t = useMessages();
  const text = t.gateways.tailscale.policy;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await pushTailscalePolicy(etag, otp);
      setOtp("");
      if (!result.ok) {
        setError(result.error);
        // Politique du réseau changée depuis la comparaison : relire.
        if (result.status === 409) router.refresh();
        return;
      }
      onPushed(result.data);
      toast.success(text.pushed);
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) {
          setOtp("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="self-start">
          {text.push}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.push}</DialogTitle>
            <DialogDescription>{text.pushDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-5 pb-5">
            <OtpField id="tailscale-policy-otp" value={otp} onChange={setOtp} />
            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {text.push}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
