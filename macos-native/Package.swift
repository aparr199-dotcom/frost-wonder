// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FrostWonderMac",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "FrostWonderShared",
            targets: ["FrostWonderShared"]
        ),
        .executable(
            name: "FrostWonderMacApp",
            targets: ["FrostWonderMacApp"]
        )
    ],
    targets: [
        .target(
            name: "FrostWonderShared",
            path: "Sources/FrostWonderShared"
        ),
        .executableTarget(
            name: "FrostWonderMacApp",
            dependencies: ["FrostWonderShared"],
            path: "Sources/FrostWonderMacApp"
        ),
        .testTarget(
            name: "FrostWonderSharedTests",
            dependencies: ["FrostWonderShared"],
            path: "Tests/FrostWonderSharedTests"
        )
    ]
)
