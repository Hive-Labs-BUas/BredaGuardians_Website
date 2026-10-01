#!/usr/bin/env python3
"""Refuse to deploy a compose file that weakens container isolation.

The compose file comes from the repository and the deploy account can reach the
Docker socket, so anything this file asks for, it gets. A pull request that adds
privileged: true would undo every other control on the host. This asserts the
hardening is present rather than only scanning for bad strings.
"""
import sys, yaml

BANNED_KEYS = {
    "privileged":   "grants almost all capabilities; a trivial host escape",
    "userns_mode":  "opts out of daemon userns-remap, making container root host root",
    "network_mode": "host networking bypasses the container network entirely",
    "pid":          "sharing the host PID namespace exposes every host process",
    "ipc":          "sharing the host IPC namespace exposes host shared memory",
    "cap_add":      "adds back a capability that cap_drop: ALL removed",
    "devices":      "passes a host device through to the container",
    "sysctls":      "changes kernel parameters from inside the container",
}

REQUIRED = {
    "read_only":  True,
    "cap_drop":   ["ALL"],
}

DANGEROUS_MOUNTS = ("docker.sock", "/var/run/docker", "/proc", "/sys", "/etc", "/dev")

def fail(msg):
    print(f"::error::{msg}")
    return 1

def main(path):
    doc = yaml.safe_load(open(path))
    bad = 0

    for name, svc in (doc.get("services") or {}).items():
        for key, why in BANNED_KEYS.items():
            if key in svc:
                bad |= fail(f"{name}: '{key}' is not permitted — {why}")

        for key, want in REQUIRED.items():
            if svc.get(key) != want:
                bad |= fail(f"{name}: '{key}' must be {want!r}, found {svc.get(key)!r}")

        user = str(svc.get("user", ""))
        if not user or user.split(":")[0] in ("0", "root"):
            bad |= fail(f"{name}: must set a non-root 'user', found {user!r}")

        for opt in svc.get("security_opt") or []:
            if "unconfined" in str(opt):
                bad |= fail(f"{name}: security_opt '{opt}' disables a sandbox")
        if "no-new-privileges:true" not in (svc.get("security_opt") or []):
            bad |= fail(f"{name}: security_opt must include no-new-privileges:true")

        for vol in svc.get("volumes") or []:
            src = vol.get("source", "") if isinstance(vol, dict) else str(vol).split(":")[0]
            if any(d in src for d in DANGEROUS_MOUNTS):
                bad |= fail(f"{name}: refuses to mount host path '{src}'")

        for t in svc.get("tmpfs") or []:
            if "noexec" not in str(t):
                bad |= fail(f"{name}: tmpfs '{t}' must be noexec")

        if not any(k in svc for k in ("mem_limit", "deploy")):
            bad |= fail(f"{name}: must set mem_limit")

    if bad:
        print("::error::compose file weakens container isolation — refusing to deploy")
        return 1
    print(f"{path}: all services pass the isolation checks")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "docker-compose.yml"))
