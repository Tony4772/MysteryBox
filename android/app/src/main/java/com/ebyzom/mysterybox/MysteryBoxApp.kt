package com.ebyzom.mysterybox

import android.app.Application
import com.ebyzom.mysterybox.di.AppContainer

class MysteryBoxApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
