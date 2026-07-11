# Generates Showrunner Station Desktop app.ico — Stagebusters red stylized A.
param(
  [string]$OutIco = (Join-Path $PSScriptRoot "..\ShowrunnerStationDesktop\app.ico")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName System.Drawing

$pathData = "M117.97,0.96 v9.82 c0,0.05 -0.67,0.72 -0.72,0.72 h-7.43 l13.91,30.17 h-31.65 l3.84,-9.1 h13.91 l-8.87,-17.71 l-12.71,26.81 h-10.07 l13.91,-30.17 h-7.67 V0.96 h33.57 z"

function Convert-RtbToBitmap([System.Windows.Media.Imaging.RenderTargetBitmap]$rtb) {
  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $ms = New-Object System.IO.MemoryStream
  $encoder.Save($ms)
  $ms.Position = 0
  return New-Object System.Drawing.Bitmap $ms
}

function Render-LogoBitmap([int]$size) {
  $dv = New-Object System.Windows.Media.DrawingVisual
  $dc = $dv.RenderOpen()
  $bg = New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.Color]::FromRgb(0x0d, 0x0f, 0x12))
  $dc.DrawRectangle($bg, $null, (New-Object Windows.Rect 0, 0, $size, $size))

  $geo = [System.Windows.Media.Geometry]::Parse($pathData)
  $scale = ($size * 0.78) / 50.0
  $tx = ($size - (50.0 * $scale)) / 2.0 - (80.0 * $scale) + ($size * 0.02)
  $ty = ($size - (42.0 * $scale)) / 2.0 + ($size * 0.02)
  $tg = New-Object System.Windows.Media.TransformGroup
  $tg.Children.Add((New-Object System.Windows.Media.TranslateTransform($tx, $ty)))
  $tg.Children.Add((New-Object System.Windows.Media.ScaleTransform($scale, $scale)))

  $brush = New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.Color]::FromRgb(0xeb, 0x1c, 0x24))
  $dc.PushTransform($tg)
  $dc.DrawGeometry($brush, $null, $geo)
  $dc.Pop()
  $dc.Close()

  $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($size, $size, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($dv)
  return $rtb
}

$sizes = @(256, 128, 64, 48, 32, 16)
$bitmaps = @()
foreach ($s in $sizes) {
  $bitmaps += (Convert-RtbToBitmap (Render-LogoBitmap $s))
}

$iconHandle = $bitmaps[0].GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$dir = Split-Path $OutIco -Parent
if (-not (Test-Path $dir)) { New-Object System.IO.DirectoryInfo($dir) | Out-Null }
$fs = [System.IO.File]::Create($OutIco)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
foreach ($b in $bitmaps) { $b.Dispose() }

Write-Host "Wrote $OutIco"
