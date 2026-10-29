package com.ebyzom.mysterybox.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ebyzom.mysterybox.di.AppContainer
import com.ebyzom.mysterybox.ui.auth.AuthScreen
import com.ebyzom.mysterybox.ui.common.MysteryBackground
import com.ebyzom.mysterybox.ui.theme.Accent
import com.ebyzom.mysterybox.ui.theme.TextPrimary

@Composable
fun MysteryBoxRoot(mainViewModel: MainViewModel, container: AppContainer) {
    val state by mainViewModel.state.collectAsStateWithLifecycle()

    when (val session = state) {
        is SessionUiState.Loading -> SplashScreen()
        is SessionUiState.LoggedOut -> AuthScreen(sessionRepository = container.sessionRepository)
        is SessionUiState.LoggedIn -> AppScaffold(
            user = session.user,
            container = container,
            onLogout = mainViewModel::logout,
        )
    }
}

@Composable
private fun SplashScreen() {
    MysteryBackground {
        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(text = "\uD83C\uDF81", fontSize = 64.sp)
            Spacer(Modifier.height(12.dp))
            Text(
                text = "MysteryBox",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = TextPrimary,
            )
            Spacer(Modifier.height(28.dp))
            CircularProgressIndicator(color = Accent, strokeWidth = 2.dp)
        }
    }
}
