package com.ebyzom.mysterybox.di

import android.content.Context
import com.ebyzom.mysterybox.data.BoxRepository
import com.ebyzom.mysterybox.data.InventoryRepository
import com.ebyzom.mysterybox.data.SessionRepository
import com.ebyzom.mysterybox.data.SessionStore
import com.ebyzom.mysterybox.data.remote.ApiClient

class AppContainer(context: Context) {
    private val sessionStore = SessionStore(context)
    private val api = ApiClient.create(sessionStore)

    val sessionRepository = SessionRepository(api, sessionStore)
    val boxRepository = BoxRepository(api)
    val inventoryRepository = InventoryRepository(api)
}
