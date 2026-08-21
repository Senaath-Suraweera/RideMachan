# RideMachan — Hosting & Deployment

Everything needed to build, deploy, and run RideMachan, plus the reasoning behind
the setup so the next person doesn't have to rediscover it.

> **Fill these in:** `<dockerhub-user>` and `<render-service>` appear throughout.
> Replace them with your actual Docker Hub account and Render service name.

---

## 1. The stack

| Layer | What it is |
|---|---|
| Application | Java 17, Jakarta Servlets, packaged as a **WAR** |
| Web server | Apache Tomcat 11 (implements Servlet 6.1) |
| Database | MySQL 8 on **Aiven** (managed, external) |
| Container registry | Docker Hub |
| Hosting | Render (Docker deploy) |

There is no framework here — no Spring, no CDI. It's servlets, JDBC, and static
HTML/JS served from the same WAR.

---

## 2. How the pieces fit together

```
Browser
   │  HTTPS
   ▼
Render Web Service  ──  runs <dockerhub-user>/ridemachan:latest
   │                     (Tomcat 11, app deployed as ROOT.war)
   │  TLS (sslMode=REQUIRED)
   ▼
Aiven MySQL 8   mysql-ridemachan-ride-machan.j.aivencloud.com:13170
```

The frontend is served by the **same** container as the API. There is no separate
static host and no CORS involved — every `fetch()` in the JS uses a relative path
and hits the same origin.

### Why the app deploys as `ROOT.war`

The Dockerfile copies the WAR to `webapps/ROOT.war` rather than
`webapps/RideMachan.war`. That makes the app serve at `/` instead of `/RideMachan/`.

This is **not** cosmetic. The frontend is full of root-relative paths like
`/api/notifications` and `/views/landing/index.html`. If the app were deployed under
a context path, every one of those would 404. If you ever change the WAR name, you
must rewrite all of those paths too.

### The landing page at `/`

Visiting `/` serves `index.jsp`, which Tomcat picks up as the welcome file. That
file does one thing: redirect (302) to `/views/landing/index.html`.

It is a **redirect, not a forward**, deliberately. `views/landing/index.html`
references its assets relatively — `styles.css`, `../../logo.png`,
`customer_sign-in.html`. A forward would leave the browser's address bar at `/`, so
those would resolve against the wrong base and every stylesheet, image, and nav link
would 404. Redirecting moves the browser to the real path first, so relative
resolution works.

The redirect uses `request.getContextPath()`, so it is correct both on Render
(deployed as ROOT, empty context path) and under a named context locally.

---

## 3. Environment variables

Set these in the Render dashboard under **Environment**.

### Required

| Variable | Value | Notes |
|---|---|---|
| `DB_PASSWORD` | *(Aiven password)* | **No default.** The app throws on startup without it. |
| `MAIL_PASSWORD` | *(Gmail app password)* | Needed for OTP and notification emails. |
| `PORT` | `8080` | Tomcat's listening port, so Render routes to it. |

### Optional — defaults already target Aiven

| Variable | Default | Override when |
|---|---|---|
| `DB_HOST` | `mysql-ridemachan-ride-machan.j.aivencloud.com` | Running against local MySQL |
| `DB_PORT` | `13170` | Running against local MySQL (`3306`) |
| `DB_NAME` | `RideMachan` | — |
| `DB_USER` | `avnadmin` | Local MySQL (`root`) |
| `DB_SSL_MODE` | `REQUIRED` | Local MySQL (`DISABLED`) |
| `DB_POOL_SIZE` | `8` | You move off Aiven's free plan |
| `MAIL_USER` | `ridemachan.help@gmail.com` | Sending from a different account |

**Nothing sensitive is committed to the repository.** `DBConnection` and
`GmailSender` both read from the environment. `DB_PASSWORD` deliberately has no
fallback — an app that silently starts with the wrong database is worse than one
that refuses to start.

---

## 4. Database

### Connection

Managed MySQL 8 on Aiven. TLS is mandatory — Aiven refuses plaintext connections,
which is why the JDBC URL carries `sslMode=REQUIRED`.

### Connection pooling

Connections are pooled with **HikariCP**. This matters more than it sounds: the app
opens a connection per request, and against a *remote* database that means a full
TCP + TLS handshake every time. Without pooling the app is unusably slow on Render.

