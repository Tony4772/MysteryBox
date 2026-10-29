package com.ebyzom.mysterybox.ui.boxes

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ebyzom.mysterybox.data.remote.BoxDto
import com.ebyzom.mysterybox.data.remote.ItemDto
import com.ebyzom.mysterybox.data.remote.RevealItemDto
import com.ebyzom.mysterybox.data.remote.TierDto
import com.ebyzom.mysterybox.di.AppContainer
import com.ebyzom.mysterybox.ui.common.EmptyState
import com.ebyzom.mysterybox.ui.common.ErrorBox
import com.ebyzom.mysterybox.ui.common.LoadingBox
import com.ebyzom.mysterybox.ui.common.boxIcon
import com.ebyzom.mysterybox.ui.common.colorFromHex
import com.ebyzom.mysterybox.ui.common.formatNumber
import com.ebyzom.mysterybox.ui.common.itemIcon
import com.ebyzom.mysterybox.ui.common.rarityColor
import com.ebyzom.mysterybox.ui.theme.Accent
import com.ebyzom.mysterybox.ui.theme.BgPrimary
import com.ebyzom.mysterybox.ui.theme.Border
import com.ebyzom.mysterybox.ui.theme.Red
import com.ebyzom.mysterybox.ui.theme.TextPrimary
import com.ebyzom.mysterybox.ui.theme.TextSecondary
import java.util.Locale
import kotlin.math.PI
import kotlin.math.sin
import kotlin.random.Random

@Composable
fun BoxDetailScreen(boxId: Int, container: AppContainer) {
    val viewModel: BoxDetailViewModel = viewModel(factory = BoxDetailViewModel.factory(boxId, container))
    val state by viewModel.state.collectAsStateWithLifecycle()
    val user by container.sessionRepository.user.collectAsStateWithLifecycle()
    val credits = user?.credits ?: 0

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            when {
                state.loading -> LoadingBox()
                state.error != null -> ErrorBox(
                    message = state.error ?: "Error inesperado",
                    onRetry = viewModel::load,
                )
                else -> {
                    val box = state.box
                    if (box == null) {
                        EmptyState(
                            emoji = "\uD83D\uDCE6",
                            title = "Caja no disponible",
                            message = "Vuelve a intentarlo en unos segundos.",
                        )
                    } else {
                        BoxHeader(box)
                        Spacer(Modifier.height(24.dp))

                        if (state.tiers.isEmpty()) {
                            Text(
                                text = "No hay probabilidades configuradas para esta caja.",
                                color = TextSecondary,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        } else {
                            state.tiers.forEach { tier ->
                                TierBlock(
                                    tier = tier,
                                    items = state.items.filter { it.rarityTierId == tier.id },
                                )
                                Spacer(Modifier.height(18.dp))
                            }
                        }

                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "Costo: \uD83D\uDC8E ${formatNumber(box.cost)} creditos",
                            color = TextSecondary,
                            style = MaterialTheme.typography.bodySmall,
                        )
                        Spacer(Modifier.height(10.dp))

                        val canAfford = credits >= box.cost
                        Button(
                            onClick = viewModel::open,
                            enabled = canAfford && !state.opening,
                            modifier = Modifier.fillMaxWidth().height(54.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Accent,
                                contentColor = Color.White,
                                disabledContainerColor = Accent.copy(alpha = 0.3f),
                                disabledContentColor = TextSecondary,
                            ),
                        ) {
                            Text(
                                text = if (canAfford) "\uD83C\uDFB2 Abrir Caja" else "Creditos insuficientes",
                                fontWeight = FontWeight.Bold,
                            )
                        }

                        state.message?.let { message ->
                            Spacer(Modifier.height(10.dp))
                            Text(
                                text = message,
                                color = Red,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        Spacer(Modifier.height(24.dp))
                    }
                }
            }
        }

        if (state.opening) {
            OpeningOverlay()
        }

        state.reveal?.let { item ->
            RevealOverlay(item = item, onDismiss = viewModel::dismissReveal)
        }
    }
}

