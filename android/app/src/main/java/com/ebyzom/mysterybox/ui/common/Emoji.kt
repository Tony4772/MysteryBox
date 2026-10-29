package com.ebyzom.mysterybox.ui.common

import androidx.compose.ui.graphics.Color
import com.ebyzom.mysterybox.ui.theme.Blue
import com.ebyzom.mysterybox.ui.theme.Gold
import com.ebyzom.mysterybox.ui.theme.Purple
import com.ebyzom.mysterybox.ui.theme.RarityCommon
import com.ebyzom.mysterybox.ui.theme.TextSecondary
import java.util.Locale

private val itemIcons = mapOf(
    "shield" to "\uD83D\uDEE1\uFE0F",
    "sword" to "\u2694\uFE0F",
    "boots" to "\uD83D\uDC62",
    "scroll" to "\uD83D\uDCDC",
    "ring" to "\uD83D\uDC8D",
    "bow" to "\uD83C\uDFF9",
    "feather" to "\uD83E\uDEB6",
    "armor" to "\uD83D\uDEE1\uFE0F",
    "cloak" to "\uD83E\uDDE5",
    "staff" to "\uD83E\uDE84",
    "blade" to "\uD83D\uDDE1\uFE0F",
    "scale" to "\uD83D\uDC09",
    "amulet" to "\uD83D\uDD2E",
    "crown" to "\uD83D\uDC51",
    "axe" to "\uD83E\uDE93",
    "chain" to "\u26D3\uFE0F",
    "katana" to "\uD83D\uDD2A",
    "gem" to "\uD83D\uDC8E",
    "excalibur" to "\u2694\uFE0F",
    "stone" to "\uD83E\uDEA8",
)

fun itemIcon(image: String?): String = itemIcons[image] ?: "\uD83C\uDF81"

fun boxIcon(name: String?): String = when (name) {
    "Common Box" -> "\uD83D\uDCE6"
    "Epic Box" -> "\uD83C\uDF81"
    "Legendary Box" -> "\uD83D\uDC51"
    else -> "\uD83C\uDF81"
}

fun rarityColor(name: String?): Color = when (name?.lowercase(Locale.ROOT)) {
    "common" -> RarityCommon
    "rare" -> Blue
    "epic" -> Purple
    "legendary" -> Gold
    else -> TextSecondary
}

fun colorFromHex(hex: String?, fallback: Color = TextSecondary): Color =
    if (hex.isNullOrBlank()) {
        fallback
    } else {
        runCatching { Color(android.graphics.Color.parseColor(hex)) }.getOrDefault(fallback)
    }

fun formatNumber(value: Int): String = String.format(Locale.US, "%,d", value)
