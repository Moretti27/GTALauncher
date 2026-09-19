plugins { id("com.android.application") }
android {
    namespace = "com.aska.p2p"
    compileSdk = 36
    defaultConfig { applicationId = "com.aska.p2p"; minSdk = 26; targetSdk = 36; versionCode = 5; versionName = "0.5.0-alpha" }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
