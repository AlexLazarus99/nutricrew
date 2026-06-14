/**
 * NutriCrew native health bridge — inject BEFORE the miniapp loads.
 *
 * iOS (WKWebView):
 *   WKUserScript(source: bridgeSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
 *
 * Android (WebView):
 *   webView.evaluateJavascript(bridgeSource, null) in onPageStarted,
 *   or addJavascriptInterface + wrapper that sets window.NutriCrewHealth
 *
 * Replace readTodaySteps with real HealthKit / Health Connect reads.
 */
(function () {
  if (window.NutriCrewHealth) return;

  window.NutriCrewHealth = {
    isAvailable: function () {
      return Promise.resolve(true);
    },
    requestPermission: function () {
      // Show system Health permission dialog here in native code.
      return Promise.resolve(true);
    },
    readTodaySteps: function () {
      // TODO: read step count for local calendar day from HealthKit / Health Connect.
      // Must return Promise<{ steps: number, source: "apple_health" | "health_connect" }>
      // or Promise<number> (source inferred from platform).
      return Promise.resolve({ steps: 8432, source: "apple_health" });
    },
  };
})();
