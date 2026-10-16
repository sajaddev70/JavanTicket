# kotlinx.serialization: keep generated serializers of the API models.
-keepattributes *Annotation*, InnerClasses, Signature, Exceptions
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.devs.nisha_user.**$$serializer { *; }
-keepclassmembers class com.devs.nisha_user.** { *** Companion; }
-keepclasseswithmembers class com.devs.nisha_user.** { kotlinx.serialization.KSerializer serializer(...); }

# Retrofit service interfaces are created by reflection.
-keep,allowobfuscation interface com.devs.nisha_user.data.remote.api.** { *; }
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
