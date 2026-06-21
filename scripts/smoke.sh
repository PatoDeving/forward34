#!/usr/bin/env bash
# scripts/smoke.sh — smoke test contra una URL desplegada de forward34
# (preview de Vercel o producción). Hace requests reales por HTTP y verifica
# que las páginas, assets y endpoints clave respondan con el status y
# content-type esperado. Si algo se rompe, sale con código != 0.
#
# Uso:
#   ./scripts/smoke.sh                                 # contra forward34.com
#   ./scripts/smoke.sh https://mi-preview.vercel.app   # contra un preview
#
# Cuándo correrlo:
#   - SIEMPRE después de mergear cualquier cambio a vercel.json.
#   - SIEMPRE antes de mergear una PR que toque vercel.json (contra el
#     preview link que comenta el bot de Vercel).
#   - Como sanity check periódico.

set -uo pipefail

BASE="${1:-https://forward34.com}"
FAILS=0
PASSES=0

# check <descripcion> <url-path> <status-esperado> [content-type-regex]
check() {
    local desc="$1" path="$2" want_status="$3" want_ct="${4:-}"
    local url="${BASE%/}${path}"
    local out got_status got_ct
    out=$(curl -sS -L -o /dev/null -w "%{http_code}|%{content_type}" -m 10 "$url" 2>/dev/null || echo "000|error")
    got_status="${out%%|*}"
    got_ct="${out##*|}"

    if [[ "$got_status" != "$want_status" ]]; then
        printf "  ❌ %-60s status %s (esperado %s)\n" "$desc" "$got_status" "$want_status"
        FAILS=$((FAILS+1))
        return
    fi
    if [[ -n "$want_ct" && ! "$got_ct" =~ $want_ct ]]; then
        printf "  ❌ %-60s content-type %s (esperado %s)\n" "$desc" "$got_ct" "$want_ct"
        FAILS=$((FAILS+1))
        return
    fi
    printf "  ✅ %-60s %s %s\n" "$desc" "$got_status" "$got_ct"
    PASSES=$((PASSES+1))
}

# check_body <descripcion> <url-path> <string-que-DEBE-aparecer>
check_body() {
    local desc="$1" path="$2" want="$3"
    local url="${BASE%/}${path}"
    local body
    body=$(curl -sS -L -m 10 "$url" 2>/dev/null || echo "")
    if echo "$body" | grep -q -- "$want"; then
        printf "  ✅ %-60s body~%s\n" "$desc" "$want"
        PASSES=$((PASSES+1))
    else
        printf "  ❌ %-60s body NO contiene %s\n" "$desc" "$want"
        FAILS=$((FAILS+1))
    fi
}

# check_body_not <descripcion> <url-path> <string-que-NO-debe-aparecer>
check_body_not() {
    local desc="$1" path="$2" forbidden="$3"
    local url="${BASE%/}${path}"
    local body
    body=$(curl -sS -L -m 10 "$url" 2>/dev/null || echo "")
    if echo "$body" | grep -q -- "$forbidden"; then
        printf "  ❌ %-60s body CONTIENE %s\n" "$desc" "$forbidden"
        FAILS=$((FAILS+1))
    else
        printf "  ✅ %-60s body sin %s\n" "$desc" "$forbidden"
        PASSES=$((PASSES+1))
    fi
}

echo ""
echo "▶ smoke test contra: $BASE"
echo ""

echo "── Páginas (deben dar 200 + HTML) ──────────────────────────────────"
check "home (raíz)"                      "/"                       "200" "html"
check "consultoria-ia.html"              "/consultoria-ia.html"    "200" "html"
check "servicios.html"                   "/servicios.html"         "200" "html"
check "empresa.html"                     "/empresa.html"           "200" "html"
check "descubrete.html"                  "/descubrete.html"        "200" "html"
check "contacto.html"                    "/contacto.html"          "200" "html"

echo ""
echo "── Contenido crítico de la home (asegura que NO es el 404 de Vercel) ──"
check_body     "home tiene el logo Forward34"   "/"                "Forward34"
check_body_not "home NO devuelve el 404 genérico de Vercel" "/"   "NOT_FOUND"

echo ""
echo "── Favicon y assets (deben dar 200) ────────────────────────────────"
check "favicon.ico (raíz)"               "/favicon.ico"            "200" "icon|image"
check "favicon.svg"                      "/public/favicon.svg"     "200" "svg"
check "apple-touch-icon"                 "/public/apple-touch-icon.png" "200" "png"
check "site.webmanifest"                 "/public/site.webmanifest" "200" "manifest|json"
check "css principal"                    "/public/css/styles.css"  "200" "css"
check "js del assessment"                "/public/js/assessment.js" "200" "javascript"

echo ""
echo "── SEO assets ──────────────────────────────────────────────────────"
check "robots.txt"                       "/robots.txt"             "200" "text"
check "sitemap.xml"                      "/sitemap.xml"            "200" "xml"
check "og-default.png"                   "/public/images/og-default.png" "200" "png"

echo ""
echo "── Endpoints /api (deben rechazar GET con 405 — prueban que el handler existe) ──"
check "/api/lead acepta el método POST"    "/api/lead"             "405"
check "/api/contact acepta el método POST" "/api/contact"          "405"

echo ""
echo "── 404 branded (no debe ser el genérico de Vercel) ─────────────────"
check "URL inexistente da 404"           "/no-existe-jamas"        "404"
check_body "404 muestra el branding de Forward34" "/no-existe-jamas" "Esta página"

echo ""
echo "─────────────────────────────────────────────────────────────────────"
TOTAL=$((PASSES+FAILS))
if [[ $FAILS -eq 0 ]]; then
    echo "✅ smoke OK — $PASSES/$TOTAL checks pasaron"
    exit 0
else
    echo "❌ smoke FALLÓ — $FAILS de $TOTAL checks rotos"
    echo ""
    echo "Si esto pasó después de mergear, considera revertir el último commit"
    echo "que tocó vercel.json. Ver POSTMORTEM-vercel-config.md."
    exit 1
fi
