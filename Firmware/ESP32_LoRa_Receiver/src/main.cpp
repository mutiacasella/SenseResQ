/*
 * ESP32 LoRa Receiver — SX1278 via PlatformIO
 *
 * Wiring sama persis dengan Sender:
 *   LoRa NSS   -> GPIO5
 *   LoRa SCK   -> GPIO18
 *   LoRa MOSI  -> GPIO23
 *   LoRa MISO  -> GPIO19
 *   LoRa RESET -> GPIO14
 *   LoRa DIO0  -> GPIO26
 *   LoRa VCC   -> 3.3V
 *   LoRa GND   -> GND
 *
 * Library: LoRa by Sandeep Mistry
 * Frekuensi 433 MHz — harus SAMA dengan sender.
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>

#define LORA_SS     5
#define LORA_RST    14
#define LORA_DIO0   26
#define LORA_FREQ   433E6
#define LORA_SF     7
#define LORA_BW     125E3
#define LORA_CR     5

#define LED_PIN     2

unsigned long packetCount = 0;

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println(F("\n=== ESP32 LoRa Receiver ==="));

  pinMode(LED_PIN, OUTPUT);

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println(F("LoRa init FAILED. Check wiring!"));
    while (1);
  }

  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BW);
  LoRa.setCodingRate4(LORA_CR);

  Serial.println(F("LoRa OK. Waiting for packets...\n"));
}

void loop() {
  int packetSize = LoRa.parsePacket();

  if (packetSize) {
    String received = "";
    while (LoRa.available()) {
      received += (char)LoRa.read();
    }

    int rssi = LoRa.packetRssi();
    packetCount++;

    Serial.println(F("────────────────────────────────────"));
    Serial.print(F("  Packet #"));
    Serial.println(packetCount);
    Serial.print(F("  Data       : "));
    Serial.println(received);
    Serial.print(F("  RSSI       : "));
    Serial.print(rssi);
    Serial.println(F(" dBm"));

    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
  }
}