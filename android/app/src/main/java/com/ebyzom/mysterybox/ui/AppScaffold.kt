package com.ebyzom.mysterybox.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.ebyzom.mysterybox.data.remote.UserDto
import com.ebyzom.mysterybox.di.AppContainer
import com.ebyzom.mysterybox.ui.boxes.BoxDetailScreen
import com.ebyzom.mysterybox.ui.boxes.BoxesScreen
import com.ebyzom.mysterybox.ui.common.CreditsPill
import com.ebyzom.mysterybox.ui.inventory.InventoryScreen
import com.ebyzom.mysterybox.ui.profile.ProfileScreen
import com.ebyzom.mysterybox.ui.theme.Accent
import com.ebyzom.mysterybox.ui.theme.BgPrimary
import com.ebyzom.mysterybox.ui.theme.BgSecondary
import com.ebyzom.mysterybox.ui.theme.TextPrimary
import com.ebyzom.mysterybox.ui.theme.TextSecondary

private object Routes {
    const val Boxes = "boxes"
    const val BoxDetail = "box/{boxId}"
    const val Inventory = "inventory"
    const val Profile = "profile"

    fun boxDetail(boxId: Int) = "box/$boxId"
}

private enum class BottomDestination(val route: String, val emoji: String, val label: String) {
    Boxes(Routes.Boxes, "\uD83C\uDF81", "Cajas"),
    Inventory(Routes.Inventory, "\uD83D\uDCE6", "Inventario"),
    Profile(Routes.Profile, "\uD83D\uDC64", "Perfil"),
}

@Composable
fun AppScaffold(user: UserDto, container: AppContainer, onLogout: () -> Unit) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val isDetail = currentRoute == Routes.BoxDetail

    Scaffold(
        containerColor = BgPrimary,
        topBar = {
            AppTopBar(
                title = if (isDetail) "Detalle de caja" else "MysteryBox",
                credits = user.credits,
                showBack = isDetail,
                onBack = { navController.popBackStack() },
            )
        },
        bottomBar = {
            if (!isDetail) {
                AppBottomBar(currentRoute = currentRoute) { route ->
                    navController.navigate(route) {
                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.Boxes,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.Boxes) {
                BoxesScreen(
                    repository = container.boxRepository,
                    onBoxClick = { boxId -> navController.navigate(Routes.boxDetail(boxId)) },
                )
            }
            composable(
                route = Routes.BoxDetail,
                arguments = listOf(navArgument("boxId") { type = NavType.IntType }),
            ) { entry ->
                val boxId = entry.arguments?.getInt("boxId") ?: return@composable
                BoxDetailScreen(boxId = boxId, container = container)
            }
            composable(Routes.Inventory) {
                InventoryScreen(
                    repository = container.inventoryRepository,
                    onGoToBoxes = {
                        navController.navigate(Routes.Boxes) { launchSingleTop = true }
                    },
                )
            }
            composable(Routes.Profile) {
                ProfileScreen(user = user, onLogout = onLogout)
            }
        }
    }
}

@Composable
private fun AppTopBar(
    title: String,
    credits: Int,
    showBack: Boolean,
    onBack: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(BgPrimary)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (showBack) {
            TextButton(onClick = onBack) {
                Text(text = "\u2190", fontSize = 22.sp, color = TextPrimary)
            }
            Spacer(Modifier.width(4.dp))
        }
        Text(
            text = if (showBack) title else "\uD83C\uDF81 $title",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
        )
        Spacer(Modifier.weight(1f))
        CreditsPill(credits = credits)
    }
}

@Composable
private fun AppBottomBar(currentRoute: String?, onNavigate: (String) -> Unit) {
    NavigationBar(containerColor = BgSecondary, tonalElevation = 0.dp) {
        BottomDestination.entries.forEach { destination ->
            val selected = currentRoute == destination.route
            NavigationBarItem(
                selected = selected,
                onClick = { onNavigate(destination.route) },
                icon = { Text(text = destination.emoji, fontSize = 18.sp) },
                label = {
                    Text(
                        text = destination.label,
                        fontSize = 11.sp,
                        color = if (selected) Accent else TextSecondary,
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Accent,
                    selectedTextColor = Accent,
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary,
                    indicatorColor = Accent.copy(alpha = 0.15f),
                ),
            )
        }
    }
}