Pool settings in `common/util/DBConnection.java`:

- `maximumPoolSize` **8** — Aiven's free plan caps concurrent connections
- `maxLifetime` **10 min** — retires connections before Aiven's server-side idle
  timeout can close them underneath us
- `leakDetectionThreshold` **30 s** — logs any code path that borrows a connection
  and never closes it

### ⚠️ Table names must be lowercase

**This is the single biggest gotcha in this project.**

MySQL takes its table-name case sensitivity from the host filesystem:

- **macOS** (local dev) — case-**in**sensitive. `Admin` and `admin` are one table.
- **Linux** (Aiven, and any real host) — case-**sensitive**. They are two tables.

The codebase originally used inconsistent casing for the same table — `Vehicle` in
71 places and `vehicle` in 32, `RentalCompany` ×30 vs `rentalcompany` ×18, and so
on. Locally this worked fine. On Aiven it produced:

```
java.sql.SQLSyntaxErrorException: Table 'RideMachan.Admin' doesn't exist
```

No table rename could fix that, because whichever case you pick, the other half of
the queries break. It was fixed on **both** sides:

1. **Code** — every SQL table identifier lowercased across 46 files.
2. **Database** — `db/rename_tables_lowercase.sql` renames the 19 mixed-case tables.

**Rule going forward: always write table names in lowercase in SQL.** If you add a
table, create it lowercase. Local macOS will not catch a violation — only the
deployed environment will.

Applying the rename (idempotent, safe to re-run):

```bash
mysql -h mysql-ridemachan-ride-machan.j.aivencloud.com -P 13170 \
  -u avnadmin -p --ssl-mode=REQUIRED RideMachan \
  < db/rename_tables_lowercase.sql
```

Run it against your **local** database too. It changes nothing behaviourally there,
but it keeps both environments identical so this bug can't hide again.

### Storage note

Images (NIC scans, licences, vehicle photos, profile pictures) are stored as
`LONGBLOB` columns **inside the database** — 9 such columns. The database was
~55 MB at migration, ~44 MB of it BLOBs. Every vehicle upload adds several MB.

This will eventually exhaust the free plan. The real fix is moving images to object
storage and keeping only URLs in the database.

---

## 5. Building and pushing the image

The image **must** be `linux/amd64`. Render runs amd64; an arm64 image built on an
M-series Mac will not start there.

```bash
docker buildx build --platform linux/amd64 \
  --provenance=false \
  -t <dockerhub-user>/ridemachan:latest \
  --push .
```

### Why each flag

- **`--platform linux/amd64`** — targets Render's architecture.
- **`--provenance=false`** — buildx otherwise attaches an attestation manifest,
  turning the result into a multi-entry manifest list. Some hosts mis-resolve that
  and pull the attestation instead of the image, failing with a confusing
  "no matching manifest" error. This keeps it a clean single-platform image.
