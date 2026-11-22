# Deploying

The site is hosted on **Azure Static Web Apps** (Free plan) at https://brindle.sh.
`.github/workflows/deploy.yml` builds `dist/` and uploads it:

- a push to `main` deploys to production;
- each pull request to `main` gets its own preview URL, which the action posts as
  a PR comment, and the preview is deleted when the PR closes;
- pull requests without access to secrets (forks, Dependabot) are built and
  checked but not deployed.

The workflow builds the site itself and passes `skip_app_build`, so Azure's
Oryx builder never runs. Headers and caching are in
`public/staticwebapp.config.json`.

## One-time setup

### 1. Create the static web app

Create it **without** linking GitHub, so Azure doesn't commit its own workflow
file. With the Azure CLI:

```sh
az login
az group create --name brindle-site --location westus2
az staticwebapp create --name brindle-site --resource-group brindle-site \
  --location westus2 --sku Free
```

(In the portal: *Create a resource → Static Web App*, plan **Free**,
deployment source **Other**.) The location only sets where the app's metadata
lives; the content is served from Azure's global edge.

### 2. Give the workflow the deployment token

```sh
az staticwebapp secrets list --name brindle-site --resource-group brindle-site \
  --query properties.apiKey -o tsv \
  | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo scmccart/brindle-site
```

Re-run the `deploy` workflow (or push to `main`) and check the site at its
generated `*.azurestaticapps.net` URL:

```sh
az staticwebapp show --name brindle-site --resource-group brindle-site \
  --query defaultHostname -o tsv
```

If the token ever leaks, reset it with
`az staticwebapp secrets reset-api-key` and set the secret again.

### 3. Point brindle.sh at it

TLS is automatic: once a custom domain validates, Azure issues a free
certificate for it and renews it. There is nothing to buy or upload. The only
requirement is that the domain keeps resolving to the app, or renewal fails.

`brindle.sh` is an apex domain, which can't have a `CNAME`, so it needs a TXT
record to prove ownership plus an `ALIAS`-style record to route traffic. Pick
the option that matches where the domain's DNS is hosted.

**Option A: the DNS provider supports `ALIAS`, `ANAME` or CNAME flattening**
(Cloudflare, Namecheap, DNSimple, Porkbun, Route 53 and most others):

1. Ask Azure for a validation token:

   ```sh
   az staticwebapp hostname set --name brindle-site --resource-group brindle-site \
     --hostname brindle.sh --validation-method dns-txt-token --no-wait
   az staticwebapp hostname show --name brindle-site --resource-group brindle-site \
     --hostname brindle.sh --query validationToken -o tsv
   ```

   (Portal: *Custom domains → Add → Custom domain on other DNS*, enter
   `brindle.sh`, record type **TXT**, *Generate code*.) The token can take a
   minute to appear.

2. At the DNS provider, add:

   | Type | Host | Value |
   | --- | --- | --- |
   | `TXT` | `@` | the validation token |
   | `ALIAS` (or `ANAME`, or a flattened `CNAME`) | `@` | the `*.azurestaticapps.net` hostname, without `https://` |

   On Cloudflare, set the record to **DNS only** (grey cloud). Proxying hides
   the app from Azure's validation and certificate renewal.

3. Wait for the domain's status to become **Ready** in *Custom domains*
   (usually minutes, up to 72 hours for apex domains), then open
   https://brindle.sh.

**Option B: the provider can't do `ALIAS` at the apex** (GoDaddy, Google
Domains successors and some others): move the domain's DNS to **Azure DNS**,
which can.

```sh
az network dns zone create --resource-group brindle-site --name brindle.sh
az network dns zone show --resource-group brindle-site --name brindle.sh \
  --query nameServers -o tsv
```

Set those four name servers at the registrar, wait for them to take effect
(`dig NS brindle.sh`), then in the portal choose *Custom domains → Add →
Custom domain on Azure DNS* and pick the zone. Azure creates the TXT and
alias records itself. Azure DNS costs about US$0.50 a month per zone.

(An `A` record pointing at the app's `stableInboundIP` also works, but it
sends every visitor to one region instead of the global edge. Avoid it.)

### 4. Add www.brindle.sh (optional)

First add a `CNAME` record `www` → the `*.azurestaticapps.net` hostname
(Azure validates subdomains by looking for it), then:

```sh
az staticwebapp hostname set --name brindle-site --resource-group brindle-site \
  --hostname www.brindle.sh
```

Then, in *Custom domains*, select `brindle.sh` and **Set default**: every other
hostname, including the `azurestaticapps.net` one, now redirects to it. The
Free plan allows two custom domains.

### If the certificate doesn't issue

- A `CAA` record on the domain must allow DigiCert, which Azure uses:
  `CAA 0 issue "digicert.com"`. With no `CAA` records at all, any CA is
  allowed and nothing needs adding.
- Check the TXT record is visible publicly: `dig TXT brindle.sh +short`.
- If the status shows **Failed**, delete the domain in *Custom domains* and add
  it again for a fresh token.
