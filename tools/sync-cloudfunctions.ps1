$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Source = Join-Path $ProjectRoot 'cloudfunctions'
$TargetRoot = Join-Path $ProjectRoot 'unpackage\dist\dev\mp-weixin'
$Target = Join-Path $TargetRoot 'cloudfunctions'
$ConfigPath = Join-Path $TargetRoot 'project.config.json'
$AppJsonPath = Join-Path $TargetRoot 'app.json'
$PagesJsonPath = Join-Path $ProjectRoot 'pages.json'

if (!(Test-Path -LiteralPath $Source)) {
  throw "cloudfunctions directory not found: $Source"
}

if (!(Test-Path -LiteralPath $TargetRoot)) {
  throw "WeChat build output not found. Please run the Uniapp project to mp-weixin first."
}

if (Test-Path -LiteralPath $Target) {
  Remove-Item -LiteralPath $Target -Recurse -Force
}

Copy-Item -LiteralPath $Source -Destination $Target -Recurse

$configText = Get-Content -Raw -LiteralPath $ConfigPath
$configText = $configText -replace '(?m)^\s*"description"\s*:\s*.*$', '  "description": "errand_app",'
if ($configText -match '"cloudfunctionRoot"\s*:') {
  $configText = $configText -replace '"cloudfunctionRoot"\s*:\s*"[^"]*"', '"cloudfunctionRoot": "cloudfunctions/"'
} else {
  $replacement = '"compileType": "miniprogram",' + "`r`n  " + '"cloudfunctionRoot": "cloudfunctions/",'
  $configText = $configText -replace '"compileType"\s*:\s*"miniprogram"\s*,', $replacement
}
$configText = $configText -replace '"minified"\s*:\s*false', '"minified": true'
$configText = $configText -replace '"postcss"\s*:\s*false', '"postcss": true'
$configText = $configText -replace '"es6"\s*:\s*false', '"es6": true'
$ignoreBlock = @'
"packOptions": {
    "ignore": [
      {
        "type": "folder",
        "value": "cloudfunctions"
      },
      {
        "type": "folder",
        "value": "uni_modules/uni-file-picker"
      },
      {
        "type": "folder",
        "value": "uni_modules/uni-row"
      },
      {
        "type": "folder",
        "value": "uni_modules/uni-load-more"
      },
      {
        "type": "folder",
        "value": "uni_modules/uni-section"
      },
      {
        "type": "folder",
        "value": "uni_modules/uni-number-box"
      }
    ]
  }
'@
$configText = [regex]::Replace($configText, '"packOptions"\s*:\s*\{\s*"ignore"\s*:\s*\[[\s\S]*?\]\s*\}', $ignoreBlock, 1)
[System.IO.File]::WriteAllText($ConfigPath, $configText, [System.Text.UTF8Encoding]::new($false))

if (Test-Path -LiteralPath $AppJsonPath) {
  $appJsonText = @'
{
  "pages": [
    "pages/index/index",
    "pages/orders/orders",
    "pages/me/me",
    "pages/login/login",
    "pages/register/register",
    "pages/preOrder/preOrder",
    "pages/address/address",
    "pages/detail/detail",
    "pages/introduce/introduce",
    "pages/agreement/agreement",
    "pages/person/person",
    "pages/certification/certification",
    "pages/acceptOrders/acceptOrders",
    "pages/records/records",
    "pages/wallet/wallet",
    "pages/charge/charge",
    "pages/comment/comment",
    "pages/admin/admin",
    "pages/myComment/myComment"
  ],
  "subPackages": [],
  "window": {
    "navigationBarTextStyle": "white",
    "navigationBarTitleText": "\u6821\u56ed\u8dd1\u817f",
    "navigationBarBackgroundColor": "#006eff",
    "backgroundColor": "#F8F8F8"
  },
  "tabBar": {
    "backgroundColor": "#fff",
    "selectedColor": "#006eff",
    "color": "#666",
    "list": [
      {
        "iconPath": "/static/icons/home.png",
        "selectedIconPath": "static/icons/home-active.png",
        "text": "\u9996\u9875",
        "pagePath": "pages/index/index"
      },
      {
        "iconPath": "/static/icons/orders.png",
        "selectedIconPath": "static/icons/orders-active.png",
        "text": "\u8ba2\u5355",
        "pagePath": "pages/orders/orders"
      },
      {
        "iconPath": "/static/icons/me.png",
        "selectedIconPath": "static/icons/me-active.png",
        "text": "\u6211\u7684",
        "pagePath": "pages/me/me"
      }
    ]
  },
  "lazyCodeLoading": "requiredComponents",
  "usingComponents": {}
}
'@
  [System.IO.File]::WriteAllText($AppJsonPath, $appJsonText, [System.Text.UTF8Encoding]::new($false))
}

Write-Output "Cloud functions synced to: $Target"
Write-Output "cloudfunctionRoot configured in: $ConfigPath"
