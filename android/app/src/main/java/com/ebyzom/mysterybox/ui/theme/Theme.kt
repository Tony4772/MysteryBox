package com.ebyzom.mysterybox.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val MysteryColors = darkColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    primaryContainer = Accent.copy(alpha = 0.2f),
    onPrimaryContainer = TextPrimary,
    secondary = Purple,
    onSecondary = Color.White,
    background = BgPrimary,
    onBackground = TextPrimary,
    surface = BgCard,
    onSurface = TextPrimary,
    surfaceVariant = BgSecondary,
    onSurfaceVariant = TextSecondary,
    outline = Border,
    error = Red,
    onError = Color.White,
)

@Composable
fun MysteryBoxTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MysteryColors,
        content = content,
    )
}
