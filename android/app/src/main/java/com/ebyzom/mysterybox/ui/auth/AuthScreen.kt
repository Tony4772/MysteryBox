package com.ebyzom.mysterybox.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ebyzom.mysterybox.data.SessionRepository
import com.ebyzom.mysterybox.ui.common.MysteryBackground
import com.ebyzom.mysterybox.ui.common.cardSurface
import com.ebyzom.mysterybox.ui.theme.Accent
import com.ebyzom.mysterybox.ui.theme.Border
import com.ebyzom.mysterybox.ui.theme.Red
import com.ebyzom.mysterybox.ui.theme.TextPrimary
import com.ebyzom.mysterybox.ui.theme.TextSecondary

@Composable
fun AuthScreen(sessionRepository: SessionRepository) {
    val viewModel: AuthViewModel = viewModel(factory = AuthViewModel.factory(sessionRepository))
    var mode by rememberSaveable { mutableStateOf(AuthMode.Login) }
    var username by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    MysteryBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(64.dp))
            Text(text = "\uD83C\uDF81", fontSize = 56.sp)
            Spacer(Modifier.height(8.dp))
            Text(
                text = "MysteryBox",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                color = TextPrimary,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Abre cajas. Consigue leyendas.",
                color = TextSecondary,
                style = MaterialTheme.typography.bodyMedium,
            )
            Spacer(Modifier.height(32.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .cardSurface(RoundedCornerShape(20.dp))
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                ) {
                    AuthTab(
                        label = "Iniciar sesion",
                        selected = mode == AuthMode.Login,
                        onClick = {
                            mode = AuthMode.Login
                            viewModel.clearError()
                        },
                    )
                    Spacer(Modifier.width(20.dp))
                    AuthTab(
                        label = "Crear cuenta",
                        selected = mode == AuthMode.Register,
                        onClick = {
                            mode = AuthMode.Register
                            viewModel.clearError()
                        },
                    )
                }

                Spacer(Modifier.height(20.dp))

                if (mode == AuthMode.Register) {
                    AuthField(
                        value = username,
                        onValueChange = { username = it },
                        label = "Usuario",
                    )
                    Spacer(Modifier.height(12.dp))
                }

                AuthField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Email",
                    keyboardType = KeyboardType.Email,
                )
                Spacer(Modifier.height(12.dp))
                AuthField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Contrasena",
                    keyboardType = KeyboardType.Password,
                    isPassword = true,
                )

                viewModel.error?.let { message ->
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = message,
                        color = Red,
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center,
                    )
                }

                Spacer(Modifier.height(20.dp))

                Button(
                    onClick = { viewModel.submit(mode, username, email, password) },
                    enabled = !viewModel.loading,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Accent,
                        contentColor = Color.White,
                        disabledContainerColor = Accent.copy(alpha = 0.5f),
                    ),
                ) {
                    if (viewModel.loading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp,
                        )
                    } else {
                        Text(
                            text = if (mode == AuthMode.Login) "Iniciar sesion" else "Crear cuenta",
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Text(
                text = "Tus creditos y objetos se guardan en el servidor.",
                color = TextSecondary,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(48.dp))
        }
    }
}

@Composable
private fun AuthTab(label: String, selected: Boolean, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        TextButton(onClick = onClick) {
            Text(
                text = label,
                color = if (selected) TextPrimary else TextSecondary,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            )
        }
        Box(
            Modifier
                .width(64.dp)
                .height(2.dp)
                .background(if (selected) Accent else Color.Transparent, RoundedCornerShape(1.dp)),
        )
    }
}

@Composable
private fun AuthField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Accent,
            unfocusedBorderColor = Border,
            focusedLabelColor = Accent,
            unfocusedLabelColor = TextSecondary,
            cursorColor = Accent,
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary,
        ),
    )
}
