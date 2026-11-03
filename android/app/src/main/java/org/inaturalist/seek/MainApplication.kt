package org.inaturalist.seek

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(DynamicColorsPackage())
          add(SeekSubjectsPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectSubjects") { proxy, options ->
      SubjectDetectorPlugin(proxy, options)
    }
    loadReactNative(this)
  }
}