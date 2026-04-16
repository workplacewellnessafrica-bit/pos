$ErrorActionPreference = "Continue"

$files = @(
    "packages/api/package.json",
    "packages/shared/package.json",
    "packages/db/package.json",
    "apps/web-admin/package.json",
    "apps/web-marketing/package.json",
    "apps/pos-desktop/package.json",
    "apps/pos-mobile/package.json",
    "packages/api/src/realtime/socket.ts",
    "packages/api/src/modules/team/team.controller.ts",
    "packages/api/src/modules/products/products.router.ts",
    "packages/api/src/modules/orders/orders.controller.ts",
    "packages/api/src/modules/products/products.controller.ts",
    "packages/api/src/modules/inventory/inventory.controller.ts",
    "packages/api/src/modules/auth/auth.service.ts",
    "packages/api/src/modules/auth/auth.controller.ts",
    "packages/api/src/lib/payd.ts",
    "packages/api/src/middleware/auth.ts",
    "packages/api/src/config.ts",
    "apps/web-admin/src/stores/auth.ts",
    "apps/web-admin/src/pages/Team.tsx",
    "apps/web-admin/src/hooks/useSocket.ts"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw -Encoding UTF8
        $c = $c -replace '@dukapos/shared', '@shoplink/shared'
        $c = $c -replace '@dukapos/db', '@shoplink/db'
        $c = $c -replace '@dukapos/api', '@shoplink/api'
        $c = $c -replace '@dukapos/web-admin', '@shoplink/web-admin'
        $c = $c -replace '@dukapos/web-marketing', '@shoplink/web-marketing'
        $c = $c -replace '@dukapos/pos-desktop', '@shoplink/pos-desktop'
        $c = $c -replace '@dukapos/pos-mobile', '@shoplink/pos-mobile'
        $c = $c -replace '"name": "dukapos"', '"name": "shoplink"'
        $c = $c -replace '"packageManager": "pnpm@9\.0\.0"', '"packageManager": "pnpm@10.0.0"'
        $c = $c -replace 'noreply@dukapos\.com', 'noreply@shoplink.co'
        $c = $c -replace '"react": "\^18\.[0-9]+\.[0-9]+"', '"react": "^19.0.0"'
        $c = $c -replace '"react-dom": "\^18\.[0-9]+\.[0-9]+"', '"react-dom": "^19.0.0"'
        $c = $c -replace '"@types/react": "\^18\.[0-9]+\.[0-9]+"', '"@types/react": "^19.0.0"'
        $c = $c -replace '"@types/react-dom": "\^18\.[0-9]+\.[0-9]+"', '"@types/react-dom": "^19.0.0"'
        $c = $c -replace '"next": "\^14\.[0-9]+\.[0-9]+"', '"next": "^15.0.0"'
        Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $f"
    } else {
        Write-Host "Skipped (not found): $f"
    }
}
Write-Host "ALL DONE - now run pnpm install"
