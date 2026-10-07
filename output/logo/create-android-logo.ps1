param(
    [string]$Source = (Join-Path $PSScriptRoot 'herta-transparent.png'),
    [int]$Size = 1024,
    [string]$Output = (Join-Path $PSScriptRoot 'herta-android.png')
)

Add-Type -AssemblyName System.Drawing

$scale = 4
$extent = $Size * $scale
$sourceImage = [System.Drawing.Image]::FromFile($Source)
$canvas = [System.Drawing.Bitmap]::new($extent, $extent)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$path = [System.Drawing.Drawing2D.GraphicsPath]::new()
$result = [System.Drawing.Bitmap]::new($Size, $Size)
$resultGraphics = [System.Drawing.Graphics]::FromImage($result)

try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Supersampled rounded corners keep the silhouette smooth at icon sizes.
    $diameter = [single]($extent * 0.44)
    $edge = [single]$extent
    $path.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $path.AddArc(($edge - $diameter), 0, $diameter, $diameter, 270, 90)
    $path.AddArc(($edge - $diameter), ($edge - $diameter), $diameter, $diameter, 0, 90)
    $path.AddArc(0, ($edge - $diameter), $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $graphics.FillPath([System.Drawing.Brushes]::White, $path)
    $graphics.SetClip($path)
    $graphics.DrawImage($sourceImage, [System.Drawing.Rectangle]::new(0, 0, $extent, $extent))

    $resultGraphics.Clear([System.Drawing.Color]::Transparent)
    $resultGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $resultGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $resultGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $resultGraphics.DrawImage($canvas, [System.Drawing.Rectangle]::new(0, 0, $Size, $Size))
    $result.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    $corner = $result.GetPixel(0, 0)
    $background = $result.GetPixel([int]($Size * 0.25), [int]($Size * 0.04))
    Write-Output "Saved $Output ($Size x $Size)"
    Write-Output "Corner RGBA: $($corner.R),$($corner.G),$($corner.B),$($corner.A)"
    Write-Output "Background RGBA: $($background.R),$($background.G),$($background.B),$($background.A)"
}
finally {
    $resultGraphics.Dispose()
    $result.Dispose()
    $path.Dispose()
    $graphics.Dispose()
    $canvas.Dispose()
    $sourceImage.Dispose()
}
