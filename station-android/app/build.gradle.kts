plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Google Drive sync locks files under app/build — compile on local disk instead.
val stationLocalBuild = file(
    "${System.getenv("LOCALAPPDATA") ?: System.getProperty("java.io.tmpdir")}/ShowrunnerStationBuild/app",
)
layout.buildDirectory.set(stationLocalBuild)

android {
    namespace = "com.showrider.station"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.showrider.station"
        minSdk = 26
        targetSdk = 35
        versionCode = 14
        versionName = "0.1.12"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.webkit:webkit:1.12.1")

    // Chainway DeviceAPI — copy API_Ver20251103 *.aar into app/libs/
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar"))))
}
