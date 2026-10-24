[Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$dir = "C:\Users\acoscolin\.gemini\antigravity\brain\4e03ea48-6d25-4b4f-81dc-c105e0e25ca2\.user_uploaded"
$files = Get-ChildItem -Path $dir -Filter "*.png"

$lang = New-Object Windows.Globalization.Language("es")
$ocr = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $ocr) {
    $ocr = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}

foreach ($f in $files) {
    Write-Host "========================================"
    Write-Host "File: $($f.Name)"
    try {
        $storageFile = [Windows.Storage.StorageFile]::GetFileFromPathAsync($f.FullName).GetAwaiter().GetResult()
        $stream = $storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetAwaiter().GetResult()
        $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetAwaiter().GetResult()
        $bitmap = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()
        $result = $ocr.RecognizeAsync($bitmap).GetAwaiter().GetResult()
        Write-Host "Text: $($result.Text)"
        $stream.Close()
    } catch {
        Write-Host "Err: $_"
    }
}