@Composable
private fun BoxHeader(box: BoxDto) {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(Accent.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(text = boxIcon(box.name), fontSize = 44.sp)
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = box.name,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
            color = TextPrimary,
        )
        box.description?.let { description ->
            Spacer(Modifier.height(4.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun TierBlock(tier: TierDto, items: List<ItemDto>) {
    val color = colorFromHex(tier.color, rarityColor(tier.name))
    val percent = String.format(Locale.US, "%.1f%%", tier.probability * 100)

    Column(Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = tier.name,
                color = color,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = percent,
                color = TextSecondary,
                style = MaterialTheme.typography.bodySmall,
            )
        }
        Spacer(Modifier.height(6.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(Border),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(tier.probability.toFloat().coerceIn(0f, 1f))
                    .fillMaxHeight()
                    .background(color),
            )
        }
        if (items.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = items.joinToString("   ") { "${itemIcon(it.image)} ${it.name}" },
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun Modifier.blockTouches(): Modifier = clickable(
    interactionSource = remember { MutableInteractionSource() },
    indication = null,
) { }

@Composable
private fun OpeningOverlay() {
    val transition = rememberInfiniteTransition(label = "shake")
    val angle by transition.animateFloat(
        initialValue = -10f,
        targetValue = 10f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 120, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "angle",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary.copy(alpha = 0.96f))
            .blockTouches(),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "\uD83C\uDF81",
                fontSize = 88.sp,
                modifier = Modifier.rotate(angle),
            )
            Spacer(Modifier.height(20.dp))
            Text(
                text = "Abriendo caja...",
                color = TextSecondary,
                style = MaterialTheme.typography.bodyLarge,
            )
            Spacer(Modifier.height(16.dp))
            CircularProgressIndicator(
                color = Accent,
                strokeWidth = 2.dp,
                modifier = Modifier.size(28.dp),
            )
        }
    }
}

@Composable
private fun RevealOverlay(item: RevealItemDto, onDismiss: () -> Unit) {
    val color = colorFromHex(item.color, rarityColor(item.rarity))
    val isHighRarity = item.rarity.equals("Legendary", true) || item.rarity.equals("Epic", true)

    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        android.util.Log.d("BoxDetailVM", "RevealOverlay shown for ${item.name}")
        visible = true
    }

    val scale by animateFloatAsState(
        targetValue = if (visible) 1f else 0.6f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow,
        ),
        label = "scale",
    )
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0f,
        animationSpec = tween(300),
        label = "alpha",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary.copy(alpha = 0.97f))
            .blockTouches(),
        contentAlignment = Alignment.Center,
    ) {
        if (isHighRarity) {
            Sparkles(color = color, modifier = Modifier.fillMaxSize())
        }
        Column(
            modifier = Modifier.fillMaxWidth().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = item.rarity.uppercase(Locale.ROOT),
                color = color,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                letterSpacing = 3.sp,
            )
            Spacer(Modifier.height(20.dp))
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .scale(scale)
                    .alpha(alpha)
                    .background(color.copy(alpha = 0.12f), CircleShape)
                    .border(3.dp, color, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(text = itemIcon(item.image), fontSize = 64.sp)
            }
            Spacer(Modifier.height(24.dp))
            Column(
                modifier = Modifier.alpha(alpha),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary,
                    textAlign = TextAlign.Center,
                )
                item.description?.let { description ->
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                    )
                }
                Spacer(Modifier.height(24.dp))
                Button(
                    onClick = onDismiss,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Accent, contentColor = Color.White),
                    modifier = Modifier.height(50.dp),
                ) {
                    Text(text = "\u00A1Genial!", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun Sparkles(color: Color, modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "sparkles")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "progress",
    )
    val points = remember {
        val random = Random(42)
        List(32) { Triple(random.nextFloat(), random.nextFloat(), random.nextFloat()) }
    }

    Canvas(modifier = modifier) {
        points.forEach { (x, y, phase) ->
            val pulse = (sin((progress + phase) * 2f * PI.toFloat()) + 1f) / 2f
            drawCircle(
                color = color.copy(alpha = pulse * 0.7f),
                radius = 2f + phase * 3f,
                center = Offset(x * size.width, y * size.height),
            )
        }
    }
}
