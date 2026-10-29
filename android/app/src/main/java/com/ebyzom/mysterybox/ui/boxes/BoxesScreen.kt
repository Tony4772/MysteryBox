package com.ebyzom.mysterybox.ui.boxes

import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ebyzom.mysterybox.data.BoxRepository
import com.ebyzom.mysterybox.data.remote.BoxDto
import com.ebyzom.mysterybox.ui.common.EmptyState
import com.ebyzom.mysterybox.ui.common.ErrorBox
import com.ebyzom.mysterybox.ui.common.LoadingBox
import com.ebyzom.mysterybox.ui.common.ScreenHeader
import com.ebyzom.mysterybox.ui.common.boxIcon
import com.ebyzom.mysterybox.ui.common.cardSurface
import com.ebyzom.mysterybox.ui.common.formatNumber
import com.ebyzom.mysterybox.ui.theme.Accent
import com.ebyzom.mysterybox.ui.theme.Gold
import com.ebyzom.mysterybox.ui.theme.TextPrimary
import com.ebyzom.mysterybox.ui.theme.TextSecondary

@Composable
fun BoxesScreen(repository: BoxRepository, onBoxClick: (Int) -> Unit) {
    val viewModel: BoxesViewModel = viewModel(factory = BoxesViewModel.factory(repository))
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        ScreenHeader(
            title = "Abre tus Cajas",
            subtitle = "Elige una caja y descubre que objetos te esperan",
        )
        when {
            state.loading -> LoadingBox()
            state.error != null -> ErrorBox(
                message = state.error ?: "Error inesperado",
                onRetry = viewModel::load,
            )
            state.boxes.isEmpty() -> EmptyState(
                emoji = "\uD83D\uDCE6",
                title = "No hay cajas disponibles",
                message = "El administrador aun no ha activado ninguna caja.",
            )
            else -> LazyColumn(
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 24.dp),
            ) {
                items(state.boxes, key = { it.id }) { box ->
                    BoxCard(box = box, onClick = { onBoxClick(box.id) })
                }
            }
        }
    }
}

@Composable
private fun BoxCard(box: BoxDto, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .cardSurface(RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(Accent.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(text = boxIcon(box.name), fontSize = 28.sp)
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = box.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
            )
            box.description?.let { description ->
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.size(6.dp))
            Text(
                text = "\uD83D\uDC8E ${formatNumber(box.cost)} creditos",
                style = MaterialTheme.typography.labelMedium,
                color = Gold,
            )
        }
        Text(text = "\u203A", fontSize = 26.sp, color = TextSecondary)
    }
}
