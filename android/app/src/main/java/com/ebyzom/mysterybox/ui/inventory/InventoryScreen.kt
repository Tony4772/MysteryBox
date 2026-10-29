package com.ebyzom.mysterybox.ui.inventory

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ebyzom.mysterybox.data.InventoryRepository
import com.ebyzom.mysterybox.data.remote.InventoryItemDto
import com.ebyzom.mysterybox.data.remote.RarityCountDto
import com.ebyzom.mysterybox.ui.common.EmptyState
import com.ebyzom.mysterybox.ui.common.ErrorBox
import com.ebyzom.mysterybox.ui.common.LoadingBox
import com.ebyzom.mysterybox.ui.common.ScreenHeader
import com.ebyzom.mysterybox.ui.common.cardSurface
import com.ebyzom.mysterybox.ui.common.colorFromHex
import com.ebyzom.mysterybox.ui.common.itemIcon
import com.ebyzom.mysterybox.ui.common.rarityColor
import com.ebyzom.mysterybox.ui.theme.TextPrimary
import com.ebyzom.mysterybox.ui.theme.TextSecondary

@Composable
fun InventoryScreen(repository: InventoryRepository, onGoToBoxes: () -> Unit) {
    val viewModel: InventoryViewModel = viewModel(factory = InventoryViewModel.factory(repository))
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        ScreenHeader(
            title = "Mi Inventario",
            subtitle = "Todos los objetos que has obtenido",
        )
        when {
            state.loading -> LoadingBox()
            state.error != null -> ErrorBox(
                message = state.error ?: "Error inesperado",
                onRetry = viewModel::load,
            )
            state.items.isEmpty() -> EmptyState(
                emoji = "\uD83D\uDCE6",
                title = "Inventario vacio",
                message = "\u00A1Abre cajas para conseguir objetos!",
                actionLabel = "Ir a Cajas",
                onAction = onGoToBoxes,
            )
            else -> LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 24.dp),
            ) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    StatsRow(total = state.total, byRarity = state.byRarity)
                }
                items(state.items) { item ->
                    InventoryCard(item = item)
                }
            }
        }
    }
}

@Composable
private fun StatsRow(total: Int, byRarity: List<RarityCountDto>) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(bottom = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        StatChip(label = "Total", value = total, color = TextPrimary)
        byRarity.forEach { rarity ->
            StatChip(
                label = rarity.rarity,
                value = rarity.count,
                color = colorFromHex(rarity.color, rarityColor(rarity.rarity)),
            )
        }
    }
}

@Composable
private fun StatChip(label: String, value: Int, color: Color) {
    Column(
        modifier = Modifier
            .cardSurface(RoundedCornerShape(14.dp))
            .padding(horizontal = 18.dp, vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = value.toString(),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = color,
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary,
        )
    }
}

@Composable
private fun InventoryCard(item: InventoryItemDto) {
    val color = colorFromHex(item.color, rarityColor(item.rarity))
    Column(
        modifier = Modifier
            .cardSurface(RoundedCornerShape(14.dp))
            .padding(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(color.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(text = itemIcon(item.image), fontSize = 22.sp)
        }
        Spacer(Modifier.height(6.dp))
        Text(
            text = item.name,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = TextPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Text(
            text = item.rarity,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            maxLines = 1,
        )
    }
}
