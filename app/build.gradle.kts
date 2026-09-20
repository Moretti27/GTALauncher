plugins { id("com.android.application") }
android {
    namespace = "com.icq.reborn"
    compileSdk = 36
    defaultConfig { applicationId = "com.icq.reborn"; minSdk = 26; targetSdk = 36; versionCode = 8; versionName = "0.8.0-alpha" }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
