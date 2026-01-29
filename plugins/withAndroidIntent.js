const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidIntent(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainActivity = androidManifest.manifest.application[0].activity.find(
      (activity) => activity['$']['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];
      mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        category: [
          { $: { 'android:name': 'android.intent.category.DEFAULT' } },
          { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
        ],
        data: [
          {
            $: {
              'android:scheme': 'com.googleusercontent.apps.769894456153-bfven94mmlqj3htlrda1hdo9cf4hru0r',
              'android:path': '/oauth2redirect'
            },
          },
        ],
      });
    }

    return config;
  });
};
