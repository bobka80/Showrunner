# Generates Showrunner Station Desktop app.ico from the same red "A" as mobile/PWA.
param(
  [string]$SrcPng = (Join-Path $PSScriptRoot "..\..\push-hosting\public\apple-touch-icon.png"),
  [string]$OutIco = (Join-Path $PSScriptRoot "..\ShowrunnerStationDesktop\app.ico")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $SrcPng)) {
  throw "Source icon not found: $SrcPng"
}

function Write-PngIco([string]$pngPath, [string]$icoPath, [int[]]$sizes) {
  $src = [System.Drawing.Bitmap]::FromFile($pngPath)
  $entries = @()
  try {
    foreach ($size in $sizes) {
      $bmp = New-Object System.Drawing.Bitmap $size, $size
      try {
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 12))
        $g.DrawImage($src, 0, 0, $size, $size)
        $g.Dispose()
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $entries += @{ Size = $size; Stream = $ms }
      } finally {
        $bmp.Dispose()
      }
    }
  } finally {
    $src.Dispose()
  }

  $dir = Split-Path $icoPath -Parent
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  $fs = [System.IO.File]::Create($icoPath)
  $bw = New-Object System.IO.BinaryWriter $fs
  try {
    $bw.Write([UInt16]0)
    $bw.Write([UInt16]1)
    $bw.Write([UInt16]$entries.Count)
    $offset = 6 + (16 * $entries.Count)
    foreach ($entry in $entries) {
      $dim = [int]$entry.Size
      if ($dim -ge 256) { $dim = 0 }
      $bw.Write([Byte]$dim)
      $bw.Write([Byte]$dim)
      $bw.Write([Byte]0)
      $bw.Write([Byte]0)
      $bw.Write([UInt16]1)
      $bw.Write([UInt16]32)
      $len = [int]$entry.Stream.Length
      $bw.Write([UInt32]$len)
      $bw.Write([UInt32]$offset)
      $offset += $len
    }
    foreach ($entry in $entries) {
      $entry.Stream.Position = 0
      $bw.Write($entry.Stream.ToArray())
      $entry.Stream.Dispose()
    }
  } finally {
    $bw.Close()
    $fs.Close()
  }
}

Write-PngIco -pngPath $SrcPng -icoPath $OutIco -sizes @(16, 32, 48, 64, 128, 256)
Write-Host "Wrote $OutIco from $SrcPng"
