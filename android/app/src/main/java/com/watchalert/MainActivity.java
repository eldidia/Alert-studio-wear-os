package com.watchalert;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends Activity {
    private WebView webView;
    private static final int PERMISSION_REQUEST_CODE = 123;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set a basic background color immediately
        getWindow().setBackgroundDrawableResource(android.R.color.black);

        // Small delay to let the system settle
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            try {
                // Try to initialize WebView
                webView = new WebView(this);
                setupWebView();
                setContentView(webView);
            } catch (Exception e) {
                e.printStackTrace();
                showErrorView("WebView Error: " + e.getMessage());
            }
        }, 100);

        checkPermissions();
    }

    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Optimize for watch display
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidApp");
        
        // Load the shared app URL
        webView.loadUrl("https://ais-pre-y3k5cv2ixjhrkidsg7weac-327783083381.europe-west1.run.app");
    }

    private void showErrorView(String message) {
        TextView errorView = new TextView(this);
        errorView.setText(message + "\n\nPlease ensure Android System WebView is updated.");
        errorView.setTextColor(android.graphics.Color.WHITE);
        errorView.setGravity(Gravity.CENTER);
        errorView.setPadding(20, 20, 20, 20);
        setContentView(errorView);
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void updateConfig(String configJson) {
            SharedPreferences sharedPref = mContext.getSharedPreferences("WatchAlertPrefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.putString("appConfig", configJson);
            editor.apply();
        }

        @JavascriptInterface
        public void updateFilter(String city, boolean filterEnabled, boolean isMonitoring) {
            // Legacy support
            SharedPreferences sharedPref = mContext.getSharedPreferences("WatchAlertPrefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.putString("filterCity", city);
            editor.putBoolean("filterEnabled", filterEnabled);
            editor.putBoolean("isMonitoring", isMonitoring);
            editor.apply();
        }
    }

    private void checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
            } else {
                startAlertService();
            }
        } else {
            startAlertService();
        }
    }

    private void startAlertService() {
        Intent serviceIntent = new Intent(this, AlertService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startAlertService();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
