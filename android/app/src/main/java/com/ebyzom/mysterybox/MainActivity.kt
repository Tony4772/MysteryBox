package com.ebyzom.mysterybox

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.ebyzom.mysterybox.ui.MainViewModel
import com.ebyzom.mysterybox.ui.MysteryBoxRoot
import com.ebyzom.mysterybox.ui.theme.MysteryBoxTheme

class MainActivity : ComponentActivity() {
    private val mainViewModel: MainViewModel by viewModels {
        MainViewModel.factory((application as MysteryBoxApp).container)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as MysteryBoxApp).container
        setContent {
            MysteryBoxTheme {
                MysteryBoxRoot(mainViewModel = mainViewModel, container = container)
            }
        }
    }
}
