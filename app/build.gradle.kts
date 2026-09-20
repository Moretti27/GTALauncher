plugins { id("com.android.application") }
android {
    namespace = "com.acq.reborn"
    compileSdk = 36
    defaultConfig { applicationId = "com.acq.reborn"; minSdk = 26; targetSdk = 36; versionCode = 7; versionName = "0.7.0-alpha" }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
