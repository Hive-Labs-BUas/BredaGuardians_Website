# Host setup

One account, `web`, running the Actions runner. Nothing else on the host: no
compose file, no env file, no wrapper, no token. Everything comes from the
repository and from GitHub.

## Undo the earlier hardening

The runner needs the Docker socket, so the parts that closed it off have to go.

```bash
# the socket was root-only; give it back a group
sudo rm -f /etc/systemd/system/docker.socket.d/override.conf
sudo groupadd -f docker
sudo systemctl daemon-reload
sudo systemctl stop docker.service docker.socket
sudo systemctl start docker.socket docker.service

# expect: srw-rw---- root docker
ls -l /var/run/docker.sock
```

If you set up the wrapper and its grants earlier, remove them — they refer to
files that no longer exist:

```bash
sudo rm -f /usr/local/sbin/stack-ctl \
           /etc/sudoers.d/10-defaults \
           /etc/sudoers.d/40-web /etc/sudoers.d/42-dev \
           /etc/sudoers.d/43-web-ro /etc/sudoers.d/45-deploy \
           /etc/sudoers.d/45-web-deploy /etc/sudoers.d/46-dev-deploy
sudo rm -rf /srv/stacks
sudo visudo -c
```

## Keep userns-remap

This one is worth keeping even though it no longer guarantees much: it means a
container that does not ask to opt out runs as an unprivileged host uid.

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "userns-remap": "default",
  "no-new-privileges": true,
  "live-restore": true,
  "log-driver": "json-file",
  "log-opts": { "max-size": "20m", "max-file": "5" }
}
JSON

sudo systemctl restart docker
sudo docker info --format '{{.SecurityOptions}}'
```

## The account

```bash
sudo adduser --disabled-password --gecos "website runner" web
sudo usermod -aG docker web

# it never logs in over SSH
sudo sed -i 's/^AllowGroups.*/AllowGroups sudo/' /etc/ssh/sshd_config.d/01-access.conf
sudo sshd -t && sudo systemctl reload ssh
sudo sshd -T | grep -i allowgroups

id web
```

No password, no sudo, and absent from `AllowGroups`, so there is no way to log
in as it. What it does have is the Docker socket, which on this host is
equivalent to root — see the note at the end.

## The runner

```bash
V=2.337.0
SHA=70920811a4f8ad4328818682bca5c6469c1c942fab52448868071d0063816613

sudo -u web -H bash -c "
  set -euo pipefail
  mkdir -p /home/web/actions-runner && cd /home/web/actions-runner
  curl -fsSL -o runner.tar.gz \
    https://github.com/actions/runner/releases/download/v\$V/actions-runner-linux-x64-\$V.tar.gz
  echo '\$SHA  runner.tar.gz' | sha256sum -c
  tar xzf runner.tar.gz && rm runner.tar.gz
"
```

Take the version and checksum from the repository's Settings → Actions →
Runners → New self-hosted runner page; the ones above will age.

Register with the `web` label, using a token from that same page:

```bash
sudo -u web -H bash -c '
  cd /home/web/actions-runner
  ./config.sh \
    --url https://github.com/PlaySmart-Buas/BredaGuardians_Website \
    --token PASTE_A_FRESH_REGISTRATION_TOKEN \
    --name "$(hostname)-web" \
    --labels self-hosted,linux,x64,web \
    --unattended --replace
'

sudo bash -c 'cd /home/web/actions-runner && ./svc.sh install web && ./svc.sh start'
```

The account name after `install` matters. Without it the service runs as root,
and then so does every job.

```bash
UNIT=$(systemctl list-units --plain --no-legend 'actions.runner.*' | awk '{print $1}')
systemctl show "$UNIT" -p User          # must be web, never root
sudo systemctl enable "$UNIT"

sudo chmod 600 /home/web/actions-runner/.credentials \
               /home/web/actions-runner/.credentials_rsaparams \
               /home/web/actions-runner/.runner
```

Add a resource ceiling, so a runaway build cannot starve the containers:

```bash
sudo mkdir -p "/etc/systemd/system/$UNIT.d"
sudo tee "/etc/systemd/system/$UNIT.d/limits.conf" >/dev/null <<'CONF'
[Service]
MemoryMax=4G
CPUQuota=200%
TasksMax=1024
CONF
sudo systemctl daemon-reload
sudo systemctl restart "$UNIT"
```

Do not add `NoNewPrivileges=true` or `CapabilityBoundingSet=` — and do not add
`PrivateDevices`, `ProtectKernelTunables` or `RestrictNamespaces` either, since
several of those imply `NoNewPrivileges` and it breaks the Docker client in ways
that look like a daemon problem. Check with:

```bash
systemctl show "$UNIT" -p NoNewPrivileges    # want: no
```

## What GitHub holds

Settings → Environments, one named `production` and one `development`. In each,
a secret `TUNNEL_TOKEN` holding that environment's Cloudflare tunnel token —
two separate tunnels, so two separate public hostnames. The workflow reads
whichever one the branch selects and maps it onto `PROD_TUNNEL_TOKEN` or
`DEV_TUNNEL_TOKEN` for Compose.

On `production`, set *Deployment branches* to selected branches → `main`, and
require a review. That policy is the only thing stopping a `dev` branch from
reading the production token — the runner label cannot do it, because labels are
chosen in the workflow file.

## First deploy

Push to `dev`, watch Actions, then:

```bash
sudo docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'
ss -ltnp                              # ssh only; the tunnel dials out
curl -s https://YOUR-DEV-HOSTNAME/build.json
```

A `dev` push brings up `web-website-dev-1` and `web-tunnel-dev-1`. A `main`
push brings up `web-website-prod-1` and `web-tunnel-prod-1` alongside them,
without touching the dev pair. All four are one Compose project, so they are all
named `web-*`, and each pair sits on its own network with its own tunnel and its
own public hostname.

Deploying one side never disturbs the other, because the workflow passes
`--profile` and sets only that environment's variables. The one thing not to add
is `--remove-orphans`, which would treat the other profile's containers as
strays and stop them.

## The trade you have made

The `web` account can use the Docker socket, and on this host that is
root-equivalent. A compose file can set `userns_mode: host` and
`privileged: true` to opt out of the remapping above, and the compose file comes
from the repository — so anyone who can merge a pull request can run anything on
this machine as root.

Three things keep that manageable:

- **Private repository only.** On a public one, any stranger's pull request runs
  here. There is no setting that fixes this.
- **Protect `main`** with required reviews, so a compose change is seen by a
  person before it runs.
- **Treat the host as replaceable.** Nothing irreplaceable is stored on it now,
  which is the upside of keeping no state here: rebuilding is `adduser`, the
  runner, and a push.
