package org.inaturalist.seek

import android.graphics.Rect
import android.net.Uri
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.DetectedObject
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.util.concurrent.TimeUnit

/**
 * Subject detection with ML Kit's on-device object detector.
 *
 * Boxes come back as fractions of the image as seen upright ("box"); for camera frames
 * also as fractions of the frame in sensor orientation ("frameRect"), which is what the
 * classifier's cropRect expects.
 */
private fun normalized(r: Rect, w: Int, h: Int): DoubleArray =
  doubleArrayOf(
    (r.left.toDouble() / w).coerceIn(0.0, 1.0),
    (r.top.toDouble() / h).coerceIn(0.0, 1.0),
    (r.width().toDouble() / w).coerceIn(0.0, 1.0),
    (r.height().toDouble() / h).coerceIn(0.0, 1.0),
  )

/** Upright box (l, t, w, h) -> the same region in the frame, before rotating by `degrees` clockwise. */
internal fun uprightToFrame(b: DoubleArray, degrees: Int): DoubleArray {
  val (l, t, w, h) = listOf(b[0], b[1], b[2], b[3])
  return when (((degrees % 360) + 360) % 360) {
    90 -> doubleArrayOf(t, 1 - (l + w), h, w)
    180 -> doubleArrayOf(1 - (l + w), 1 - (t + h), w, h)
    270 -> doubleArrayOf(1 - (t + h), l, h, w)
    else -> doubleArrayOf(l, t, w, h)
  }
}

private fun rectMap(r: DoubleArray): Map<String, Double> =
  mapOf("left" to r[0], "top" to r[1], "width" to r[2], "height" to r[3])

/** Frame processor plugin: `detectSubjects(frame)` -> up to 5 tracked subjects, largest first. */
class SubjectDetectorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {
  private val detector = ObjectDetection.getClient(
    ObjectDetectorOptions.Builder()
      .setDetectorMode(ObjectDetectorOptions.STREAM_MODE)
      .enableMultipleObjects()
      .build(),
  )

  override fun callback(frame: Frame, params: Map<String, Any>?): Any {
    val image = frame.image
    // Frame.orientation is the reverse of CameraX's rotationDegrees (the clockwise
    // rotation that makes the frame upright); undo that mapping
    val degrees = when (frame.orientation) {
      Orientation.LANDSCAPE_RIGHT -> 90
      Orientation.PORTRAIT_UPSIDE_DOWN -> 180
      Orientation.LANDSCAPE_LEFT -> 270
      else -> 0
    }
    val uprightW = if (degrees % 180 == 0) frame.width else frame.height
    val uprightH = if (degrees % 180 == 0) frame.height else frame.width
    val objects: List<DetectedObject> = try {
      // frame processors run on their own thread, so waiting here is fine
      Tasks.await(detector.process(InputImage.fromMediaImage(image, degrees)), 400, TimeUnit.MILLISECONDS)
    } catch (e: Exception) {
      return emptyList<Any>()
    }
    return objects
      .sortedByDescending { it.boundingBox.width() * it.boundingBox.height() }
      .map { o ->
        val box = normalized(o.boundingBox, uprightW, uprightH)
        mapOf(
          "id" to (o.trackingId ?: -1).toDouble(),
          "box" to rectMap(box),
          "frameRect" to rectMap(uprightToFrame(box, degrees)),
        )
      }
  }
}

/** `SeekSubjects.detect(uri)` -> subjects in a photo, largest first, boxes upright (EXIF applied). */
class SeekSubjectsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val detector by lazy {
    ObjectDetection.getClient(
      ObjectDetectorOptions.Builder()
        .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
        .enableMultipleObjects()
        .build(),
    )
  }

  override fun getName() = "SeekSubjects"

  @ReactMethod
  fun detect(uri: String, promise: Promise) {
    val input = try {
      val parsed = Uri.parse(if (uri.startsWith("/")) "file://$uri" else uri)
      InputImage.fromFilePath(context, parsed)
    } catch (e: Exception) {
      promise.reject("E_SUBJECTS_IO", "Couldn't read $uri: ${e.message}")
      return
    }
    // fromFilePath applies the EXIF rotation and reports it as 0
    val w = input.width
    val h = input.height
    detector.process(input)
      .addOnSuccessListener { objects ->
        val out = Arguments.createArray()
        objects.sortedByDescending { it.boundingBox.width() * it.boundingBox.height() }.forEach { o ->
          val b = normalized(o.boundingBox, w, h)
          out.pushMap(
            Arguments.createMap().apply {
              putMap(
                "box",
                Arguments.createMap().apply {
                  putDouble("left", b[0]); putDouble("top", b[1])
                  putDouble("width", b[2]); putDouble("height", b[3])
                },
              )
            },
          )
        }
        promise.resolve(out)
      }
      .addOnFailureListener { e -> promise.reject("E_SUBJECTS", e.message, e) }
  }
}

class SeekSubjectsPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(SeekSubjectsModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
