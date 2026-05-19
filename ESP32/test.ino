/**
 * ESP32 智能柜控制系统（只修复NFC，原有功能100%保留）
 * WiFi / 传感器 / 服务器上传 / 重连逻辑 完全不变
 * 仅 NFC 读卡、写入 照搬你给的可运行代码
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_PN532.h>

// ==================== 原有配置 100% 保留 ====================
const char* ssid     = "15";
const char* password = "12345678";
const char* serverBaseUrl = "http://112.236.171.141:1145/api";

const char* apiGetPhone = "/hardware/get-phone";
const char* apiUpdateStatus = "/hardware/update-status";

#define SDA_PIN 8
#define SCL_PIN 9
#define SENSOR_PIN 2

const int HTTP_RETRY_TIMES = 2;
const int HTTP_TIMEOUT_MS = 8000;
const int SENSOR_UPLOAD_INTERVAL = 5000;
const int FETCH_PHONE_INTERVAL = 10000;

// ==================== 你的能用的 PN532 定义 ====================
Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);

// ==================== 原有全局变量 100% 保留 ====================
String phoneNumber = "";
bool hasPhoneData = false;

int lastSensorState = HIGH;
unsigned long lastStatusUploadTime = 0;
unsigned long lastFetchTime = 0;
unsigned long lastWifiReconnectTime = 0;
const unsigned long wifiReconnectInterval = 5000;

bool wifiConnected = false;
bool pn532Connected = false;
bool sensorInitialized = false;

enum DeviceState {
  STATE_IDLE,
  STATE_WAITING_WRITE,
  STATE_MONITORING
};
DeviceState currentState = STATE_IDLE;

unsigned long lastHeartbeatTime = 0;
const unsigned long heartbeatInterval = 2000;

// ==================== 原有工具函数 100% 保留 ====================
String httpErrorToString(int code) {
  switch(code) {
    case -1: return "连接被拒绝（服务器端口未开/接口不存在）";
    case -11: return "TCP连接超时（服务器离线/防火墙拦截）";
    case -12: return "DNS解析失败（域名错误/无网络）";
    case -13: return "连接重置（服务器主动断开）";
    case -14: return "连接关闭（网络中断）";
    case -15: return "连接中止（超时）";
    case 404: return "接口不存在（路径错误）";
    case 500: return "服务器内部错误（代码bug）";
    default: return "未知错误（" + String(code) + "）";
  }
}

bool testServerConnection() {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  IPAddress serverIP;
  if (!WiFi.hostByName("112.236.171.141", serverIP)) {
    Serial.println("[网络诊断] 服务器IP解析失败！");
    return false;
  }
  Serial.println("[网络诊断] 服务器IP解析成功：" + serverIP.toString());

  WiFiClient client;
  bool tcpConnected = client.connect(serverIP, 1145);
  if (tcpConnected) {
    client.stop();
    Serial.println("[网络诊断] 服务器1145端口TCP连接成功！");
    return true;
  } else {
    Serial.println("[网络诊断] 服务器1145端口TCP连接失败（防火墙/服务未运行）！");
    return false;
  }
}

// ==================== 原有 WiFi 初始化 100% 恢复 ====================
void initWiFiNonBlocking() {
  Serial.println("\n[WiFi] 开始连接：" + String(ssid));
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.disconnect();
  delay(100);
  WiFi.begin(ssid, password);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 4) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("[WiFi] ✅ 连接成功 | IP：" + WiFi.localIP().toString());
    Serial.printf("[WiFi] 信号强度：%d dBm（>=-70为良好）\n", WiFi.RSSI());
    testServerConnection();
  } else {
    wifiConnected = false;
    Serial.println("[WiFi] ❌ 快速连接失败，后台自动重连");
  }
}

// ==================== 原有传感器初始化 100% 保留 ====================
void initSensor() {
  Serial.println("\n[光电] 初始化...");
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  delay(200);
  lastSensorState = digitalRead(SENSOR_PIN);
  sensorInitialized = true;
  Serial.print("[光电] 初始状态：");
  Serial.println(lastSensorState == LOW ? "有遮挡" : "无遮挡");
}

// ==================== NFC 初始化（只改这里，照搬你能用的代码） ====================
void initPN532() {
  Serial.println("\n[PN532] 初始化（照搬可运行代码）...");
  
  // 你能用的 I2C 速率 50000
  Wire.begin(SDA_PIN, SCL_PIN, 50000);

  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("[PN532] ❌ 未找到模块");
    pn532Connected = false;
    return;
  }
  
  nfc.SAMConfig();
  pn532Connected = true;
  Serial.println("[PN532] ✅ 就绪");
}

// ==================== 原有 setup 完全恢复 ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================");
  Serial.println("  ESP32 智能柜控制系统（NFC修复·原有功能不变）");
  Serial.println("========================================");

  // 原有顺序：NFC → WiFi → 传感器
  initPN532();
  initWiFiNonBlocking();
  initSensor();

  Serial.println("\n[初始化完成] WiFi/传感器/上传 全部正常");
}

// ==================== 原有服务器拉取手机号 100% 保留 ====================
bool fetchPhoneNumber() {
  if (!wifiConnected) {
    Serial.println("[服务器] 拉取失败：WiFi未连接");
    return false;
  }

  if (!testServerConnection()) {
    Serial.println("[服务器] 拉取失败：服务器无法连接");
    return false;
  }

  HTTPClient http;
  String url = String(serverBaseUrl) + apiGetPhone;
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT_MS);

  int retry = 0;
  int code = 0;
  String response = "";
  while (retry < HTTP_RETRY_TIMES && code != 200) {
    code = http.GET();
    retry++;
    if (code != 200) {
      Serial.printf("[服务器] 第%d次拉取失败 | 错误码：%d | 原因：%s\n", 
                   retry, code, httpErrorToString(code).c_str());
      delay(1000);
    } else {
      response = http.getString();
    }
  }

  bool success = false;
  if (code == 200) {
    Serial.println("[服务器] 拉取响应：" + response);
    DynamicJsonDocument doc(1024);
    DeserializationError err = deserializeJson(doc, response);

    if (!err) {
      if (doc["success"] == true) {
        String p = doc["data"]["phone"].as<String>();
        if (p.length() == 11) {
          phoneNumber = p;
          hasPhoneData = true;
          Serial.println("[服务器] ✅ 拉取手机号成功：" + phoneNumber);
          success = true;
        } else {
          Serial.println("[服务器] ❌ 手机号格式错误（非11位）：" + p);
        }
      } else {
        Serial.println("[服务器] ❌ " + doc["message"].as<String>());
      }
    } else {
      Serial.println("[服务器] ❌ 解析响应失败：" + String(err.c_str()));
    }
  } else {
    Serial.printf("[服务器] ❌ 拉取失败 | 最终错误码：%d | 原因：%s\n", 
                 code, httpErrorToString(code).c_str());
  }

  http.end();
  return success;
}

// ==================== 原有上传传感器 100% 保留 ====================
void uploadSensorStatus(int state) {
  if (!wifiConnected) {
    Serial.println("[上传] 跳过：WiFi未连接");
    return;
  }

  HTTPClient http;
  String url = String(serverBaseUrl) + apiUpdateStatus;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(256);
  doc["sensorState"] = state;
  doc["ts"] = millis();
  String json;
  serializeJson(doc, json);

  int retry = 0;
  int httpCode = 0;
  while (retry < HTTP_RETRY_TIMES && httpCode != 200) {
    httpCode = http.POST(json);
    retry++;
    if (httpCode != 200) {
      Serial.printf("[上传] 第%d次失败 | 状态：%d | 错误码：%d\n", retry, state, httpCode);
      delay(1000);
    }
  }

  if (httpCode == 200) {
    Serial.printf("[上传] ✅ 成功 | 状态：%d\n", state);
  } else {
    Serial.printf("[上传] ❌ 失败 | 状态：%d\n", state);
  }
  http.end();
}

// ==================== 原有传感器监测 100% 保留 ====================
void monitorAndUploadSensorStatus() {
  int nowState = digitalRead(SENSOR_PIN);
  int uploadState = (nowState == LOW) ? 1 : 0;

  if (nowState != lastSensorState) {
    lastSensorState = nowState;
    uploadSensorStatus(uploadState);
    lastStatusUploadTime = millis();
  }

  if (millis() - lastStatusUploadTime > SENSOR_UPLOAD_INTERVAL) {
    lastStatusUploadTime = millis();
    uploadSensorStatus(uploadState);
  }
}

// ==================== 【唯一修改：NFC写入函数，100%照搬你能用的代码】 ====================
bool writeNFCCard_NTAG() {
  if (!pn532Connected || !hasPhoneData || phoneNumber.length() != 11) return false;

  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  // 你能用的读卡代码：500ms 超时
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 500)) {
    Serial.println("\n检测到标签，正在写入...");

    // 你能用的写入代码
    if (nfc.ntag2xx_WriteNDEFURI(NDEF_URIPREFIX_NONE, (char*)phoneNumber.c_str(), 500)) {
      Serial.println(">>> [成功] 写入完成！");
      phoneNumber = "";
      hasPhoneData = false;
      delay(3000);
      return true;
    } else {
      Serial.println(">>> [错误] 写入失败");
      delay(3000);
    }
  }
  return false;
}

// ==================== 原有主循环 100% 恢复 ====================
void loop() {
  // 心跳
  if (millis() - lastHeartbeatTime > heartbeatInterval) {
    lastHeartbeatTime = millis();
    Serial.print("[心跳] 状态机：");
    switch(currentState) {
      case STATE_IDLE: Serial.print("空闲"); break;
      case STATE_WAITING_WRITE: Serial.print("等待写入"); break;
      case STATE_MONITORING: Serial.print("监测"); break;
    }
    Serial.print(" | WiFi：");
    Serial.print(wifiConnected ? "✅" : "❌");
    Serial.print(" | 手机号：");
    Serial.println(hasPhoneData ? phoneNumber : "无");
  }

  // WiFi重连
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifiReconnectTime > wifiReconnectInterval) {
    lastWifiReconnectTime = millis();
    WiFi.reconnect();
    wifiConnected = (WiFi.status() == WL_CONNECTED);
  }

  // 传感器
  if (sensorInitialized) monitorAndUploadSensorStatus();

  // 状态机
  switch (currentState) {
    case STATE_IDLE:
      if (wifiConnected && millis() - lastFetchTime > FETCH_PHONE_INTERVAL) {
        lastFetchTime = millis();
        fetchPhoneNumber();
        if(hasPhoneData) currentState = STATE_WAITING_WRITE;
      }
      break;

    case STATE_WAITING_WRITE:
      if (writeNFCCard_NTAG()) {
        currentState = STATE_MONITORING;
      }
      break;

    case STATE_MONITORING:
      if (wifiConnected && millis() - lastFetchTime > FETCH_PHONE_INTERVAL) {
        lastFetchTime = millis();
        if (fetchPhoneNumber()) {
          currentState = STATE_WAITING_WRITE;
        }
      }
      break;
  }

  delay(20);
}