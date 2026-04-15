$files = @(
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
        $content = Get-Content $f -Raw -Encoding UTF8
        $content = $content -replace '@dukapos/shared', '@shoplink/shared'
        $content = $content -replace '@dukapos/db', '@shoplink/db'
        $content = $content -replace 'noreply@dukapos\.com', 'noreply@shoplink.co'
        $content = $content -replace 'DukaPOS', 'ShopLink'
        $content = $content -replace 'dukapos', 'shoplink'
        Set-Content -Path $f -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $f"
    } else {
        Write-Host "Not found: $f"
    }
}
Write-Host "All done."
