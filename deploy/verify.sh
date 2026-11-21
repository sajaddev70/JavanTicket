#!/usr/bin/env bash
# Run on the SERVER (or any machine with curl/openssl/dig) after deploying. Read-only: it only sends requests.
# Prints PASS / FAIL / WARN per check and exits non-zero if anything failed.
#
#   bash /opt/sakooticket/deploy/verify.sh
#   SERVER_IP=87.107.164.153 bash deploy/verify.sh
set -uo pipefail

SERVER_IP="${SERVER_IP:-87.107.164.153}"
APEX=sakooticket.ir
DOMAINS=(sakooticket.ir www.sakooticket.ir panel.sakooticket.ir adm.sakooticket.ir)
PASS=0; FAIL=0; WARN=0

pass() { printf '  \033[32mPASS\033[0m %s\n' "$*"; PASS=$((PASS+1)); }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$*"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[33mWARN\033[0m %s\n' "$*"; WARN=$((WARN+1)); }
section() { printf '\n== %s ==\n' "$*"; }

# status URL [extra curl args]
status() { curl -sS -o /dev/null -m 20 -w '%{http_code}' "$@" 2>/dev/null || echo 000; }
location() { curl -sS -o /dev/null -m 20 -w '%{redirect_url}' "$@" 2>/dev/null; }
header() { curl -sS -o /dev/null -m 20 -D - "$2" 2>/dev/null | tr -d '\r' | grep -i "^$1:" | head -1 | cut -d' ' -f2-; }

expect_status() { # name expected url [curl args]
  local name="$1" want="$2" url="$3"; shift 3
  local got; got="$(status "$url" "$@")"
  if [ "$got" = "$want" ]; then pass "$name ($got)"; else fail "$name: expected $want, got $got  [$url]"; fi
}
expect_redirect() { # name url expected-location
  local got; got="$(location "$2")"
  if [ "$got" = "$3" ]; then pass "$1 -> $3"; else fail "$1: expected redirect to $3, got '${got:-none}'"; fi
}

section "DNS (must resolve to $SERVER_IP)"
for d in "${DOMAINS[@]}"; do
  ips="$(dig +short A "$d" @8.8.8.8 2>/dev/null | tr '\n' ' ')"; [ -n "$ips" ] || ips="$(dig +short A "$d" | tr '\n' ' ')"
  case " $ips " in *" $SERVER_IP "*) pass "$d -> $ips" ;; *) fail "$d -> ${ips:-<none>}" ;; esac
done

section "HTTP -> HTTPS (301)"
expect_redirect "http://sakooticket.ir"        "http://sakooticket.ir/events?x=1"       "https://sakooticket.ir/events?x=1"
expect_redirect "http://www.sakooticket.ir"    "http://www.sakooticket.ir/a"            "https://sakooticket.ir/a"
expect_redirect "http://panel.sakooticket.ir"  "http://panel.sakooticket.ir/"           "https://panel.sakooticket.ir/"
expect_redirect "http://adm.sakooticket.ir"    "http://adm.sakooticket.ir/admin/login"  "https://adm.sakooticket.ir/admin/login"
for d in "${DOMAINS[@]}"; do expect_status "http://$d status" 301 "http://$d/"; done

section "Certificate"
for d in "${DOMAINS[@]}"; do
  out="$(echo | openssl s_client -connect "$d:443" -servername "$d" -verify_return_error 2>/dev/null)"
  if echo "$out" | grep -q 'Verify return code: 0 (ok)'; then
    end="$(echo "$out" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)"
    pass "$d valid chain, expires $end"
  else
    fail "$d certificate not valid: $(echo "$out" | grep 'Verify return code' | head -1)"
  fi
done
if command -v certbot >/dev/null && [ "$(id -u)" -eq 0 ]; then
  systemctl is-active --quiet certbot.timer && pass "certbot.timer active (auto-renewal)" || fail "certbot.timer not active"
fi

section "Main website https://$APEX"
expect_status "home page"                    200 "https://$APEX/"
expect_status "inner route /events (direct load)" 200 "https://$APEX/events"
expect_status "login page"                   200 "https://$APEX/login"
expect_status "unknown page -> 404"          404 "https://$APEX/this-page-does-not-exist-xyz"
asset="$(curl -sS -m 20 "https://$APEX/" | grep -oE '/_next/static/[^"]+\.(js|css)' | head -1)"
if [ -n "$asset" ]; then
  expect_status "static asset $asset" 200 "https://$APEX$asset"
  cc="$(header Cache-Control "https://$APEX$asset")"
  case "$cc" in *immutable*|*max-age=31536000*) pass "static asset cached ($cc)";; *) warn "static asset Cache-Control: '$cc'";; esac
else
  fail "no /_next/static asset found in home page HTML"
