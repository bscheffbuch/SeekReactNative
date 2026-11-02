package org.inaturalist.seek

import android.os.Build
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.uimanager.ViewManager

/**
 * Material You: exposes the system's dynamic tonal palettes (Android 12+, derived
 * from the wallpaper) as hex strings, so the JS theme can build its M3 roles from
 * them. Empty on older Android versions, where the app keeps its own palette.
 */
class DynamicColorsModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName() = "SeekDynamicColors"

  override fun getConstants(): Map<String, Any> {
    val palette = HashMap<String, String>()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val res = context.resources
      for (group in listOf("accent1", "accent2", "accent3", "neutral1", "neutral2")) {
        for (tone in TONES) {
          val id = res.getIdentifier("system_${group}_$tone", "color", "android")
          if (id != 0) {
            palette["${group}_$tone"] = String.format("#%06X", 0xFFFFFF and context.getColor(id))
          }
        }
      }
    }
    return mapOf("palette" to palette, "supported" to (palette.isNotEmpty()))
  }

  companion object {
    private val TONES = listOf(0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)
  }
}

class DynamicColorsPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(DynamicColorsModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
