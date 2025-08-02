package com.haarhish.MyNewApp

import android.os.Bundle
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme) // for expo-splash-screen
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "main"
}