fi
if curl -sS -m 20 "https://$APEX/" | grep -qE 'http://(localhost|127\.0\.0\.1)|:8080/'; then
  fail "home page HTML references localhost or :8080"
else
  pass "no localhost/:8080 references in home page HTML"
fi
expect_status "built-in media /media/" 200 "https://$APEX/media/events/concert.webp"

section "API"
expect_status "public API site-settings"             200 "https://$APEX/api/v1/public/site-settings"
expect_status "user API without token -> 401"        401 "https://$APEX/api/v1/user/orders"
expect_status "admin API without token -> 401"       401 "https://$APEX/api/v1/admin/dashboard"
expect_status "admin API with forged token -> 401"   401 "https://$APEX/api/v1/admin/dashboard" -H "Authorization: Bearer invalid.token.value"
expect_status "swagger not exposed"                  404 "https://$APEX/swagger-ui.html"
expect_status "api-docs not exposed"                 404 "https://$APEX/api-docs"
cors="$(curl -sS -o /dev/null -m 20 -D - -X OPTIONS "https://$APEX/api/v1/public/site-settings" \
  -H "Origin: https://adm.sakooticket.ir" -H "Access-Control-Request-Method: GET" 2>/dev/null | tr -d '\r' | grep -i '^access-control-allow-origin:' | cut -d' ' -f2)"
[ "$cors" = "https://adm.sakooticket.ir" ] && pass "CORS allows https://adm.sakooticket.ir" || fail "CORS for adm origin: '${cors:-none}'"
evil="$(status "https://$APEX/api/v1/public/site-settings" -X OPTIONS -H "Origin: https://evil.example" -H "Access-Control-Request-Method: GET")"
[ "$evil" = "403" ] && pass "CORS rejects foreign origin (403)" || fail "CORS foreign origin got $evil (expected 403)"

section "User panel https://panel.$APEX"
expect_redirect "panel root"      "https://panel.$APEX/"                  "https://$APEX/profile"
expect_redirect "panel deep link" "https://panel.$APEX/profile/tickets"   "https://$APEX/profile/tickets"
expect_status "account page /profile" 200 "https://$APEX/profile"

section "Admin panel https://adm.$APEX"
expect_redirect "adm root" "https://adm.$APEX/" "https://adm.$APEX/admin"
expect_status "admin login page" 200 "https://adm.$APEX/admin/login"
expect_status "admin inner route (direct load)" 200 "https://adm.$APEX/admin/dashboard"
robots="$(header X-Robots-Tag "https://adm.$APEX/admin/login")"
case "$robots" in *noindex*) pass "admin X-Robots-Tag: $robots";; *) fail "admin missing X-Robots-Tag noindex";; esac

section "Security headers"
for u in "https://$APEX/" "https://adm.$APEX/admin/login"; do
  for h in Strict-Transport-Security X-Content-Type-Options X-Frame-Options Referrer-Policy; do
    v="$(header "$h" "$u")"; [ -n "$v" ] && pass "$h on $u" || fail "$h missing on $u"
  done
  srv="$(header Server "$u")"; case "$srv" in nginx|"") pass "Server header has no version ($u)";; *) warn "Server header: $srv";; esac
  pw="$(header X-Powered-By "$u")"; [ -z "$pw" ] && pass "no X-Powered-By ($u)" || fail "X-Powered-By: $pw ($u)"
done

section "Exposure (from this machine to the public IP)"
for p in 3000 3001 5432 8080; do
  if timeout 5 bash -c "</dev/tcp/$SERVER_IP/$p" 2>/dev/null; then fail "port $p is reachable on $SERVER_IP"; else pass "port $p closed on $SERVER_IP"; fi
done
if command -v ss >/dev/null; then
  bad="$(ss -ltnH 2>/dev/null | awk '{print $4}' | grep -E ':(3000|3001|5432|8080)$' | grep -vE '^(127\.0\.0\.1|\[::1\]):' || true)"
  [ -z "$bad" ] && pass "internal ports bound to loopback only" || fail "internal ports on public interfaces: $bad"
fi

section "Containers"
if command -v docker >/dev/null; then
  for c in sakooticket-db sakooticket-backend sakooticket-admin sakooticket-user; do
    st="$(docker inspect -f '{{.State.Status}}/{{if .State.Health}}{{.State.Health.Status}}{{end}}/{{.HostConfig.RestartPolicy.Name}}' "$c" 2>/dev/null || echo missing)"
    case "$st" in running/healthy/unless-stopped) pass "$c $st";; *) fail "$c $st";; esac
  done
  systemctl is-enabled --quiet docker 2>/dev/null && pass "docker starts on boot" || warn "docker service not enabled on boot"
fi

printf '\nResult: %d passed, %d failed, %d warnings\n' "$PASS" "$FAIL" "$WARN"
[ "$FAIL" -eq 0 ]
