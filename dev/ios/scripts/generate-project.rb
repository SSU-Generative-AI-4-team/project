require 'xcodeproj'
require 'fileutils'
root = File.expand_path('..', __dir__)
project = Xcodeproj::Project.new(File.join(root, 'Hatcheat.xcodeproj'))
app = project.new_target(:application, 'Hatcheat', :ios, '17.0')
group = project.main_group.new_group('Hatcheat', 'Hatcheat')
%w[HatcheatApp.swift HatcheatViewController.swift ProgressStore.swift HatcheatAnalytics.swift].each { |name| app.source_build_phase.add_file_reference(group.new_file(name)) }
# GoogleService-Info.plist(Firebase 콘솔에서 받는 파일)는 있을 때만 넣는다. 넣은 뒤 이 스크립트를 다시 돌린다.
resources = %w[Assets.xcassets PrivacyInfo.xcprivacy Web]
resources << 'GoogleService-Info.plist' if File.exist?(File.join(root, 'Hatcheat', 'GoogleService-Info.plist'))
resources.each do |name|
  ref = group.new_file(name)
  ref.last_known_file_type = 'folder' if name == 'Web'
  app.resources_build_phase.add_file_reference(ref)
end
group.new_file('Info.plist')
# 측정 SDK: Firebase(GA4 → Google Ads)와 Meta. 설정이 없으면 앱이 켜지 않는다(HatcheatAnalytics.swift).
{ 'https://github.com/firebase/firebase-ios-sdk.git' => ['13.0.0', %w[FirebaseAnalytics]],
  'https://github.com/facebook/facebook-ios-sdk.git' => ['19.0.0', %w[FacebookCore]] }.each do |url, (version, products)|
  package = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
  package.repositoryURL = url
  package.requirement = { 'kind' => 'upToNextMajorVersion', 'minimumVersion' => version }
  project.root_object.package_references << package
  products.each do |name|
    dependency = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
    dependency.package = package
    dependency.product_name = name
    app.package_product_dependencies << dependency
    build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
    build_file.product_ref = dependency
    app.frameworks_build_phase.files << build_file
  end
end
phase = app.new_shell_script_build_phase('Bundle current web app')
phase.shell_script = "set -e\nexport PATH=\"/opt/homebrew/bin:/usr/local/bin:$PATH\"\ncd \"$SRCROOT\"\nnode scripts/bundle-web.mjs\n"
phase.always_out_of_date = '1'
app.build_phases.move(phase, 0)
app.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.ai.haetchi',
    'INFOPLIST_FILE' => 'Hatcheat/Info.plist',
    'DEVELOPMENT_TEAM' => 'P6Z68QUK9M',
    'CODE_SIGN_STYLE' => 'Automatic',
    'SWIFT_VERSION' => '5.0',
    'MARKETING_VERSION' => '1.0',
    'CURRENT_PROJECT_VERSION' => '3',
    # Meta 앱 대시보드의 앱 ID와 클라이언트 토큰. 비어 있으면 Meta SDK를 켜지 않는다.
    'META_APP_ID' => '',
    'META_CLIENT_TOKEN' => '',
    'TARGETED_DEVICE_FAMILY' => '1,2',
    'ASSETCATALOG_COMPILER_APPICON_NAME' => 'AppIcon',
    'ENABLE_USER_SCRIPT_SANDBOXING' => 'NO',
    'SUPPORTS_MACCATALYST' => 'NO',
    'SWIFT_EMIT_LOC_STRINGS' => 'NO'
  })
  config.build_settings['DEBUG_INFORMATION_FORMAT'] = 'dwarf-with-dsym' if config.name == 'Release'
end
tests = project.new_target(:unit_test_bundle, 'HatcheatTests', :ios, '17.0')
tests.add_dependency(app)
test_group = project.main_group.new_group('HatcheatTests', 'HatcheatTests')
tests.source_build_phase.add_file_reference(test_group.new_file('HatcheatTests.swift'))
tests.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.ai.haetchi.tests',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'SWIFT_VERSION' => '5.0',
    'TEST_HOST' => '$(BUILT_PRODUCTS_DIR)/Hatcheat.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/Hatcheat',
    'BUNDLE_LOADER' => '$(TEST_HOST)',
    'DEVELOPMENT_TEAM' => 'P6Z68QUK9M',
    'TARGETED_DEVICE_FAMILY' => '1,2'
  })
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.configure_with_targets(app, tests)
scheme.save_as(project.path, 'Hatcheat', true)
puts project.path
