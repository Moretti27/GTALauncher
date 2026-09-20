plugins { id("com.android.application") }
android {
    namespace = "com.icq.reborn"
    compileSdk = 36
    signingConfigs {
        create("stableDebug") {
            storeFile = rootProject.file("icq-reborn-test.jks")
            storePassword = "icqreborn-test"
            keyAlias = "icqreborn"
            keyPassword = "icqreborn-test"
        }
    }
    defaultConfig { applicationId = "com.icq.reborn"; minSdk = 26; targetSdk = 36; versionCode = 32; versionName = "0.32.0-alpha" }
    buildTypes {
        getByName("debug") { signingConfig = signingConfigs.getByName("stableDebug") }
        release { isMinifyEnabled = false; signingConfig = signingConfigs.getByName("stableDebug") }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