- **`--push`** — pushes straight from buildx. (`--load` only imports a single
  platform into the local daemon and is just a detour when you're publishing.)

### Why the build is fast despite cross-compiling

The Dockerfile pins the build stage to `--platform=$BUILDPLATFORM`. A WAR is pure
bytecode and architecture-independent, so Maven runs **natively** on your machine
and only the Tomcat runtime layer is amd64. Without that pin, the entire Maven build
runs under QEMU emulation — minutes instead of ~30 seconds.

### Verify what you pushed

```bash
docker buildx imagetools inspect <dockerhub-user>/ridemachan:latest
```

Expect exactly one entry: `linux/amd64`.

---

## 6. Deploying on Render

1. **New → Web Service → Deploy an existing image from a registry**
2. Image URL: `<dockerhub-user>/ridemachan:latest`
   (add Docker Hub credentials if the repo is private)
3. Set the environment variables from §3 — `DB_PASSWORD` at minimum
4. Deploy

### Free tier behaviour

Free web services **sleep after ~15 minutes of inactivity**, and the next request
takes roughly a minute while the container cold-starts.

For a live demo or viva, hit the URL a few minutes beforehand to wake it.

---

## 6a. Updating a live deployment

### Does this change even need a rebuild?

| What changed | Rebuild + push? | How to apply |
|---|---|---|
| Java, HTML, CSS, JS, `pom.xml`, `Dockerfile` | **Yes** | Full cycle below |
| An environment variable | No | Edit it in Render — saving redeploys automatically |
| Database data or schema (incl. the rename script) | No | Run SQL against Aiven directly |
| Rolling back to a previous build | No | Render → **Rollback** (see below) |

Anything baked into the WAR needs a rebuild. Anything outside it does not.

### The two-step cycle

**Step 1 — build and push to Docker Hub**

```bash
docker login    # once per machine

docker buildx build --platform linux/amd64 \
  --provenance=false \
  -t <dockerhub-user>/ridemachan:latest \
  --push .
```

This rebuilds and uploads in one command. Docker Hub moves the `latest` tag to the
new image; the old one stays in the registry, just untagged.

**Step 2 — tell Render to pull it**

Render → your service → **Manual Deploy** → **Deploy latest reference**.

> ⚠️ **Pushing to Docker Hub does not deploy anything.** Render does not watch the
> registry — it pulls only when a deploy is triggered. If your changes "aren't
> showing up", this is almost always why. Confirm the new image is live by checking
> that the deploy's start time is *after* your push.

### One-command deploys with a Deploy Hook

To avoid the dashboard step: Render → **Settings** → **Deploy Hook**, copy the URL,
then:

```bash
docker buildx build --platform linux/amd64 --provenance=false \
  -t <dockerhub-user>/ridemachan:latest --push . \
  && curl -X POST "<your-deploy-hook-url>"
```

Treat that URL as a secret — anyone holding it can trigger deploys. Keep it out of
the repository.

### Confirming the update actually landed

Watch Render's **Logs** for a fresh startup sequence:

```
Deployment of web application archive ... has finished
RideMachanPool - Start completed.
```

Then check the app itself:

```bash
curl -o /dev/null -w "%{http_code}\n" -L https://<render-service>.onrender.com/
curl https://<render-service>.onrender.com/customer/getCompanies
```

Expect `200` and real JSON. If you get stale content, your browser is caching —
hard-reload (**Cmd+Shift+R**). This is common after CSS or JS changes, and it looks
exactly like a failed deploy.

### Versioned tags and rollback

Deploying only `:latest` means there is no earlier version to go back to — each push
overwrites the tag. For anything you'd need to recover from, push two tags at once:

```bash
docker buildx build --platform linux/amd64 --provenance=false \
  -t <dockerhub-user>/ridemachan:latest \
  -t <dockerhub-user>/ridemachan:v1.0.3 \
  --push .
```

`latest` stays the moving target; `v1.0.3` is a permanent, immutable reference you
can point Render at if a deploy goes wrong.

Render also keeps its own deploy history — **Events** → pick a previous successful
deploy → **Rollback**. That's the fastest recovery and needs no rebuild. Worth
knowing where this button is *before* you need it.

### Before pushing — a 30-second local check

Cheaper than finding out from a failed deploy:

```bash
docker build -t ridemachan:local .
docker run --rm -p 8080:8080 -e DB_PASSWORD='<aiven-password>' ridemachan:local
```

Then hit <http://localhost:8080> and confirm the landing page loads. A plain
`docker build` (no `--platform`) is fine here — it builds natively and runs faster
for a smoke test. Just remember the **push** must be `linux/amd64`.

---

## 7. Running locally

### With Docker, against Aiven

```bash
docker build -t ridemachan:local .
docker run --rm -p 8080:8080 \
  -e DB_PASSWORD='<aiven-password>' \
  -e MAIL_PASSWORD='<gmail-app-password>' \
  ridemachan:local
```

→ <http://localhost:8080>

⚠️ This writes to the **production** database. Prefer the local-database option
below for development.

### With Docker, against local MySQL

```bash
docker run --rm -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD='<local-mysql-password>' \
  -e DB_SSL_MODE=DISABLED \
  ridemachan:local
```

`host.docker.internal` is how a container reaches a service on the Mac host —
`localhost` inside the container refers to the container itself.

### Without Docker (IntelliJ / local Tomcat)

Build the WAR:

```bash
./mvnw clean package -DskipTests
# → target/RideMachan-1.0-SNAPSHOT.war
```

Deploy it to a **Tomcat 11** instance, with the app mapped to the **root context
(`/`)** — see §2. Set the same environment variables in your run configuration;
`DB_PASSWORD` is required.

### Smoke test

```bash
curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/views/landing/index.html
curl http://localhost:8080/customer/getCompanies
```

Expect `200` and a JSON list of rental companies. If the second returns data, the
database connection, TLS, and pooling are all working.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Container exits instantly, `IllegalStateException: DB_PASSWORD ... not set` | Env var missing | Set `DB_PASSWORD` in Render |
| `Table 'RideMachan.X' doesn't exist` | Mixed-case table names | Run `db/rename_tables_lowercase.sql` (§4) |
| `Access denied for user 'avnadmin'` | Wrong password | Check `DB_PASSWORD` against the Aiven console |
| Pool hangs, then connection timeout | Wrong host/port, or Aiven service paused | Verify: `nc -zv <host> 13170` |
| `Communications link failure` / TLS error | `DB_SSL_MODE` not `REQUIRED` | Aiven mandates TLS |
| Everything 404s except `/` | WAR not deployed as ROOT | See §2 |
| Image won't start on Render | arm64 image | Rebuild with `--platform linux/amd64` |
| "no matching manifest" | buildx attestation manifest | Rebuild with `--provenance=false` |
| First request after idle takes ~1 min | Free tier cold start | Expected — pre-warm before demos |
| `IllegalStateException: MAIL_PASSWORD ... not set` | Env var missing | Set `MAIL_PASSWORD` |

### Reading the logs

Render → your service → **Logs**. Useful markers:

- `RideMachanPool - Starting...` → pool initialising
- `RideMachanPool - Start completed.` → **database connection is working**
- `Apache Tomcat/11.0.x` + `Deployment of web application archive ... has finished`
  → app deployed successfully

HikariCP logs through SLF4J, bound to `slf4j-simple` **1.7.36** — matching the
`slf4j-api` version HikariCP pulls in. This binding is load-bearing: with a
mismatched or missing binding, SLF4J falls back to a no-op logger and silently
discards every database error, which makes a broken connection impossible to
diagnose from the logs.

---

## 9. Known issues — not yet fixed

Documented honestly so nobody is surprised.

### Security

- **No authentication filter exists.** 31 of ~40 admin servlets never check the
  session. On a public URL, anyone who finds `/admin/delete` can use it. This is
  the most serious outstanding issue.
- **Payment is simulated.** `CustomerConfirmPaymentServlet` has no gateway, no
  session check, and no amount verification — it sets `payment_status='paid'` for
  any supplied ride ID.
- **Passwords** use single-round salted SHA-256 with no key stretching.
- **Rotate the old credentials.** The previous MySQL and Gmail passwords are still
  in git history. Removing them from source does not remove them from past commits.

### Broken endpoints

| Frontend call | Problem |
|---|---|
| `/displayfleethealth` | No servlet exists — maintenance dashboard widget fails |
| `/api/admin/profile` | Servlet is at `/admin/profile` |
| `/maintenancerecords/list` | Servlet is at `/company/maintenancerecords/list` |

### Incomplete features

- **Promotions** (admin) — client-side dummy data only; no table, no servlet
- **Chat attachments** — "coming soon" in all five message clients
- Company fleet pages read `vehicle.lastService`, `.nextService`, `.emissionTest`,
  `.insuranceExpiry` — none of which exist on any model, so they render blank
- Three near-duplicate vehicle modules (`vehicle/`,
  `rentalcompany/companyvehicle/`, `individualprovider/VehicleServlet`) with
  divergent models

---

## 10. File reference

| Path | Purpose |
|---|---|
| `Dockerfile` | Two-stage build → Tomcat 11 runtime |
| `.dockerignore` | Keeps the build context small; excludes `*.sql` dumps |
| `db/rename_tables_lowercase.sql` | Lowercases table names (§4) |
| `db/create_ridemachan.sql` | Original schema — **may have drifted**; dump the live DB instead |
| `src/main/java/common/util/DBConnection.java` | Pooled, env-configured connections |
| `src/main/java/common/util/GmailSender.java` | SMTP sender, credentials from env |

### Never commit

Database dumps contain **real user data**, including NIC and driver's licence
images. `.gitignore` covers `*_dump.sql` and `.env` — keep it that way.
